import { Player } from "./team";

export type Message = {
  text: string;
  system: boolean;
  correct: boolean;
  roundEnd: boolean;
  player: Player;
};
