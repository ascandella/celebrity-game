import React, { Component } from "react";
import ContentWrapper from "../components/content-wrapper";
import JoinGame from "../components/join";
import CreateGame from "../components/create";
import Game from "../components/game";
import CelebrityClient from "../clients/celebrity";
import { Response } from "../clients/messages";

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

  renderForState(): React.ReactNode {
    if (this.state.inGame) {
      return (
        <Game
          client={this.state.client}
          roomCode={this.state.roomCode}
          playerName={this.state.playerName}
        />
      );
    }

    if (this.state.creating) {
      return (
        <CreateGame
          createGame={this.state.client.createGame.bind(this.state.client)}
        />
      );
    }

    return (
      <JoinGame joinGame={this.state.client.joinGame.bind(this.state.client)} />
    );
  }

  render(): React.ReactNode {
    const content = this.renderForState();
    return (
      <ContentWrapper showHeader={!this.state.inGame}>
        {content}
        {!this.state.inGame && (
          <div className="flex justify-center">
            <a
              onClick={(): void =>
                this.setState({ creating: !this.state.creating })
              }
              className="text-blue-500 hover:text-blue-800 cursor-pointer"
            >
              {this.state.creating ? "Join" : "Create"} Game
            </a>
          </div>
        )}
      </ContentWrapper>
    );
  }
}

export default Index;
