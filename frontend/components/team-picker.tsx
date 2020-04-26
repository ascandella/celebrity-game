import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import { RootState } from "../reducers";
import CelebrityClient from "../clients/celebrity";
import { Team } from "../types/team";

type TeamPickerProps = {
  screen: string;
  teams: Team[];
  teamName: string;
  client: CelebrityClient;
};

const TeamPicker: FunctionComponent<TeamPickerProps> = ({
  screen,
  teams,
  client,
  teamName,
}: TeamPickerProps) => {
  const isPicking = screen === "pick-team";
  if (!isPicking && screen !== "select-words") {
    return null;
  }

  const joinTeam = (name: string): void => {
    client.joinTeam({ name });
  };

  return (
    <div>
      <div>
        <h3 className="text-center">{isPicking ? "Join" : "Change"} Team</h3>
      </div>
      <div className="flex justify-center">
        <div className="flex flex-between justify-center flex-wrap max-w-lg">
          {teams.map((team, index) => (
            <div key={index} className="max-w-md p-4">
              <button
                className={`${
                  team.name === teamName && "opacity-50 cursor-not-allowed"
                } bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded`}
                onClick={() => joinTeam(team.name)}
                key={index}
              >
                {team.name}
              </button>
              {team.players.length === 0 && (
                <p className="italic">No Players</p>
              )}
              <ul className="pt-4">
                {team.players.map((player, j) => (
                  <li key={j}>{player.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  screen: state.screen,
  teams: state.teams,
  teamName: state.teamName,
});

export default connect(mapStateToProps)(TeamPicker);
