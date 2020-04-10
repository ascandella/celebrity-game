import React, { Component } from "react";
import CelebrityClient from "../clients/celebrity";
import ConnectionStatus from "./connection-status";
import styled from "styled-components";

type GameState = {
  connectionStatus: string;
};

type GameProps = {
  client: CelebrityClient;
  roomCode: string;
  playerName: string;
};

const GameHeader = styled.div.attrs({
  className: "flex justify-center justify-between",
})``;

class Game extends Component<GameProps, GameState> {
  constructor(props: GameProps) {
    super(props);
    this.state = {
      connectionStatus: "unknown",
    };
    this.props.client.events.on("connection-status", (status) => {
      this.setState({ connectionStatus: status });
    });
  }

  render(): React.ReactNode {
    return (
      <GameHeader>
        <div>{this.props.roomCode}</div>
        <ConnectionStatus status={this.state.connectionStatus} />
      </GameHeader>
    );
  }
}

export default Game;
