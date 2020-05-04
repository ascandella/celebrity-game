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
    <div className="mx-auto p-2 mb-4 h-64 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl border">
      Guesses will go here...
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  currentPlayer: state.currentPlayer,
  myTurn: state.myTurn,
  clientID: state.clientID,
});
export default connect(mapStateToProps)(GuessBox);
