import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import { RootState } from "../reducers";
import CelebrityClient from "../clients/celebrity";
import { Team } from "../types/team";

type TeamPickerProps = {
  isPicking: boolean;
  teams: Team[];
  client: CelebrityClient;
};

const TeamPicker: FunctionComponent<TeamPickerProps> = ({
  isPicking,
  teams,
}: TeamPickerProps) => {
  if (!isPicking) {
    return null;
  }

  return (
    <div>
      <div>
        <h3 className="text-center">Pick a Team</h3>
      </div>
      <div className="flex justify-center">
        <div className="flex flex-between justify-center flex-wrap max-w-lg">
          {teams.map((team, index) => (
            <div key={index} className="max-w-md p-4">
              <button
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
                key={index}
              >
                {team.name}
              </button>
              {team.players.length === 0 && (
                <p className="italic">No Players</p>
              )}
              {team.players.map((player, j) => (
                <span key={j}>{player.name}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  isPicking: state.screen === "pick-team",
  teams: state.teams,
});

export default connect(mapStateToProps)(TeamPicker);
