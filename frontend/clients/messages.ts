export type JoinGameRequest = {
  userName: string;
  roomCode: string;
  clientID?: string;
};

export type CreateGameRequest = {
  name: string;
  maxPlayers: number;
  maxSubmissions: number;
  teams: string[];
};

export type GameEvent = {
  error?: string;
  code?: string;
  event: string;
  [key: string]: any;
};

export type JoinTeamRequest = {
  name: string;
};
