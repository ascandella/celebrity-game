import { Store } from "redux";
import { JoinGameRequest, CreateGameRequest, Response } from "./messages";
import { connectionStatus, joinedGame } from "../actions";

function getGameURL(): string {
  return `${process.env.apiBase}/game`;
}

const pingTime = 10000;

export default class CelebrityClient {
  connected = false;

  wsClient: WebSocket;

  // TODO: is it a good idea to always queue these?
  messageQueue = [];

  nextMessageCallback?: (Response) => void;

  pingInterval: number;

  lastPingSent: number;

  lastPongReceived: number;

  store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  connect(): Promise<Event> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
      }

      this.wsClient = new WebSocket(getGameURL());
      this.wsClient.addEventListener("close", () => {
        this.connected = false;
        this.store.dispatch(connectionStatus("closed"));
        if (this.pingInterval) {
          window.clearInterval(this.pingInterval);
        }
        // TODO: try to reconnect after a backoff
      });

      this.wsClient.addEventListener("error", () => {
        reject(new Error("Unable to connect to server"));
        this.store.dispatch(connectionStatus("error"));
        if (this.pingInterval) {
          window.clearTimeout(this.pingInterval);
        }
      });

      this.wsClient.addEventListener("message", (event) => {
        this.onMessage(event);
      });

      this.wsClient.addEventListener("open", (event) => {
        this.connected = true;
        this.store.dispatch(connectionStatus("connected"));
        resolve(event);
      });
    });
  }

  onMessage(event): void {
    if (!event.data) {
      return;
    }
    let message;
    try {
      message = JSON.parse(event.data);
    } catch (err) {
      /* eslint-disable no-console */
      console.error("Unable to parse server response: ", event.data);
      return;
    }
    if (message.pong) {
      this.lastPongReceived = Date.now();
      return;
    }

    // Somebody is awaiting a response
    if (this.nextMessageCallback) {
      this.nextMessageCallback(message);
      this.nextMessageCallback = null;
    } else {
      this.messageQueue.push(message);
    }
  }

  ping(): void {
    if (this.lastPingSent) {
      if (
        !this.lastPongReceived ||
        this.lastPingSent - this.lastPongReceived > pingTime
      ) {
        this.store.dispatch(connectionStatus("pong-timeout"));
      } else {
        this.store.dispatch(connectionStatus("pong-ok"));
      }
    }
    this.sendCommand("ping", {});
    this.lastPingSent = Date.now();
  }

  getResponse(): Promise<Response> {
    // TODO: handle rejection
    return new Promise((resolve) => {
      if (this.messageQueue.length === 0) {
        this.nextMessageCallback = resolve;
      } else {
        resolve(this.messageQueue.shift());
      }
    });
  }

  close(): void {
    this.wsClient.close();
    this.connected = false;
  }

  async sendCommand(
    command: string,
    data: { [key: string]: any }
  ): Promise<Response> {
    if (!this.connected) {
      await this.connect();
    }

    this.wsClient.send(
      JSON.stringify({
        ...data,
        command,
      })
    );

    const response = await this.getResponse();
    // TODO(aiden): have a development mode switch here
    /* eslint-disable no-console */
    console.log("Response: ", response);
    if (response.error) {
      throw new Error(response.error);
    }

    return response;
  }

  joinedGame(response: Response): void {
    this.store.dispatch(joinedGame(response));

    window.localStorage.setItem("client-id", response.clientId);
    window.localStorage.setItem("client-name", response.name);
    window.localStorage.setItem("room-code", response.roomCode);

    // Start a healthcheck, so we can display a UI element
    // if we detect requests failing.
    this.pingInterval = window.setInterval(() => this.ping(), pingTime);
  }

  async joinGame({
    userName,
    roomCode,
    clientID,
  }: JoinGameRequest): Promise<Response> {
    // TODO make this a const
    try {
      const response = await this.sendCommand("join", {
        join: {
          name: userName,
          clientId: clientID,
          roomCode,
        },
      });

      this.joinedGame(response);
      return response;
    } catch (err) {
      this.close();
      if (err.message.indexOf("already exists") !== -1 && clientID) {
        return this.joinGame({ userName, roomCode });
      }
      throw err;
    }
  }

  async createGame({
    userName,
    maxPlayers,
  }: CreateGameRequest): Promise<Response> {
    const response = await this.sendCommand("create", {
      create: {
        name: userName,
        maxPlayers,
      },
    });
    this.joinedGame(response);
    return response;
  }
}
