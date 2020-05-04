import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import { RootState } from "../../reducers";

type CurrentWordProps = {
  currentWord: string;
};

const CurrentWord: FunctionComponent<CurrentWordProps> = ({
  currentWord,
}: CurrentWordProps) => {
  if (!currentWord) {
    return null;
  }
  return (
    <div className="w-full text-center mb-6">
      <div>
        <div className="bg-green-500 text-white font-bold px-4 py-1">
          Your Word
        </div>
        <div className="border border-t-0 border-green-400 bg-green-100 px-2 py-2">
          <span className="text-4xl">{currentWord}</span>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  currentWord: state.currentWord,
});

export default connect(mapStateToProps)(CurrentWord);
