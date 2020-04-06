const developmentServer = "ws://localhost:3030";

function getGameURL(): string {
  let base = developmentServer;
  if (process.env.apiBase) {
    base = process.env.apiBase;
  }
  return `${base}/echo`;
}

export default class CelebrityClient {
  connected = false;

  wsClient: WebSocket;

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
        // TODO(aiden) thread this through
        /* eslint-disable no-console */
        console.log("Message", event.data);
      });

      this.wsClient.addEventListener("open", (event) => {
        resolve(event);
      });
    });
  }
}
