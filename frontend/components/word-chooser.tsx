import React, { useState, FunctionComponent } from "react";
import { connect } from "react-redux";
import { RootState } from "../reducers";
import CelebrityClient from "../clients/celebrity";
import { ShortFormInput, FormWrapper } from "./form";

type EditableWordProps = {
  index: number;
  value: string;
  changeHandler: (value: string) => void;
  toggleEdit: () => void;
  editing: boolean;
};

const EditableWord: FunctionComponent<EditableWordProps> = ({
  index,
  value,
  changeHandler,
  editing,
  toggleEdit,
}: EditableWordProps) => {
  return (
    <div className="flex justify-between items-center mb-2">
      {editing ? (
        <ShortFormInput
          type="text"
          className="w-2/3"
          key={index}
          value={value}
          onChange={(event) => changeHandler(event.target.value)}
          onKeyPress={(event) => event.key === "Enter" && toggleEdit()}
        />
      ) : (
        <span className="leading-8">{value}</span>
      )}
      <button
        onClick={toggleEdit}
        className="ml-2 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
      >
        {editing ? "Add" : "Edit"}
      </button>
    </div>
  );
};

type Word = {
  value: string;
  editing: boolean;
};

type WordChooserProps = {
  isChoosing: boolean;
  maxWords: number;
  myWords: string[];
  client: CelebrityClient;
};

const WordChooser: FunctionComponent<WordChooserProps> = ({
  isChoosing,
  maxWords,
  myWords,
  client,
}: WordChooserProps) => {
  if (!isChoosing) {
    return null;
  }

  const initialWords = (myWords || [""]).map((word) => ({
    value: word,
    editing: word === "",
  }));

  const [words, setWords] = useState(initialWords);
  const setWordAtIndex = (index: number, word: string): void => {
    const newWords = words.splice(0);
    newWords[index].value = word;
    setWords(newWords);
  };

  const persistWords = (newWords: Word[]) => {
    const values = newWords.map((word) => word.value).filter(Boolean);
    client.setWords(values);
  };

  const toggleEditing = (index: number): void => {
    const newWords = words.splice(0);
    const wasEditing = newWords[index].editing;
    newWords[index].editing = !wasEditing;
    if (
      wasEditing &&
      index + 1 === newWords.length &&
      (maxWords === 0 || newWords.length < maxWords)
    ) {
      newWords.push({ value: "", editing: true });
    }
    setWords(newWords);
    if (wasEditing) {
      persistWords(newWords);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    persistWords(words);
  };

  return (
    <FormWrapper>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md px-8 pt-6 pb-8 m-4"
      >
        <h3 className="mb-2">
          Name Your Celebrities
          <span className="ml-2 text-base">
            {maxWords && `(${maxWords} max.)`}
          </span>
        </h3>
        {words.map((word, index) => (
          <EditableWord
            index={index}
            key={index}
            value={word.value}
            editing={word.editing}
            toggleEdit={() => toggleEditing(index)}
            changeHandler={(value) => setWordAtIndex(index, value)}
          />
        ))}
      </form>
    </FormWrapper>
  );
};

const mapStateToProps = (state: RootState) => ({
  isChoosing: state.screen === "select-words",
  maxWords: state.gameConfig.maxSubmissions,
  myWords: state.myWords,
});

export default connect(mapStateToProps)(WordChooser);
