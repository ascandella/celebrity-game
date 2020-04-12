import React, { FunctionComponent } from "react";
import { Provider } from "react-redux";
import thunkMiddleware from "redux-thunk";
import { createStore, applyMiddleware } from "redux";
import GameContainer from "../components/game-container";
import gameApp from "../reducers";

const store = createStore(gameApp, applyMiddleware(thunkMiddleware));

const Index: FunctionComponent<{}> = () => {
  return (
    <Provider store={store}>
      <GameContainer />
    </Provider>
  );
};

export default Index;
