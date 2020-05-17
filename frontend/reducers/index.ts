import { combineReducers } from "redux";
import {
  CONNECTION_STATUS,
  JOINED_GAME,
  CREATING_GAME,
  JOIN_ERROR,
  CREATE_ERROR,
  RECEIVED_PONG,
  SET_CONNECTING,
  CONNECTED,
  CONNECT_ERROR,
  BROADCAST,
  MESSAGE,
} from "../actions";
import { Message } from "../types/message";
import { ActivePlayer, Player, Team } from "../types/team";

const players = (state = [], action): Player[] => {
  switch (action.type) {
    case BROADCAST:
      return action.players;
    case JOINED_GAME:
      return action.players;
    default:
      return state;
  }
};

const teams = (state = [], action): Team[] => {
  switch (action.type) {
    case BROADCAST:
      return action.teams;
    default:
      return state;
  }
};

const findMatchingTeam = (action): string => {
  const { clientID } = action;
  const allTeams = action.teams;
  const matchingTeam = allTeams.find((team) => {
    return team.players.find((player) => player.id === clientID);
  });
  if (matchingTeam) {
    return matchingTeam.name;
  }
  return null;
};

const teamName = (state = null, action): string => {
  switch (action.type) {
    case BROADCAST:
      return findMatchingTeam(action) || state;
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

const screen = (state = null, action): string => {
  switch (action.type) {
    case BROADCAST:
      return action.screen;
    default:
      return state;
  }
};

type GameConfig = {
  maxSubmissions?: number;
};

const gameConfig = (state: GameConfig = {}, action): GameConfig => {
  switch (action.type) {
    case BROADCAST:
      return action.config;
    default:
      return state;
  }
};

const wordCounts = (state = {}, action): {} => {
  switch (action.type) {
    case BROADCAST:
      return action.wordCounts;
    default:
      return state;
  }
};

const myWords = (state = [], action): {} => {
  switch (action.type) {
    case BROADCAST:
      return action.words;
    default:
      return state;
  }
};

const hasControl = (state = null, action): boolean => {
  switch (action.type) {
    case BROADCAST:
      return action.hasControl || false;
    default:
      return state;
  }
};

const emptyActivePlayer: ActivePlayer = {
  id: undefined,
  name: undefined,
  team: undefined,
};

const currentPlayer = (state = emptyActivePlayer, action): ActivePlayer => {
  switch (action.type) {
    case BROADCAST:
      return action.currentPlayer || {};
    default:
      return state;
  }
};

const nextPlayer = (state = emptyActivePlayer, action): ActivePlayer => {
  switch (action.type) {
    case BROADCAST:
      return action.nextPlayer || {};
    default:
      return state;
  }
};

const scores = (state = {}, action): { [key: string]: number } => {
  switch (action.type) {
    case BROADCAST:
      return action.scores;
    default:
      return state;
  }
};

const myTurn = (state = false, action): boolean => {
  switch (action.type) {
    case BROADCAST:
      return action.yourTurn;
    default:
      return state;
  }
};

const canGuess = (state = false, action): boolean => {
  switch (action.type) {
    case BROADCAST:
      return action.canGuess;
    default:
      return state;
  }
};

const turnEnds = (state = null, action): Date => {
  switch (action.type) {
    case BROADCAST:
      return action.turnEnds ? new Date(action.turnEnds) : null;
    default:
      return state;
  }
};

const currentWord = (state = null, action): string => {
  switch (action.type) {
    case BROADCAST:
      return action.currentWord;
    default:
      return state;
  }
};

const remainingWords = (state = null, action): number => {
  switch (action.type) {
    case BROADCAST:
      return action.remainingWords;
    default:
      return state;
  }
};

const remainingSkips = (state = null, action): number => {
  switch (action.type) {
    case BROADCAST:
      return action.remainingSkips;
    default:
      return state;
  }
};

const messages = (state = [], action): Message[] => {
  switch (action.type) {
    case MESSAGE:
      if (action.message.roundEnd) {
        // Clear out the messages when the round starts so players
        // can't scroll back
        return state.slice(state.length - 3).concat(action.message);
      }
      return state.concat(action.message);
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  gameCode,
  playerName,
  players,
  teams,
  wordCounts,
  screen,
  teamName,
  gameConfig,
  myWords,
  clientID,
  hasControl,
  currentPlayer,
  nextPlayer,
  scores,
  myTurn,
  canGuess,
  turnEnds,
  currentWord,
  remainingWords,
  remainingSkips,
  messages,

  inGame,
  creatingGame,

  joinError,
  createError,

  connection,
});
export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
