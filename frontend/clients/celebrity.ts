import { EventEmitter } from "events";
import { JoinGameRequest, CreateGameRequest, Response } from "./messages";

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

  events: EventEmitter;

  pingInterval: number;

  lastPingSent: number;

  lastPongReceived: number;

  playerName?: string;

  constructor() {
    this.events = new EventEmitter();
  }

  connect(): Promise<Event> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
      }

      this.wsClient = new WebSocket(getGameURL());
      this.wsClient.addEventListener("close", () => {
        this.connected = false;
        this.events.emit("connection-status", "closed");
        if (this.pingInterval) {
          window.clearInterval(this.pingInterval);
        }
        // TODO: try to reconnect after a backoff
      });

      this.wsClient.addEventListener("error", () => {
        reject(new Error("Unable to connect to server"));
        this.events.emit("connection-status", "error");
        if (this.pingInterval) {
          window.clearTimeout(this.pingInterval);
        }
      });

      this.wsClient.addEventListener("message", (event) => {
        this.onMessage(event);
      });

      this.wsClient.addEventListener("open", (event) => {
        this.connected = true;
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
        this.events.emit("connection-status", "pong-timeout");
      } else {
        this.events.emit("connection-status", "pong-ok");
      }
    }
    this.sendCommand("ping", { name: this.playerName });
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
    this.events.emit("join", response);
    this.playerName = response.name;

    // Start a healthcheck, so we can display a UI element
    // if we detect requests failing.
    this.pingInterval = window.setInterval(() => this.ping(), pingTime);
  }

  async joinGame({ userName, roomCode }: JoinGameRequest): Promise<Response> {
    // TODO make this a const
    const response = await this.sendCommand("join", {
      join: {
        name: userName,
        roomCode,
      },
    });
    this.joinedGame(response);
    return response;
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
