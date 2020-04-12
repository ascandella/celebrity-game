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
};

class CreateGame extends Component<CreateProps, CreateState> {
  constructor(props: CreateProps) {
    super(props);
    this.state = {
      maxPlayers: 12,
      name: "",
    };
  }

  handleSubmit(event: React.FormEvent<HTMLInputElement>): void {
    event.preventDefault();

    this.props.createGame({
      userName: this.state.name,
      maxPlayers: this.state.maxPlayers,
    });
  }

  render(): React.ReactNode {
    if (!this.props.creating) {
      return null;
    }
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
  createError: state.connection.error || state.createError || state.joinError,
  connecting: state.connection.status === "connecting",
  creating: state.creatingGame,
});

export default connect(mapStateToProps)(CreateGame);
