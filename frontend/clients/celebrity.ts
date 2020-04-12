import { Dispatch, Store } from "redux";
import { JoinGameRequest, CreateGameRequest } from "./messages";
import {
  connectionStatus,
  connectError,
  setConnecting,
  receivedMessage,
} from "../actions";

function getGameURL(): string {
  return `${process.env.apiBase}/game`;
}

const pingTime = 10000;

export default class CelebrityClient {
  connected = false;

  wsClient: WebSocket;

  pingInterval: number;

  lastPingSent: number;

  lastPongReceived: number;

  store: Store;

  dispatch: Dispatch;

  constructor(dispatch: Dispatch) {
    this.dispatch = dispatch;
  }

  connect(): Promise<Event> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
      }

      this.wsClient = new WebSocket(getGameURL());
      this.wsClient.addEventListener("close", () => {
        this.connected = false;
        this.dispatch(connectionStatus("closed"));
        if (this.pingInterval) {
          window.clearInterval(this.pingInterval);
        }
        // TODO: try to reconnect after a backoff
      });

      this.wsClient.addEventListener("error", () => {
        reject(new Error("Unable to connect to server"));
        this.dispatch(connectionStatus("error"));
        if (this.pingInterval) {
          window.clearTimeout(this.pingInterval);
        }
      });

      this.wsClient.addEventListener("message", (event) => {
        this.onMessage(event);
      });

      this.wsClient.addEventListener("open", (event) => {
        this.connected = true;
        this.dispatch(connectionStatus("connected"));
        resolve(event);
      });
    });
  }

  onMessage(event): void {
    if (!event.data) {
      /* eslint-disable no-console */
      console.error("Got empty websocket message");
      return;
    }
    try {
      const message = JSON.parse(event.data);
      this.dispatch(receivedMessage(message));
    } catch (err) {
      /* eslint-disable no-console */
      console.error("Unable to parse server response: ", event.data);
    }
  }

  ping(): void {
    if (this.lastPingSent) {
      if (
        !this.lastPongReceived ||
        this.lastPingSent - this.lastPongReceived > pingTime
      ) {
        this.dispatch(connectionStatus("pong-timeout"));
      } else {
        this.dispatch(connectionStatus("pong-ok"));
      }
    }
    this.sendCommand("ping", {});
    this.lastPingSent = Date.now();
  }

  close(): void {
    this.wsClient.close();
    this.connected = false;
  }

  async sendCommand(
    command: string,
    data: { [key: string]: any }
  ): Promise<void> {
    if (!this.connected) {
      this.dispatch(setConnecting(true));
      try {
        await this.connect();
      } catch (err) {
        this.dispatch(connectError(err));
      }
      this.dispatch(setConnecting(false));
    }

    this.wsClient.send(
      JSON.stringify({
        ...data,
        command,
      })
    );
  }

  joinedGame(): void {
    // TODO: move this to the connection tatus component
    //
    // Start a healthcheck, so we can display a UI element
    // if we detect requests failing.
    this.pingInterval = window.setInterval(() => this.ping(), pingTime);
  }

  joinGame({ userName, roomCode, clientID }: JoinGameRequest): void {
    this.sendCommand("join", {
      join: {
        name: userName,
        clientId: clientID,
        roomCode,
      },
    });
  }

  // TODO change this logic since we're now surfacing it to the client
  //     if (response.error) {
  //       this.close();
  //       if (response.code == "id-conflict") {
  //         return this.joinGame({ userName, roomCode });
  //       }
  //       throw new Error(response.error);
  //     }

  //     this.joinedGame(response);
  //     return response;
  //   } catch (err) {
  //   }
  // }

  createGame({ userName, maxPlayers }: CreateGameRequest): void {
    this.sendCommand("create", {
      create: {
        name: userName,
        maxPlayers,
      },
    });
  }
}
