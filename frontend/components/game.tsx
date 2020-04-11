import React, { Component } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import CelebrityClient from "../clients/celebrity";
import ConnectionStatus from "./connection-status";
import { RootState } from "../reducers";

type player = {
  id: string;
  name: string;
};

type GameState = {};

type GameProps = {
  players: player[];
  client: CelebrityClient;
  gameCode: string;
  playerName: string;
};

const GameHeader = styled.div.attrs({
  className: "flex justify-center justify-between",
})``;

class Game extends Component<GameProps, GameState> {
  render(): React.ReactNode {
    const players = this.props.players.map((player, i) => (
      <li key={i}>{player.name}</li>
    ));
    return (
      <GameHeader>
        <div>{this.props.gameCode}</div>
        <ConnectionStatus />
        <div>{players}</div>
      </GameHeader>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  gameCode: state.gameCode,
  playerName: state.playerName,
  players: state.players,
});

export default connect(mapStateToProps)(Game);
