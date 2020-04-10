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
  roomCode: string;
  playerName: string;
  connecting: boolean;
  joinError: string;
  clientID?: string;
};

export default class JoinGame extends Component<JoinProps, JoinState> {
  static defaultProps = {
    maxCodeLength: 4,
    maxNameLength: 12,
  };

  constructor(props: JoinProps) {
    super(props);
    this.state = {
      roomCode: "",
      playerName: "",
      connecting: false,
      joinError: "",
      clientID: null,
    };
    this.handleCodeChange = this.handleCodeChange.bind(this);
  }

  componentDidMount(): void {
    this.setState({
      clientID: window.localStorage.getItem("client-id"),
      playerName: window.localStorage.getItem("client-name"),
      roomCode: window.localStorage.getItem("room-code"),
    });
  }

  /* eslint-disable class-methods-use-this */
  async handleSubmit(event: React.FormEvent<HTMLInputElement>): Promise<void> {
    event.preventDefault();
    this.setState({
      connecting: true,
    });

    try {
      await this.props.joinGame({
        userName: this.state.playerName,
        roomCode: this.state.roomCode.toUpperCase(),
        clientID: this.state.clientID,
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
      roomCode: event.target.value,
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
                value={this.state.roomCode}
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
                value={this.state.playerName}
                placeholder="Your Name"
                required
                tabIndex="2"
                maxLength={this.props.maxNameLength}
                onChange={(event): void =>
                  this.setState({ playerName: event.target.value })
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
