import React, { useEffect, FunctionComponent } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import ConnectionStatus from "./connection-status";
import WordChooser from "./word-chooser";
import TeamPicker from "./team-picker";
import InGameContainer from "./in-game/container";
import { RootState } from "../reducers";
import CelebrityClient from "../clients/celebrity";

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
  useEffect(() => {
    if (gameCode) {
      window.location.hash = gameCode;
    }
  });

  if (!inGame) {
    return null;
  }

  return (
    <div>
      <GameHeader>
        <ConnectionStatus client={client} />
      </GameHeader>
      <WordChooser client={client} />
      <TeamPicker client={client} />
      <InGameContainer client={client} />

      {hasControl && screen !== "round" && (
        <div className="flex justify-center mt-4 text-center">
          <div>
            <div className="py-2 px-4 bg-blue-100 border border-t-4 border-blue-400">
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
