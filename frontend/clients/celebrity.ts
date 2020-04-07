import { EventEmitter } from "events";

function getGameURL(): string {
  return `${process.env.apiBase}/game`;
}

export type Response = {
  error?: string;
  [key: string]: any;
};

export default class CelebrityClient {
  connected = false;

  wsClient: WebSocket;

  // TODO: is it a good idea to always queue these?
  messageQueue = [];

  nextMessageCallback?: (Response) => void;

  events: EventEmitter;

  constructor() {
    this.events = new EventEmitter();
  }

  connect(): Promise<Event> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
      }

      this.wsClient = new WebSocket(getGameURL());
      this.wsClient.addEventListener("error", (event) => {
        reject(event);
      });
      this.wsClient.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);

        // Somebody is awaiting a response
        if (this.nextMessageCallback) {
          this.nextMessageCallback(message);
          this.nextMessageCallback = null;
        } else {
          this.messageQueue.push(message);
        }
      });

      this.wsClient.addEventListener("open", (event) => {
        resolve(event);
      });
    });
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
      throw response.error;
    }

    return response;
  }

  async joinGame({ userName, roomCode }): Promise<Response> {
    // TODO make this a const
    const response = await this.sendCommand("join", {
      join: {
        name: userName,
        roomCode,
      },
    });
    this.events.emit("join", response);
    return response;
  }
}
