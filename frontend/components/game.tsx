import React, { Component } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import CelebrityClient from "../clients/celebrity";
import ConnectionStatus from "./connection-status";

type player = {
  id: string;
  name: string;
};

type GameState = {
  players: player[];
};

type GameProps = {
  client: CelebrityClient;
  gameCode: string;
  playerName: string;
};

const GameHeader = styled.div.attrs({
  className: "flex justify-center justify-between",
})``;

class Game extends Component<GameProps, GameState> {
  render(): React.ReactNode {
    return (
      <GameHeader>
        <div>{this.props.gameCode}</div>
        <ConnectionStatus />
      </GameHeader>
    );
  }
}

const mapStateToProps = (state) => ({
  gameCode: state.gameCode,
  playerName: state.playerName,
});

export default connect(mapStateToProps)(Game);
