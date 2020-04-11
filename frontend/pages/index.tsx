import React, { Component } from "react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import GameContainer from "../components/game-container";
import CelebrityClient from "../clients/celebrity";
import gameApp from "../reducers/index";

type IndexState = {
  client: CelebrityClient;
};

const store = createStore(gameApp);

class Index extends Component<{}, IndexState> {
  constructor(props: {}) {
    super(props);
    const client = new CelebrityClient(store);

    this.state = {
      client,
    };
  }

  render(): React.ReactNode {
    return (
      <Provider store={store}>
        <GameContainer client={this.state.client} />
      </Provider>
    );
  }
}

export default Index;
