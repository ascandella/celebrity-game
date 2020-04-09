import React, { Component } from "react";
import ContentWrapper from "../components/content-wrapper";
import JoinGame from "../components/join";
import CreateGame from "../components/create";
import Game from "../components/game";
import CelebrityClient, { Response } from "../clients/celebrity";

type IndexState = {
  client: CelebrityClient;
  inGame: boolean;
  roomCode: string;
  playerName: string;
  clientID?: string;
  creating: boolean;
};

class Index extends Component<{}, IndexState> {
  constructor(props: {}) {
    super(props);

    const client = new CelebrityClient();
    client.events.on("join", (response: Response) => {
      this.setState({
        inGame: true,
        roomCode: response.roomCode,
        playerName: response.name,
        clientID: response.clientID,
      });
    });
    this.state = {
      client,
      roomCode: "",
      inGame: false,
      playerName: "",
      clientID: null,
      creating: false,
    };
  }

  render(): React.ReactNode {
    let content: React.ReactNode;
    if (this.state.inGame) {
      content = (
        <Game
          client={this.state.client}
          roomCode={this.state.roomCode}
          playerName={this.state.playerName}
        />
      );
    } else if (this.state.creating) {
      content = <CreateGame client={this.state.client} />;
    } else {
      content = (
        <div>
          <JoinGame client={this.state.client} />
          <a
            onClick={(): void =>
              this.setState({ creating: !this.state.creating })
            }
            className="text-blue-500 hover:text-blue-800 cursor-pointer"
          >
            Create
          </a>
        </div>
      );
    }
    return (
      <ContentWrapper showHeader={!this.state.inGame}>{content}</ContentWrapper>
    );
  }
}

export default Index;
