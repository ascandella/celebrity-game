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
  CONNECTED,
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
    case CONNECT_ERROR:
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
    case CONNECT_ERROR:
      return action.error;
    case JOINED_GAME:
      return null;
    default:
      return state;
  }
};

type ConnectionStatus = {
  status: string;
  error?: string;
  code?: string;
  lastPong?: number;
  connectError?: boolean;
};

const InitialConnectionStatus: ConnectionStatus = {
  status: "disconnected",
};

const connection = (
  state = InitialConnectionStatus,
  action
): ConnectionStatus => {
  switch (action.type) {
    case SET_CONNECTING:
      return {
        ...state,
        status: "connecting",
      };
    case CONNECT_ERROR:
      return {
        // if we received a join or a connect, we can clear it out
        status: "error",
        error: action.error,
        connectError: true,
      };
    case JOINED_GAME:
      return {
        ...state,
        status: "joined",
        error: null,
        connectError: false,
        lastPong: Date.now(),
      };
    case JOIN_ERROR:
      return {
        status: "error",
        error: action.error,
        code: action.code,
      };
    case RECEIVED_PONG:
      return {
        ...state,
        lastPong: Date.now(),
      };
    case CONNECTED:
      return {
        ...state,
        status: "connected",
        error: null,
      };
    case CONNECTION_STATUS:
      return {
        ...state,
        status: action.status,
      };
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

  connection,
});
export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
