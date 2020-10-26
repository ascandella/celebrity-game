import React from "react";
import { connect } from "react-redux";
import Link from "next/link";
import Timer from "./in-game/timer";
import { RootState } from "../reducers";

type HeaderProps = {
  round: number;
  screen: string;
  inGame: boolean;
};

const titleStyle = `font-semibold text-xl tracking-tigh hover:text-white text-white`;

const Header = ({ round, screen, inGame }: HeaderProps) => {
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
        title: "Charades",
        help: "act it out",
      },
      3: {
        title: "One Word",
        help: "... and only one,",
      },
      4: {
        title: "Freeze",
        help: "strike a pose",
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
      <nav className="flex flex-wrap items-center justify-between p-4 bg-pink-gradient">
        <div className="flex items-center flex-shrink-0 mr-6 text-white">
          <Link href="/">
            <a className={titleStyle}>Celebrity</a>
          </Link>
        </div>
        <div className="block lg:flex lg:items-center lg:w-auto">
          <Link href="/about">
            <a className="mt-4 mr-4 text-white lg:mt-0 hover:text-white">
              About
            </a>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex flex-wrap items-center justify-between p-4 bg-pink-gradient">
      {getHeaderContent()}
      <Timer />
    </nav>
  );
};

const mapStateToProps = (state: RootState) => ({
  inGame: state.inGame,
  screen: state.screen,
  round: state.round,
});

export default connect(mapStateToProps)(Header);
