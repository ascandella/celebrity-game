import { Dispatch } from "redux";
import {
  JoinGameRequest,
  CreateGameRequest,
  JoinTeamRequest,
} from "./messages";
import {
  connectionStatus,
  connectError,
  setConnecting,
  receivedMessage,
} from "../actions";

function getGameURL(): string {
  const base = `${process.env.apiBase}/game`;
  // For remote debugging in development
  return base.replace("localhost", window.location.host.split(":")[0]);
}

export default class CelebrityClient {
  connected = false;

  wsClient: WebSocket;

  dispatch: Dispatch;

  constructor(dispatch: Dispatch) {
    this.dispatch = dispatch;
  }

  connect(): Promise<Event | null> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve(null);
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
      console.error("Unable to parse server response: ", err, event.data);
    }
  }

  close(): void {
    this.wsClient.close();
    this.connected = false;
  }

  async sendCommand(
    command: string,
    data: { [key: string]: any },
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
      }),
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

  createGame(request: CreateGameRequest): void {
    this.sendCommand("create", {
      create: request,
    });
  }

  joinTeam({ name }: JoinTeamRequest): void {
    this.sendCommand("join-team", {
      team: {
        name,
      },
    });
  }

  setWords(words: string[]): void {
    this.sendCommand("set-words", {
      words,
    });
  }

  startGame(): void {
    this.sendCommand("start-game", {});
  }

  startTurn(): void {
    this.sendCommand("start-turn", {});
  }

  skipWord(): void {
    this.sendCommand("skip-word", {});
  }

  countGuess(): void {
    this.sendCommand("count-guess", {});
  }

  sendMessage(message: string): void {
    this.sendCommand("send-message", {
      message,
    });
  }
}
