function getGameURL(): string {
  return `${process.env.apiBase}/game`;
}

export type Response = {
  error?: string;
};

export default class CelebrityClient {
  connected = false;

  wsClient: WebSocket;

  // TODO: is it a good idea to always queue these?
  messageQueue = [];

  nextMessageCallback?: (Response) => void;

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
        }
        this.messageQueue.push(message);
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
}
