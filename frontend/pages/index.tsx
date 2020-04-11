import React, { FunctionComponent } from "react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import GameContainer from "../components/game-container";
import CelebrityClient from "../clients/celebrity";
import gameApp from "../reducers/index";

const store = createStore(gameApp);

const Index: FunctionComponent<{}> = () => {
  const client = new CelebrityClient(store);

  return (
    <Provider store={store}>
      <GameContainer client={client} />
    </Provider>
  );
};

export default Index;
