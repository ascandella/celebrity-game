import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import CelebrityClient from "../../clients/celebrity";
import { ActivePlayer } from "../../types/team";

type GuessBoxProps = {
  currentPlayer: ActivePlayer;
  myTurn: boolean;
  client: CelebrityClient;
};

const GuessBox: FunctionComponent<GuessBoxProps> = (/* {
  currentPlayer,
  myTurn,
}: GuessBoxProps */) => {
  return (
    <div className="flex h-56 justify-center mb-4 border">
      <div className="w-full">Guesses will go here...</div>
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  currentPlayer: state.currentPlayer,
  myTurn: state.myTurn,
  clientID: state.clientID,
});
export default connect(mapStateToProps)(GuessBox);
