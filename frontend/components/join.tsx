import React, { Component } from "react";
import { connect } from "react-redux";
import { JoinGameRequest } from "../clients/messages";
import {
  FormWrapper,
  FormLabel,
  FormInput,
  FormError,
  SubmitButton,
} from "./form";
import { RootState } from "../reducers";

type JoinProps = {
  maxCodeLength: number;
  maxNameLength: number;
  joinGame: (req: JoinGameRequest) => void;
  joinError: string;
  connecting: boolean;
  creating: boolean;
};

type JoinState = {
  roomCode: string;
  playerName: string;
  clientID?: string;
};

export class JoinGame extends Component<JoinProps, JoinState> {
  static defaultProps = {
    maxCodeLength: 4,
    maxNameLength: 12,
  };

  constructor(props: JoinProps) {
    super(props);
    this.state = {
      roomCode: "",
      playerName: "",
      clientID: null,
    };
    this.handleCodeChange = this.handleCodeChange.bind(this);
  }

  componentDidMount(): void {
    this.setState({
      clientID: window.localStorage.getItem("client-id") || null,
      playerName: window.localStorage.getItem("client-name") || "",
      roomCode: window.location.hash.substr(1),
    });
  }

  /* eslint-disable class-methods-use-this */
  async handleSubmit(event: React.FormEvent<HTMLInputElement>): Promise<void> {
    event.preventDefault();

    const roomCode = this.state.roomCode.toUpperCase();

    this.props.joinGame({
      userName: this.state.playerName,
      clientID: this.state.clientID,
      roomCode,
    });
    window.location.hash = roomCode;
  }

  handleCodeChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      roomCode: event.target.value,
    });
  }

  focusCode(component: HTMLInputElement): void {
    if (component && !this.state.roomCode) {
      component.focus();
    }
  }

  focusName(component: HTMLInputElement): void {
    if (component && this.state.roomCode) {
      component.focus();
    }
  }

  render(): React.ReactNode {
    if (this.props.creating) {
      return null;
    }
    return (
      <FormWrapper>
        <form
          onSubmit={this.handleSubmit.bind(this)}
          className="bg-white shadow-md px-8 pt-6 pb-8 mb-4"
        >
          <div className="mb-4">
            <FormLabel>
              Code
              <FormInput
                type="text"
                value={this.state.roomCode}
                ref={this.focusCode.bind(this)}
                required
                tabIndex={1}
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
                ref={this.focusName.bind(this)}
                placeholder="Your Name"
                required
                tabIndex={2}
                maxLength={this.props.maxNameLength}
                onChange={(event): void =>
                  this.setState({ playerName: event.target.value })
                }
              />
            </FormLabel>
          </div>

          <FormError error={this.props.joinError} />

          <div className="flex justify-center">
            <SubmitButton
              value="Join Game"
              submitting={this.props.connecting}
            />
          </div>
        </form>
      </FormWrapper>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  joinError: state.joinError,
  connecting: state.connection.status === "connecting",
  creating: state.creatingGame,
});

export default connect(mapStateToProps)(JoinGame);
