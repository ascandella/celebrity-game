import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import CelebrityClient from "../clients/celebrity";
import { RootState } from "../reducers";

const StartButton = styled.button.attrs({
  className:
    "bg-orange-500 hover:bg-orange-400 text-white font-bold py-2 px-4 border-b-4 border-orange-700 hover:border-orange-500 rounded",
})``;

type ControlProps = {
  isStartable: boolean;
  isCreator: boolean;
  client: CelebrityClient;
};

const GameControls: FunctionComponent<ControlProps> = ({
  isStartable,
  isCreator,
  client,
}: ControlProps) => {
  if (!isStartable || !isCreator) {
    return null;
  }

  return (
    <StartButton onClick={() => client.startGame()}>Start Game</StartButton>
  );
};

const mapStateToProps = (state: RootState) => ({
  isStartable: state.screen === "select-words",
  isCreator: state.isCreator,
});

export default connect(mapStateToProps)(GameControls);
