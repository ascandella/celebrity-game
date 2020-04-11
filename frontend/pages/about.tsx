import React, { FunctionComponent } from "react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import gameApp from "../reducers/index";
import ContentWrapper from "../components/content-wrapper";

type AboutSectionProps = {
  title: string;
  children: React.ReactNode;
};

const AboutSection: FunctionComponent<AboutSectionProps> = ({
  title,
  children,
}: AboutSectionProps) => (
  <div className="pb-6">
    <div className="flex justify-center">
      <div className="w-full max-w-lg">
        <h3>{title}</h3>
      </div>
    </div>
    <div className="flex justify-center">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  </div>
);

const store = createStore(gameApp);

const About: FunctionComponent = () => {
  return (
    <Provider store={store}>
      <ContentWrapper>
        <AboutSection title="What is Celebrity?">
          <p>
            From{" "}
            <a href="https://en.wikipedia.org/wiki/Celebrity_(game)">
              Wikipedia
            </a>
            , Celebrity (also known as Celebrities, The Hat Game, Lunchbox,
            Salad Bowl or The Name Game) is a party game similar to Charades,
            where teams play against each other to guess as many celebrity names
            as possible before time runs out.
          </p>
        </AboutSection>

        <AboutSection title="How do I play?">
          <p>
            You&apos;ll need a minimum of 6 players, ideally an even number.
            Each player will need their own computer or smartphone.
          </p>

          <p>
            Everyone will need to join a shared video chat such as Google
            Hangouts or Zoom.
          </p>

          <p>
            One person will create a room, then send that room code to all the
            others. When everybody has joined, the creator can start the game.
          </p>
        </AboutSection>

        <AboutSection title="What are the rules?">
          <p>
            See{" "}
            <a href="http://howell.seattle.wa.us/games/rules/celebrities.pdf">
              this handy PDF
            </a>{" "}
            which I found on Wikipedia.
          </p>
        </AboutSection>

        <AboutSection title="Who made this?">
          <p>
            This game was written in April of 2020 by
            <a className="pl-1" href="https://sca.ndella.com">
              Aiden Scandella
            </a>
            , so that he could play the game with his friends while quarantined
            in Seattle.
          </p>

          <p>
            It is open source
            <a
              className="pl-1"
              href="https://github.com/ascandella/celebrity-game/"
            >
              on GitHub
            </a>
            .
          </p>
        </AboutSection>

        <AboutSection title="How do I report a bug?">
          <p>
            Open an issue{" "}
            <a href="https://github.com/ascandella/celebrity-game/issues/new">
              on GitHub
            </a>
            .
          </p>
        </AboutSection>
      </ContentWrapper>
    </Provider>
  );
};

export default About;
