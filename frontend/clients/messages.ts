export type JoinGameRequest = {
  userName: string;
  roomCode: string;
  clientID?: string;
};

export type CreateGameRequest = {
  userName: string;
  maxPlayers: number;
};

export type GameEvent = {
  error?: string;
  code?: string;
  event: string;
  [key: string]: any;
};
