export interface Player {
  id: string;
  name: string;
}

export interface Team {
  name: string;
  players: Player[];
}

export interface ActivePlayer {
  id: string;
  name: string;
  team: string;
}
