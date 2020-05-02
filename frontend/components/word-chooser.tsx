import React, { useState, FunctionComponent } from "react";
import { connect } from "react-redux";
import { RootState } from "../reducers";
import CelebrityClient from "../clients/celebrity";
import { ShortFormInput, FormWrapper } from "./form";

type EditableWordProps = {
  value: string;
  changeHandler: (value: string) => void;
  finishEdit: () => void;
  startEdit: () => void;
  isEditing: boolean;
  isFocused: boolean;
};

const EditableWord: FunctionComponent<EditableWordProps> = ({
  value,
  changeHandler,
  finishEdit,
  startEdit,
  isEditing,
  isFocused,
}: EditableWordProps) => {
  return (
    <div className="flex justify-between items-center mb-2">
      {isEditing ? (
        <ShortFormInput
          type="text"
          className="w-full"
          value={value}
          onChange={(event) => changeHandler(event.target.value)}
          onBlur={finishEdit}
          onKeyPress={(event) => event.key === "Enter" && finishEdit()}
          autoFocus={isFocused}
        />
      ) : (
        <span className="leading-8 w-full" onClick={startEdit}>
          {value}
        </span>
      )}
    </div>
  );
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

  const initialWords = myWords || [];
  if (initialWords.length < maxWords) {
    initialWords.push("");
  }

  const [words, setWords] = useState(initialWords);
  const [editIndex, setEditIndex] = useState(Math.max(0, words.length - 1));

  const setWordAtIndex = (index: number, word: string): void => {
    const newWords = words.splice(0);
    newWords[index] = word;
    setWords(newWords);
  };

  const persistWords = (newWords: string[]) => {
    client.setWords(newWords);
  };

  const normalizeWord = (word: string): string => {
    return word.toLowerCase().replace(/\.|-| /g, "");
  };

  const finishEditing = (index: number): void => {
    let newWords = [...words];

    // This stupid spreading is necessary because otherwise referencing the state
    // zeroes out the old value
    const otherWords = [...words]
      .splice(0, index)
      .concat([...words].splice(index + 1));

    const normalizedWords = otherWords.map(normalizeWord);

    if (newWords[index]) {
      const normalizedWord = normalizeWord(newWords[index]);
      if (normalizedWords.includes(normalizedWord)) {
        newWords = otherWords;
      }
    }
    newWords = newWords.filter((word, j) => {
      return normalizeWord(word).length > 0 || j === newWords.length - 1;
    });
    persistWords([...newWords]);
    const isFull = newWords.length === maxWords;
    if (newWords.length < maxWords) {
      newWords.push("");
    }
    setWords(newWords);
    // If we just finished editing the last word, set index to -2 to indicate
    // that *no* words should be selected.
    setEditIndex(isFull ? -2 : -1);
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
        {words.map((word, index) => {
          const isLast = index === words.length - 1;
          const isFocused = index === editIndex;
          return (
            <EditableWord
              key={index}
              value={word}
              finishEdit={() => finishEditing(index)}
              startEdit={() => setEditIndex(index)}
              isFocused={editIndex === -1 ? isLast : isFocused}
              isEditing={isFocused || (isLast && editIndex === -1)}
              changeHandler={(value) => setWordAtIndex(index, value)}
            />
          );
        })}
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
