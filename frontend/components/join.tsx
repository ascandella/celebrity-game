import React, { Component } from "react";
import { JoinGameRequest, Response } from "../clients/messages";
import {
  FormWrapper,
  FormLabel,
  FormInput,
  FormError,
  SubmitButton,
} from "./form";

type JoinProps = {
  maxCodeLength: number;
  maxNameLength: number;
  joinGame: (req: JoinGameRequest) => Promise<Response>;
};

type JoinState = {
  gameCode: string;
  name: string;
  connecting: boolean;
  joinError: string;
};

export default class JoinGame extends Component<JoinProps, JoinState> {
  static defaultProps = {
    maxCodeLength: 4,
    maxNameLength: 12,
  };

  constructor(props: JoinProps) {
    super(props);
    this.state = {
      gameCode: "",
      name: "",
      connecting: false,
      joinError: "",
    };
    this.handleCodeChange = this.handleCodeChange.bind(this);
  }

  /* eslint-disable class-methods-use-this */
  async handleSubmit(event: React.FormEvent<HTMLInputElement>): Promise<void> {
    event.preventDefault();
    this.setState({
      connecting: true,
    });

    try {
      await this.props.joinGame({
        userName: this.state.name,
        roomCode: this.state.gameCode.toUpperCase(),
      });
      // parent component will now handle advancement
    } catch (err) {
      this.setState({
        joinError: err.message,
        connecting: false,
      });
    }
  }

  handleCodeChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      gameCode: event.target.value,
      joinError: "",
    });
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
              Code
              <FormInput
                type="text"
                value={this.state.gameCode}
                autoFocus
                required
                tabIndex="1"
                maxLength={this.props.maxCodeLength}
                onChange={this.handleCodeChange}
                className="uppercase"
              />
            </FormLabel>

            <FormLabel>
              Name
              <FormInput
                type="text"
                value={this.state.name}
                placeholder="Your Name"
                required
                tabIndex="2"
                maxLength={this.props.maxNameLength}
                onChange={(event): void =>
                  this.setState({ name: event.target.value })
                }
              />
            </FormLabel>
          </div>

          <FormError error={this.state.joinError} />

          <div className="flex justify-center">
            <SubmitButton
              value="Join Game"
              submitting={this.state.connecting}
            />
          </div>
        </form>
      </FormWrapper>
    );
  }
}
