import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import CelebrityClient from "../../clients/celebrity";
import { ActivePlayer } from "../../types/team";
import Scoreboard from "./scoreboard";

type InGameProps = {
  client: CelebrityClient;
  inRound: boolean;
  currentPlayer: ActivePlayer;
  nextPlayer: ActivePlayer;
  clientID: string;
};

const InGameContainer: FunctionComponent<InGameProps> = ({
  inRound,
  currentPlayer,
  nextPlayer,
}: InGameProps) => {
  if (!inRound) {
    return null;
  }

  return (
    <div>
      <Scoreboard />
      <div>Currently Up: {currentPlayer.name}</div>
      <div>Next Up: {nextPlayer.name}</div>
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
