import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import CelebrityClient from "../../clients/celebrity";
import { ActivePlayer } from "../../types/team";
import { Message } from "../../types/message";

type GuessBoxProps = {
  currentPlayer: ActivePlayer;
  myTurn: boolean;
  messages: Message[];
  client: CelebrityClient;
};

const GuessBox: FunctionComponent<GuessBoxProps> = ({
  messages,
}: GuessBoxProps) => {
  return (
    <div className="mx-auto p-2 mb-4 h-64 border overflow-hidden">
      {messages.map((message, index) => (
        <div key={index} className={message.system ? "font-normal" : ""}>
          {message.text}
        </div>
      ))}
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  currentPlayer: state.currentPlayer,
  messages: state.messages,
  myTurn: state.myTurn,
  clientID: state.clientID,
});
export default connect(mapStateToProps)(GuessBox);
