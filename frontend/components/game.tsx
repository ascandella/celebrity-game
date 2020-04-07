import React, { Component } from "react";
import CelebrityClient from "../clients/celebrity";

type GameState = {};

type GameProps = {
  client: CelebrityClient;
  roomCode: string;
};

class Game extends Component<GameProps, GameState> {
  render(): React.ReactNode {
    return (
      <div>
        <div>{this.props.roomCode}</div>
      </div>
    );
  }
}

export default Game;
