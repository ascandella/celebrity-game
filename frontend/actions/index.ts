/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { GameEvent } from "../clients/messages";

export const CONNECTION_STATUS = "CONNECTION_STATUS";
export const GAME_CODE = "GAME_CODE";
export const PLAYER_NAME = "PLAYER_NAME";
export const CREATING_GAME = "CREATING_GAME";
export const JOINED_GAME = "JOINED_GAME";
export const SET_CLIENT_ID = "SET_CLIENT_ID";
export const RECEIVED_PONG = "RECEIVED_PONG";
export const JOIN_ERROR = "JOIN_ERROR";
export const CREATE_ERROR = "CREATE_ERROR";
export const SET_CONNECTING = "SET_CONNECTING";
export const CONNECT_ERROR = "CONNECT_ERROR";
export const CONNECTED = "CONNECTED";
export const BROADCAST = "BROADCAST";

export const connectionStatus = (status) => ({
  type: CONNECTION_STATUS,
  status,
});

export const gameCode = (code) => ({
  type: GAME_CODE,
  code,
});

export const playerName = (name) => ({
  type: PLAYER_NAME,
  playerName: name,
});

export const setCreatingGame = (creatingGame) => ({
  type: CREATING_GAME,
  creatingGame,
});

export const toggleCreating = (creatingGame) => ({
  type: CREATING_GAME,
  creatingGame,
});

export const joinedGame = (event) => {
  window.localStorage.setItem("client-id", event.clientId);
  window.localStorage.setItem("client-name", event.name);

  return {
    type: JOINED_GAME,
    roomCode: event.roomCode,
    playerName: event.name,
    clientID: event.clientId,
    players: event.players,
  };
};

export const broadcast = (event) => {
  return {
    type: BROADCAST,
    roomCode: event.roomCode,
    playerName: event.name,
    clientID: event.clientId,
    players: event.players,
    screen: event.screen,
    teams: event.teams,
    maxWords: event.maxWords,
  };
};

export const setClientID = (event) => ({
  type: SET_CLIENT_ID,
  clientID: event.clientId,
});

export const setConnecting = (connecting: boolean) => ({
  type: SET_CONNECTING,
  connecting,
});

export const connectError = () => ({
  type: CONNECT_ERROR,
  error: "Could not connect to server",
});

export const connected = () => ({
  type: CONNECTED,
});

export const joinError = (event: GameEvent) => ({
  type: JOIN_ERROR,
  ...event,
});

export const createError = (event: GameEvent) => ({
  type: CREATE_ERROR,
  ...event,
});

export const receivedMessage = (event: GameEvent) => {
  /* eslint-disable default-case */
  switch (event.event) {
    case "pong":
      return {
        type: RECEIVED_PONG,
      };
    case "join-error":
      return joinError(event);
    case "create-error":
      return createError(event);
    case "broadcast":
      return broadcast(event);
    case "joined":
      return joinedGame(event);
    default:
      return {
        type: "UNKNOWN_MESSAGE",
      };
  }
};
