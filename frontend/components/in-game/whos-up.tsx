import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import CelebrityClient from "../../clients/celebrity";
import { ActivePlayer } from "../../types/team";

type WhosUpProps = {
  currentPlayer: ActivePlayer;
  myTurn: boolean;
  client: CelebrityClient;
  turnEnds: Date;
  activeWord: boolean;
};

const WhosUp: FunctionComponent<WhosUpProps> = ({
  currentPlayer,
  myTurn,
  client,
  turnEnds,
  activeWord,
}: WhosUpProps) => {
  if (activeWord) {
    return null;
  }

  return (
    <div className="flex justify-center text-center">
      <div className="mb-4 w-full">
        {myTurn && turnEnds === null ? (
          <div>
            <div className="bg-green-500 text-white font-bold px-4 py-1">
              Your Turn
            </div>
            <div className="border border-t-0 border-green-400 bg-green-100 px-4 py-2">
              <div>Waiting for you to start...</div>
              <div className="mt-1">
                <button
                  className="bg-green-600 hover:bg-green-400 text-white font-bold py-1 px-4 border-b-4 border-green-700 hover:border-green-500 rounded"
                  onClick={() => client.startTurn()}
                >
                  I&apos;m Ready
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <strong>{currentPlayer.name}</strong> is up
            {!turnEnds && <span>... waiting for them to start</span>}
          </div>
        )}
      </div>
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  currentPlayer: state.currentPlayer,
  myTurn: state.myTurn,
  clientID: state.clientID,
  turnEnds: state.turnEnds,
  activeWord: !!state.currentWord,
});
export default connect(mapStateToProps)(WhosUp);
