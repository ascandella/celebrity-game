import React, { Component } from "react";
import { connect } from "react-redux";
import { CreateGameRequest } from "../clients/messages";
import { RootState } from "../reducers";
import {
  FormWrapper,
  FormLabel,
  FormInput,
  FormError,
  ShortFormInput,
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
  maxSubmissions: number;
  unlimited: boolean;
};

class CreateGame extends Component<CreateProps, CreateState> {
  constructor(props: CreateProps) {
    super(props);
    this.state = {
      maxPlayers: 12,
      maxSubmissions: 4,
      name: "",
      teams: ["", ""],
      unlimited: false,
    };
  }

  componentDidMount(): void {
    const previousName = window.localStorage.getItem("client-name");
    if (previousName) {
      this.setState({
        name: previousName,
      });
    }

    const previousTeams = window.localStorage.getItem("team-names");
    if (previousTeams) {
      try {
        const parsedNames = JSON.parse(previousTeams);
        this.setState({
          teams: parsedNames,
        });
      } catch (err) {
        window.localStorage.removeItem("team-names");
      }
    }
  }

  handleSubmit(event: React.FormEvent<HTMLInputElement>): void {
    event.preventDefault();

    window.localStorage.setItem("team-names", JSON.stringify(this.state.teams));

    this.props.createGame({
      name: this.state.name,
      maxPlayers: this.state.maxPlayers,
      teams: this.state.teams,
      maxSubmissions: this.state.unlimited ? 0 : this.state.maxSubmissions,
    });
  }

  addTeam(): void {
    if (this.state.teams.length > 4) {
      return;
    }
    const { teams } = this.state;
    teams.push("");
    this.setState({ teams });
  }

  removeTeam(): void {
    if (this.state.teams.length < 3) {
      return;
    }
    const { teams } = this.state;
    teams.pop();
    this.setState({ teams });
  }

  setTeamName(index: number, event: React.ChangeEvent<HTMLInputElement>): void {
    const { teams } = this.state;
    teams[index] = event.target.value;
    this.setState({ teams });
  }

  toggleUnlimited(): void {
    this.setState({
      unlimited: !this.state.unlimited,
    });
  }

  updateSubmissionCount(event: React.ChangeEvent<HTMLInputElement>): void {
    try {
      const parsed = parseInt(event.target.value, 10);
      this.setState({
        maxSubmissions: parsed,
      });
    } catch (err) {
      // ignore it
    }
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
              <a
                className={`bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-3 border border-blue-500 hover:border-transparent ${
                  addDisabled && "opacity-50 cursor-not-allowed"
                }`}
                onClick={this.addTeam.bind(this)}
              >
                Add Team
              </a>
              <a
                className={`bg-transparent hover:bg-red-500 text-red-700 font-semibold hover:text-white py-2 px-3 border border-red-500 hover:border-transparent ${
                  removeDisabled && "opacity-50 cursor-not-allowed"
                }`}
                onClick={this.removeTeam.bind(this)}
              >
                Remove Team
              </a>
            </div>
          </div>

          <div className="mb-4">
            <FormLabel>Rules</FormLabel>

            <label className="flex justify-between items-center">
              Max Submissions
              <ShortFormInput
                className={`w-1/2 ${this.state.unlimited && "opacity-50"}`}
                type="number"
                disabled={this.state.unlimited}
                value={this.state.maxSubmissions}
                onChange={this.updateSubmissionCount.bind(this)}
              />
            </label>
            <label className="flex pt-2">
              <span className="w-1/2">Unlimited?</span>
              <input
                type="checkbox"
                name="unlimited"
                checked={this.state.unlimited}
                onChange={this.toggleUnlimited.bind(this)}
              />
            </label>
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
