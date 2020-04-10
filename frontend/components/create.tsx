import React, { Component } from "react";
import { CreateGameRequest, Response } from "../clients/messages";
import {
  FormWrapper,
  FormLabel,
  FormInput,
  FormError,
  SubmitButton,
} from "./form";

type CreateProps = {
  createGame: (req: CreateGameRequest) => Promise<Response>;
};

type CreateState = {
  maxPlayers: number;
  name: string;
  connecting: boolean;
  createError: string;
};

export default class CreateGame extends Component<CreateProps, CreateState> {
  constructor(props: CreateProps) {
    super(props);
    this.state = {
      maxPlayers: 12,
      connecting: false,
      createError: "",
      name: "",
    };
  }

  async handleSubmit(event: React.FormEvent<HTMLInputElement>): Promise<void> {
    event.preventDefault();
    this.setState({ connecting: true });

    try {
      await this.props.createGame({
        userName: this.state.name,
        maxPlayers: this.state.maxPlayers,
      });
    } catch (err) {
      this.setState({
        createError: err.message,
        connecting: false,
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

          <FormError error={this.state.createError} />

          <div className="flex justify-center">
            <SubmitButton
              value="Create Game"
              submitting={this.state.connecting}
            />
          </div>
        </form>
      </FormWrapper>
    );
  }
}
