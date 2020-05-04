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
      {teams.map((team, i) => (
        <div className="flex flex-col mx-4" key={i}>
          <div>
            <strong>{team.name}</strong>
          </div>
          <div>{scores[team.name] || 0}</div>
        </div>
      ))}
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  teams: state.teams,
  scores: state.scores,
});
export default connect(mapStateToProps)(Scoreboard);
