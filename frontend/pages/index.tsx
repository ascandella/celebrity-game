import React, { FunctionComponent } from "react";
import { Provider } from "react-redux";
import thunkMiddleware from "redux-thunk";
import { createStore, applyMiddleware, compose } from "redux";
import GameContainer from "../components/game-container";
import gameApp from "../reducers";

/* eslint-disable no-underscore-dangle */
const composeEnhancers =
  (typeof window !== "undefined" &&
    (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;
const store = createStore(
  gameApp,
  composeEnhancers(applyMiddleware(thunkMiddleware))
);

const Index: FunctionComponent<{}> = () => {
  return (
    <Provider store={store}>
      <GameContainer />
    </Provider>
  );
};

export default Index;
