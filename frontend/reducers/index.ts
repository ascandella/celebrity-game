import { combineReducers } from "redux";
import {
  UPDATE_PLAYERS,
  CONNECTION_STATUS,
  JOINED_GAME,
  CREATING_GAME,
} from "../actions";

// TODO make a type for players?
const players = (state = [], action): any[] => {
  switch (action.type) {
    case UPDATE_PLAYERS:
      return action.players;
    case JOINED_GAME:
      return action.players;
    default:
      return state;
  }
};

const connectionStatus = (state = "unknown", action): string => {
  switch (action.type) {
    case CONNECTION_STATUS:
      return action.status;
    default:
      return state;
  }
};

const gameCode = (state = "", action): string => {
  switch (action.type) {
    case JOINED_GAME:
      return action.roomCode;
    default:
      return state;
  }
};

const inGame = (state = false, action): boolean => {
  switch (action.type) {
    case JOINED_GAME:
      return true;
    default:
      return state;
  }
};

const creatingGame = (state = false, action): boolean => {
  switch (action.type) {
    case CREATING_GAME:
      return action.creatingGame;
    default:
      return state;
  }
};

export default combineReducers({
  gameCode,
  players,
  connectionStatus,
  inGame,
  creatingGame,
});
