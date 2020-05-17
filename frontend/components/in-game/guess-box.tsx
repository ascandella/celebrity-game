import React, {
  createRef,
  useState,
  useEffect,
  FunctionComponent,
} from "react";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import CelebrityClient from "../../clients/celebrity";
import { Message } from "../../types/message";
import { FormInput } from "../form";

type GuessBoxProps = {
  canGuess: boolean;
  messages: Message[];
  client: CelebrityClient;
};

const GuessBox: FunctionComponent<GuessBoxProps> = ({
  client,
  messages,
  canGuess,
}: GuessBoxProps) => {
  const [message, setMessage] = useState("");
  const scrollRef = createRef<HTMLDivElement>();

  const sendMessage = () => {
    client.sendMessage(message);
    setMessage("");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  return (
    <div>
      <div
        ref={scrollRef}
        className="mx-auto p-2 mb-4 h-64 border overflow-y-auto flex flex-col justify-end"
      >
        {messages.map((m, index) => {
          let messageClass = "font-normal";
          if (m.correct) {
            messageClass = "text-green-700";
          }
          return (
            <div key={index} className={`w-full ${messageClass}`}>
              {m.player && (
                <span className="font-semibold">{m.player.name}: </span>
              )}
              {m.text}
            </div>
          );
        })}
      </div>

      {canGuess && (
        <div className="mb-4 justify-center">
          <FormInput
            type="text"
            value={message}
            onKeyPress={(event) => event.key === "Enter" && sendMessage()}
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="flex justify-center mt-2">
            <a
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 cursor-pointer focus:outline-none focus:shadow-outline"
              onClick={() => sendMessage()}
            >
              Guess
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  canGuess: state.canGuess,
  messages: state.messages,
  clientID: state.clientID,
});
export default connect(mapStateToProps)(GuessBox);
