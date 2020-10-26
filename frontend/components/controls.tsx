import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import CelebrityClient from "../clients/celebrity";
import { RootState } from "../reducers";

type ControlProps = {
  isStartable: boolean;
  hasControl: boolean;
  client: CelebrityClient;
};

const GameControls: FunctionComponent<ControlProps> = ({
  isStartable,
  hasControl,
  client,
}: ControlProps) => {
  if (!isStartable || !hasControl) {
    return null;
  }

  return (
    <button
      className="px-4 py-2 font-bold text-white border-b-4 border-orange-700 rounded hover:border-orange-500 bg-pink-gradient"
      onClick={() => client.startGame()}
    >
      Start Game
    </button>
  );
};

const mapStateToProps = (state: RootState) => ({
  isStartable: state.screen === "select-words",
  hasControl: state.hasControl,
});

export default connect(mapStateToProps)(GameControls);
