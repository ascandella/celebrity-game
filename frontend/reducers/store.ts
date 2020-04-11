import thunkMiddleware from "redux-thunk";
import { createStore, applyMiddleware } from "redux";
import gameApp from "./index";

const store = createStore(gameApp, applyMiddleware(thunkMiddleware));
export default store;
