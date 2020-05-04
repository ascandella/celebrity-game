import React, { useEffect, FunctionComponent } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import ConnectionStatus from "./connection-status";
import WordChooser from "./word-chooser";
import TeamPicker from "./team-picker";
import InGameContainer from "./in-game/container";
import GameControls from "./controls";
import { RootState } from "../reducers";
import CelebrityClient from "../clients/celebrity";

type player = {
  id: string;
  name: string;
};

type GameProps = {
  gameCode: string;
  playerName: string;
  inGame: boolean;
  hasControl: boolean;
  screen: string;
  client: CelebrityClient;
};

const GameHeader = styled.div.attrs({
  className: "flex justify-center",
})``;

const Game: FunctionComponent<GameProps> = ({
  gameCode,
  inGame,
  client,
  screen,
  hasControl,
}: GameProps) => {
  if (!inGame) {
    return null;
  }
  useEffect(() => {
    window.location.hash = gameCode;
  });

  return (
    <div>
      <GameHeader>
        <GameControls client={client} />
        <ConnectionStatus client={client} />
      </GameHeader>
      <WordChooser client={client} />
      <TeamPicker client={client} />
      <InGameContainer client={client} />

      {hasControl && screen !== "round" && (
        <div className="flex justify-center text-center mt-4">
          <div>
            <div className="border border-t-4 border-blue-400 bg-blue-100 px-4 py-2">
              Room code: <span className="font-medium">{gameCode}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  gameCode: state.gameCode,
  playerName: state.playerName,
  inGame: state.inGame,
  hasControl: state.hasControl,
  screen: state.screen,
});

export default connect(mapStateToProps)(Game);
