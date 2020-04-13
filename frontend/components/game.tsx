import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import ConnectionStatus from "./connection-status";
import { RootState } from "../reducers";
import CelebrityClient from "../clients/celebrity";

type player = {
  id: string;
  name: string;
};

type GameProps = {
  players: player[];
  gameCode: string;
  playerName: string;
  inGame: boolean;
  client: CelebrityClient;
};

const GameHeader = styled.div.attrs({
  className: "flex justify-center justify-between",
})``;

const Game: FunctionComponent<GameProps> = ({
  players,
  gameCode,
  inGame,
  client,
}: GameProps) => {
  if (!inGame) {
    return null;
  }
  return (
    <GameHeader>
      <div>{gameCode}</div>
      <ConnectionStatus client={client} />

      <div>
        <h2>Players</h2>
        <ul>
          {players.map((player, i) => (
            <li key={i}>{player.name}</li>
          ))}
        </ul>
      </div>
    </GameHeader>
  );
};

const mapStateToProps = (state: RootState) => ({
  gameCode: state.gameCode,
  playerName: state.playerName,
  players: state.players,
  inGame: state.inGame,
});

export default connect(mapStateToProps)(Game);
