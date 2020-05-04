import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import { Team } from "../../types/team";

type ScoreboardProps = {
  teams: Team[];
  scores: { [key: string]: number };
};

const Scoreboard: FunctionComponent<ScoreboardProps> = ({
  teams,
  scores,
}: ScoreboardProps) => {
  return (
    <div className="flex justify-center text-center">
      <div className="w-64">
        <div className="bg-blue-500 text-white font-bold px-4 py-1">
          Scoreboard
        </div>
        <div className="border border-t-0 border-blue-400 bg-blue-100 px-2 py-1">
          <div className="flex justify-center">
            {teams.map((team, i) => (
              <div className="flex flex-col mx-6" key={i}>
                <div className="font-semibold border-b border-blue-200">
                  {team.name}
                </div>
                <div>{scores[team.name] || 0}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  teams: state.teams,
  scores: state.scores,
});
export default connect(mapStateToProps)(Scoreboard);
