export type JoinGameRequest = {
  userName: string;
  roomCode: string;
  clientID?: string;
};
  
export type CreateGameRequest = {
  userName: string;
  maxPlayers: number;
};

export type Response = {
  error?: string;
  [key: string]: any;
};
