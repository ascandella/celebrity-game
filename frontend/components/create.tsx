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
        key={index}
        required
        placeholder={`Team ${index + 1}`}
        onChange={this.setTeamName.bind(this, index)}
      />
    ));

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
            <FormLabel>
              <div className="flex justify-between">
                Teams
                <div className="flex">
                  {this.state.teams.length < 4 && (
                    <a
                      className="hover:text-blue-500 text-blue-700"
                      onClick={this.addTeam.bind(this)}
                    >
                      <svg
                        className="fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z" />
                      </svg>
                    </a>
                  )}
                  {this.state.teams.length > 2 && (
                    <a
                      className="ml-2 text-red-700 hover:text-red-500"
                      onClick={this.removeTeam.bind(this)}
                    >
                      <svg
                        className="fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-12v-2h12v2z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
              {teamInputs}
            </FormLabel>
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
