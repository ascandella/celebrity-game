import React, { useState, useRef, FunctionComponent } from "react";
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
  isLast: boolean;
};

const EditableWord: FunctionComponent<EditableWordProps> = ({
  index,
  value,
  changeHandler,
  editing,
  toggleEdit,
  isLast,
}: EditableWordProps) => {
  return (
    <div className="flex justify-between items-center mb-2">
      {editing ? (
        <ShortFormInput
          type="text"
          className="w-full"
          key={index}
          value={value}
          onChange={(event) => changeHandler(event.target.value)}
          onBlur={toggleEdit}
          onKeyPress={(event) => event.key === "Enter" && toggleEdit()}
          autoFocus={isLast}
        />
      ) : (
        <span className="leading-8 w-full" onClick={toggleEdit}>
          {value}
        </span>
      )}
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

  const normalizeWord = (word: string): string => {
    return word.toLowerCase().replace(/\.|-| /g, "");
  };

  const toggleEditing = (index: number): void => {
    let newWords = words.splice(0);
    const wasEditing = newWords[index].editing;

    const existingWords = newWords
      .map((item, j) => {
        return j == index ? null : normalizeWord(item.value);
      })
      .filter(Boolean);
    const normalizedWord = normalizeWord(newWords[index].value);
    if (existingWords.includes(normalizedWord)) {
      newWords = newWords.splice(0, index).concat(newWords.splice(index));
    } else {
      newWords[index].editing = !wasEditing;
    }
    newWords = newWords.filter((word) => normalizeWord(word.value).length > 0);
    if (wasEditing && (maxWords === 0 || newWords.length < maxWords)) {
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
            isLast={index === words.length - 1}
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
