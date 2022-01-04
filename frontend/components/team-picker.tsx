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
  wordCounts: Record<string, number>;
};

const TeamPicker: FunctionComponent<TeamPickerProps> = ({
  screen,
  teams,
  client,
  teamName,
  wordCounts,
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
      <div className="flex flex-wrap justify-center flex-between">
        {teams.map((team, index) => (
          <div key={index} className="p-4 w-1/2 max-w-md text-center">
            <button
              className={`${
                team.name === teamName && "opacity-50 cursor-not-allowed"
              } bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded`}
              onClick={() => joinTeam(team.name)}
              key={index}
            >
              Join <em>{team.name}</em>
            </button>
            {team.players.length === 0 && <p className="italic">No Players</p>}
            <ul className="pt-4">
              {team.players.map((player, j) => {
                const playerWordCount =
                  (wordCounts && wordCounts[player.id]) || 0;

                return (
                  <li key={j}>
                    <span className="mr-2">{player.name}</span>
                    {Array.from({ length: playerWordCount }, (_, i) => (
                      <svg
                        key={i}
                        height="8"
                        width="8"
                        className="inline text-teal-400 fill-current"
                      >
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    ))}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  screen: state.screen,
  teams: state.teams,
  teamName: state.teamName,
  wordCounts: state.wordCounts,
});

export default connect(mapStateToProps)(TeamPicker);
