import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import Link from "next/link";
import styled from "styled-components";
import PinkGradient from "./styles";
import Timer from "./in-game/timer";
import { RootState } from "../reducers";

export const GradientHeader = styled.nav`
  background: ${PinkGradient};
`;

type HeaderProps = {
  round: number;
  screen: string;
  inGame: boolean;
};

const titleStyle = `font-semibold text-xl tracking-tigh hover:text-white text-white`;

const Header: FunctionComponent<HeaderProps> = ({
  round,
  screen,
  inGame,
}: HeaderProps) => {
  const getHeaderContent = (): React.ReactNode => {
    const screenNames = {
      "pick-team": "Choose Your Team",
      "select-words": "Name Your Celebrities",
      "game-over": "Game Over",
      round: "Waiting To Start",
    };

    const roundDescriptions = {
      1: {
        title: "Catchprase",
        help: "say anything except your phrase",
      },
      2: {
        title: "One Word",
        help: "... and only one,",
      },
      3: {
        title: "Charades",
        help: "act it out",
      },
    };

    let content = screenNames[screen];
    if (round && screen !== "game-over") {
      content = `Round ${round}: ${roundDescriptions[round].title}`;
    }
    // TODO round descriptions
    if (!content) {
      return null;
    }

    return <div className={titleStyle}>{content}</div>;
  };

  if (!inGame) {
    // Kinda sucks to duplicate the header wrapper, but the flex box needs to have
    // these direct children
    return (
      <GradientHeader className="flex items-center justify-between flex-wrap p-4">
        <div className="flex items-center flex-shrink-0 text-white mr-6">
          <Link href="/">
            <a className={titleStyle}>Celebrity</a>
          </Link>
        </div>
        <div className="block lg:flex lg:items-center lg:w-auto">
          <Link href="/about">
            <a className="mt-4 lg:mt-0 text-white hover:text-white mr-4">
              About
            </a>
          </Link>
        </div>
      </GradientHeader>
    );
  }

  return (
    <GradientHeader className="flex items-center justify-between flex-wrap p-4">
      {getHeaderContent()}
      <Timer />
    </GradientHeader>
  );
};

const mapStateToProps = (state: RootState) => ({
  inGame: state.inGame,
  screen: state.screen,
  round: state.round,
});

export default connect(mapStateToProps)(Header);
