import React, { Component } from "react";
import ContentWrapper from "../components/content-wrapper";
import JoinGame from "../components/join";
import Game from "../components/game";
import CelebrityClient, { Response } from "../clients/celebrity";

type IndexState = {
  client: CelebrityClient;
  inGame: boolean;
  roomCode: string;
};

class Index extends Component<{}, IndexState> {
  constructor(props: {}) {
    super(props);

    const client = new CelebrityClient();
    client.events.on("join", (response: Response) => {
      this.setState({
        inGame: true,
        roomCode: response.roomCode,
      });
    });
    this.state = {
      client,
      roomCode: "",
      inGame: false,
    };
  }

  render(): React.ReactNode {
    let content: React.ReactNode;
    if (this.state.inGame) {
      content = (
        <Game client={this.state.client} roomCode={this.state.roomCode} />
      );
    } else {
      content = <JoinGame client={this.state.client} />;
    }
    return (
      <ContentWrapper showHeader={!this.state.inGame}>{content}</ContentWrapper>
    );
  }
}

export default Index;
