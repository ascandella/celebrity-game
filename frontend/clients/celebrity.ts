import { Dispatch } from "redux";
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

export default class CelebrityClient {
  connected = false;

  wsClient: WebSocket;

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
        // wait 50ms so the connection status doesn't flicker
        // when reloading the page
        setTimeout(() => {
          this.dispatch(connectionStatus("closed"));
        }, 50);
      });

      this.wsClient.addEventListener("error", () => {
        reject(new Error("Unable to connect to server"));
        this.dispatch(connectionStatus("error"));
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
        this.dispatch(connectError());
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

  joinGame({ userName, roomCode, clientID }: JoinGameRequest): void {
    this.sendCommand("join", {
      join: {
        name: userName,
        clientId: clientID,
        roomCode,
      },
    });
  }

  createGame({ userName, maxPlayers }: CreateGameRequest): void {
    this.sendCommand("create", {
      create: {
        name: userName,
        maxPlayers,
      },
    });
  }
}
