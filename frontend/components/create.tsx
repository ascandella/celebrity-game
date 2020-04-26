import React, { Component } from "react";
import { connect } from "react-redux";
import { CreateGameRequest } from "../clients/messages";
import { RootState } from "../reducers";
import {
  FormWrapper,
  FormLabel,
  FormInput,
  FormError,
  SubmitButton,
} from "./form";

type CreateProps = {
  createGame: (req: CreateGameRequest) => void;
  connecting: boolean;
  creating: boolean;
  createError: string;
};

type CreateState = {
  maxPlayers: number;
  name: string;
  teams: string[];
};

class CreateGame extends Component<CreateProps, CreateState> {
  constructor(props: CreateProps) {
    super(props);
    this.state = {
      maxPlayers: 12,
      name: "",
      teams: ["", ""],
    };
  }

  handleSubmit(event: React.FormEvent<HTMLInputElement>): void {
    event.preventDefault();

    this.props.createGame({
      name: this.state.name,
      maxPlayers: this.state.maxPlayers,
      teams: this.state.teams,
    });
  }

  addTeam(): void {
    const { teams } = this.state;
    teams.push("");
    this.setState({ teams });
  }

  removeTeam(): void {
    const { teams } = this.state;
    teams.pop();
    this.setState({ teams });
  }

  setTeamName(index: number, event: React.ChangeEvent<HTMLInputElement>): void {
    const { teams } = this.state;
    teams[index] = event.target.value;
    this.setState({ teams });
  }

  render(): React.ReactNode {
    if (!this.props.creating) {
      return null;
    }
    const teamInputs = this.state.teams.map((team, index) => (
      <FormInput
        type="text"
        className="mb-2"
        defaultValue={team}
        tabIndex={index + 1}
        key={index}
        required
        placeholder={`Team ${index + 1}`}
        onChange={this.setTeamName.bind(this, index)}
      />
    ));

    const addDisabled = this.state.teams.length >= 4;
    const removeDisabled = this.state.teams.length < 3;

    return (
      <FormWrapper>
        <form
          onSubmit={this.handleSubmit.bind(this)}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          <div className="mb-4">
            <FormLabel>
              Name
              <FormInput
                type="text"
                value={this.state.name}
                placeholder="Your Name"
                autoFocus
                tabIndex={1}
                required
                onChange={(event): void =>
                  this.setState({ name: event.target.value })
                }
              />
            </FormLabel>
          </div>

          <div className="mb-4">
            <FormLabel>Teams</FormLabel>
            {teamInputs}

            <div className="flex justify-between">
              <button
                className={`bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent ${
                  addDisabled && "opacity-50 cursor-not-allowed"
                }`}
                onClick={this.addTeam.bind(this)}
                disabled={addDisabled}
              >
                Add Team
              </button>
              <button
                className={`bg-transparent hover:bg-red-500 text-red-700 font-semibold hover:text-white py-2 px-4 border border-red-500 hover:border-transparent ${
                  removeDisabled && "opacity-50 cursor-not-allowed"
                }`}
                onClick={this.removeTeam.bind(this)}
                disabled={removeDisabled}
              >
                Remove Team
              </button>
            </div>
          </div>

          <FormError error={this.props.createError} />

          <div className="flex justify-center">
            <SubmitButton
              value="Create Game"
              submitting={this.props.connecting}
            />
          </div>
        </form>
      </FormWrapper>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  // A create is really a create followed by a join behind the scenes, so we may
  // get a join error
  createError: state.createError || state.joinError,
  connecting: state.connection.status === "connecting",
  creating: state.creatingGame,
});

export default connect(mapStateToProps)(CreateGame);
