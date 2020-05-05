import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import CelebrityClient from "../../clients/celebrity";
import { ActivePlayer } from "../../types/team";
import Scoreboard from "./scoreboard";
import WhosUp from "./whos-up";
import GuessBox from "./guess-box";
import CurrentWord from "./current-word";
import Timer from "./timer";

type InGameProps = {
  client: CelebrityClient;
  inRound: boolean;
  currentPlayer: ActivePlayer;
  nextPlayer: ActivePlayer;
  clientID: string;
};

const InGameContainer: FunctionComponent<InGameProps> = ({
  inRound,
  client,
}: InGameProps) => {
  if (!inRound) {
    return null;
  }

  return (
    <div>
      <Timer />
      <WhosUp client={client} />
      <CurrentWord />
      <GuessBox client={client} />
      <Scoreboard />
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  inRound: state.screen === "round",
  currentPlayer: state.currentPlayer,
  nextPlayer: state.nextPlayer,
  clientID: state.clientID,
});

export default connect(mapStateToProps)(InGameContainer);
