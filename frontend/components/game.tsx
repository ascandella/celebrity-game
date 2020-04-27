import React, { useEffect, FunctionComponent } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import ConnectionStatus from "./connection-status";
import WordChooser from "./word-chooser";
import TeamPicker from "./team-picker";
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
  client: CelebrityClient;
};

const GameHeader = styled.div.attrs({
  className: "flex justify-center justify-between",
})``;

const Game: FunctionComponent<GameProps> = ({
  gameCode,
  inGame,
  client,
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
        <div>{gameCode}</div>
        <ConnectionStatus client={client} />
      </GameHeader>
      <WordChooser client={client} />
      <TeamPicker client={client} />
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  gameCode: state.gameCode,
  playerName: state.playerName,
  inGame: state.inGame,
});

export default connect(mapStateToProps)(Game);
