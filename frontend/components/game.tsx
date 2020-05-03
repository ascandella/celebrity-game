import React, { useEffect, FunctionComponent } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import ConnectionStatus from "./connection-status";
import WordChooser from "./word-chooser";
import TeamPicker from "./team-picker";
import GameControls from "./controls";
import { RootState } from "../reducers";
import CelebrityClient from "../clients/celebrity";

type player = {
  id: string;
  name: string;
};

type GameProps = {
  gameCode: string;
  playerName: string;
  inGame: boolean;
  isCreator: boolean;
  client: CelebrityClient;
};

const GameHeader = styled.div.attrs({
  className: "flex justify-center",
})``;

const Game: FunctionComponent<GameProps> = ({
  gameCode,
  inGame,
  client,
  isCreator,
}: GameProps) => {
  if (!inGame) {
    return null;
  }
  useEffect(() => {
    window.location.hash = gameCode;
  });

  return (
    <div>
      <GameHeader>
        <GameControls client={client} />
        <ConnectionStatus client={client} />
      </GameHeader>
      <WordChooser client={client} />
      <TeamPicker client={client} />
      {isCreator && (
        <div className="flex justify-center mt-4">Code: {gameCode}</div>
      )}
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  gameCode: state.gameCode,
  playerName: state.playerName,
  inGame: state.inGame,
  isCreator: state.isCreator,
});

export default connect(mapStateToProps)(Game);
