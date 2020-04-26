export interface Player {
  id: string;
  name: string;
}

export interface Team {
  name: string;
  players: player[];
}
