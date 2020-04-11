/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const UPDATE_PLAYERS = "UPDATE_PLAYERS";
export const CONNECTION_STATUS = "CONNECTION_STATUS";
export const GAME_CODE = "GAME_CODE";
export const PLAYER_NAME = "PLAYER_NAME";
export const CREATING_GAME = "CREATING_GAME";
export const JOINED_GAME = "JOINED_GAME";

export const updatePlayers = (players) => ({
  type: UPDATE_PLAYERS,
  players,
});

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

export const joinedGame = (event) => ({
  type: JOINED_GAME,
  roomCode: event.roomCode,
  playerName: event.name,
  clientID: event.clientId,
  players: event.players,
});
