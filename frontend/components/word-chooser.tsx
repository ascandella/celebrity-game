import React, { useState, FunctionComponent } from "react";
import { connect } from "react-redux";
import { RootState } from "../reducers";
import CelebrityClient from "../clients/celebrity";
import { FormInput, FormWrapper } from "./form";

type WordChooserProps = {
  isChoosing: boolean;
  maxWords: number;
  client: CelebrityClient;
};

const WordChooser: FunctionComponent<WordChooserProps> = ({
  isChoosing,
  // TODO plumb these through
  /* eslint-disable */
  maxWords,
  /* eslint-disable */
  client,
}: WordChooserProps) => {
  if (!isChoosing) {
    return null;
  }

  const [words, setWords] = useState([""]);
  const setWordAtIndex = (index: number, word: string): void => {
    const newWords = words.splice(0);
    newWords[index] = word;
    setWords(newWords);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
  };

  return (
    <FormWrapper>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md px-8 pt-6 pb-8 m-4"
      >
        <h3>Select Your Celebrities</h3>
        {words.map((word, index) => (
          <FormInput
            type="text"
            key={index}
            value={word}
            onChange={(event) => setWordAtIndex(index, event.target.value)}
          />
        ))}
      </form>
    </FormWrapper>
  );
};

const mapStateToProps = (state: RootState) => ({
  isChoosing: state.screen === "select-words",
  maxWords: state.maxWords,
});

export default connect(mapStateToProps)(WordChooser);
