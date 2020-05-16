import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import CelebrityClient from "../../clients/celebrity";

type ActorControlsProps = {
  client: CelebrityClient;
  myTurn: boolean;
  remainingWords: number;
  remainingSkips: number;
  currentWord: string;
};

const ActorControls: FunctionComponent<ActorControlsProps> = ({
  client,
  myTurn,
  remainingWords,
  remainingSkips,
  currentWord,
}: ActorControlsProps) => {
  if (!myTurn || !currentWord) {
    return null;
  }

  const skipDisabled = remainingWords < 1 || remainingSkips <= 0;
  const skipStyle = skipDisabled ? "opacity-50 cursor-not-allowed" : " ";

  return (
    <div className="flex justify-center text-center mb-4">
      <div>
        <button
          className={`${skipStyle}bg-transparent hover:bg-orange-500 text-orange-700 font-semibold hover:text-white py-2 px-4 mr-4 border border-orange-500 hover:border-transparent rounded`}
          disabled={skipDisabled}
          onClick={() => client.skipWord()}
        >
          Skip ({remainingSkips} left)
        </button>

        <button
          className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-blue-700 hover:border-blue-500 rounded"
          onClick={() => client.countGuess()}
        >
          Correct
        </button>
      </div>
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  // TODO number of skips left
  myTurn: state.myTurn,
  remainingWords: state.remainingWords,
  remainingSkips: state.remainingSkips,
  currentWord: state.currentWord,
});
export default connect(mapStateToProps)(ActorControls);
