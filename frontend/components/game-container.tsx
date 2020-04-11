import React, { Component } from "react";
import { connect } from "react-redux";
import { toggleCreating } from "../actions";
import { RootState } from "../reducers";
import ContentWrapper from "./content-wrapper";
import CelebrityClient from "../clients/celebrity";
import Game from "./game";
import JoinGame from "./join";
import CreateGame from "./create";

type GameContainerState = {
  client: CelebrityClient;
};

type GameContainerProps = {
  client: CelebrityClient;
  inGame: boolean;
  creating: boolean;
  toggleCreating: (isCreating: boolean) => void;
};

class GameContainer extends Component<GameContainerProps, GameContainerState> {
  constructor(props: GameContainerProps) {
    super(props);
    this.state = {
      client: props.client,
    };
  }

  renderForState(): React.ReactNode {
    if (this.props.inGame) {
      return <Game client={this.state.client} />;
    }

    if (this.props.creating) {
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
    const content: React.ReactNode = this.renderForState();

    return (
      <ContentWrapper>
        {content}
        {!this.props.inGame && (
          <div className="flex justify-center">
            <a onClick={() => this.props.toggleCreating(!this.props.creating)}>
              {this.props.creating ? "Join" : "Create"} Game
            </a>
          </div>
        )}
      </ContentWrapper>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  creating: state.creatingGame,
  inGame: state.inGame,
});

const mapDispatchToProps = (dispatch) => ({
  toggleCreating: (isCreating: boolean) => {
    dispatch(toggleCreating(isCreating));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(GameContainer);
