import React, { FunctionComponent } from "react";
import { Dispatch } from "redux";
import { connect } from "react-redux";
import { toggleCreating } from "../actions";
import { RootState } from "../reducers";
import ContentWrapper from "./content-wrapper";
import CelebrityClient from "../clients/celebrity";
import Game from "./game";
import JoinGame from "./join";
import CreateGame from "./create";

type JoinOrCreateProps = {
  inGame: boolean;
  client: CelebrityClient;
  toggleIsCreating: (isCreating: boolean) => void;
  creating: boolean;
};

const JoinOrCreate: FunctionComponent<JoinOrCreateProps> = ({
  inGame,
  client,
  creating,
  toggleIsCreating,
}: JoinOrCreateProps) => {
  if (inGame) {
    return null;
  }
  return (
    <div>
      <div className="flex justify-center">
        <JoinGame joinGame={client.joinGame.bind(client)} />
        <CreateGame createGame={client.createGame.bind(client)} />
      </div>

      <div className="flex justify-center">
        <a onClick={() => toggleIsCreating(!creating)}>
          {creating ? "Join" : "Create"} Game
        </a>
      </div>
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  creating: state.creatingGame,
  inGame: state.inGame,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  toggleIsCreating: (isCreating: boolean) => {
    dispatch(toggleCreating(isCreating));
  },
});

const JoinOrCreateContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(JoinOrCreate);

type GameContainerProps = {
  client: CelebrityClient;
};

const GameContainer: FunctionComponent<GameContainerProps> = ({
  client,
}: GameContainerProps) => (
  <ContentWrapper>
    <JoinOrCreateContainer client={client} />
    <Game />
  </ContentWrapper>
);

const mapGameDispatchToProps = (dispatch: Dispatch) => ({
  client: new CelebrityClient(dispatch),
});

export default connect(null, mapGameDispatchToProps)(GameContainer);
