import React, { Component } from "react";
import styled from "styled-components";
import CelebrityClient from "../clients/celebrity";
import ConnectionStatus from "./connection-status";

type player = {
  id: string;
  name: string;
};

type GameState = {
  connectionStatus: string;
  players: player[];
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
      players: [],
    };
    this.props.client.events.on("connection-status", (status) => {
      this.setState({ connectionStatus: status });
    });
    // TODO: figure out a way to thread players into here
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
