import React, { Component } from "react";
import { connect } from "react-redux";
import { CreateGameRequest, Response } from "../clients/messages";
import { setConnecting } from "../actions";
import {
  FormWrapper,
  FormLabel,
  FormInput,
  FormError,
  SubmitButton,
} from "./form";

type CreateProps = {
  createGame: (req: CreateGameRequest) => Promise<Response>;
  setConnecting: (isConnecting: boolean) => void;
  connecting: boolean;
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

  async handleSubmit(event: React.FormEvent<HTMLInputElement>): Promise<void> {
    event.preventDefault();

    try {
      await this.props.createGame({
        userName: this.state.name,
        maxPlayers: this.state.maxPlayers,
      });
    } catch (err) {
      this.setState({
        createError: err.message,
      });
    }
  }

  render(): React.ReactNode {
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
                tabIndex="1"
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

const mapStateToProps = (state) => ({
  createError: state.createError,
  connecting: state.connecting,
});

const mapDispatchToProps = (dispatch) => ({
  setConnecting: (isConnecting: boolean) => {
    dispatch(setConnecting(isConnecting));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CreateGame);
