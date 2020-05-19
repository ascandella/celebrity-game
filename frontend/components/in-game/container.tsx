import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import CelebrityClient from "../../clients/celebrity";
import { ActivePlayer } from "../../types/team";
import Scoreboard from "./scoreboard";
import WhosUp from "./whos-up";
import GuessBox from "./guess-box";
import CurrentWord from "./current-word";
import ActorControls from "./actor-controls";

type InGameProps = {
  client: CelebrityClient;
  inRound: boolean;
  gameOver: boolean;
  currentPlayer: ActivePlayer;
  nextPlayer: ActivePlayer;
  clientID: string;
};

const InGameContainer: FunctionComponent<InGameProps> = ({
  inRound,
  client,
  gameOver,
}: InGameProps) => {
  if (!inRound && !gameOver) {
    return null;
  }

  return (
    <div>
      {inRound && (
        <div>
          <WhosUp client={client} />
          <CurrentWord />
          <ActorControls client={client} />
        </div>
      )}
      {gameOver && (
        <div className="mb-4 justify-center text-center">
          <div className="bg-green-500 text-white font-bold px-4 py-1">
            Game Over
          </div>
          <div className="border border-t-0 border-green-400 bg-green-100 px-4 py-2">
            <div>Thanks for playing</div>
          </div>
        </div>
      )}
      <GuessBox client={client} />
      <Scoreboard />
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  inRound: state.screen === "round",
  gameOver: state.screen === "game-over",
  currentPlayer: state.currentPlayer,
  nextPlayer: state.nextPlayer,
  clientID: state.clientID,
});

export default connect(mapStateToProps)(InGameContainer);
