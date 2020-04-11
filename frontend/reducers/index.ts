import { combineReducers } from "redux";
import {
  UPDATE_PLAYERS,
  CONNECTION_STATUS,
  JOINED_GAME,
  CREATING_GAME,
  JOIN_ERROR,
  CREATE_ERROR,
  RECEIVED_PONG,
  SET_CONNECTING,
  CONNECT_ERROR,
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

const playerName = (state = null, action): string => {
  switch (action.type) {
    case JOINED_GAME:
      return action.playerName;
    default:
      return state;
  }
};

const clientID = (state = null, action): string => {
  switch (action.type) {
    case JOINED_GAME:
      return action.clientID;
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

const joinError = (state = null, action): string => {
  switch (action.type) {
    case JOIN_ERROR:
      return action.error;
    case JOINED_GAME:
      return null;
    case CREATING_GAME:
      return null;
    default:
      return state;
  }
};

const createError = (state = null, action): string => {
  switch (action.type) {
    case CREATE_ERROR:
      return action.error;
    case JOINED_GAME:
      return null;
    default:
      return state;
  }
};

const lastPongTime = (state = 0, action): number => {
  switch (action.type) {
    case RECEIVED_PONG:
      return Date.now();
    default:
      return state;
  }
};

const connectError = (state = null, action): string => {
  switch (action.type) {
    case CONNECT_ERROR:
      return "Could not connect to server";
    // if we received a join or a connect, we can clear it out
    case JOINED_GAME:
      return null;
    case JOIN_ERROR:
      return null;
    case CONNECT_ERROR:
      return null;
    default:
      return state;
  }
};

const connecting = (state = false, action): boolean => {
  switch (action.type) {
    case SET_CONNECTING:
      return action.connecting;
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  gameCode,
  playerName,
  players,
  clientID,

  inGame,
  creatingGame,

  joinError,
  createError,

  lastPongTime,
  connectionStatus,
  connecting,
  connectError,
});
export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
