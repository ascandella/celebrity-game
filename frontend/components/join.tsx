import React, { Component } from "react";
import SmallForm from "./small-form";
import CelebrityClient from "../clients/celebrity";

type JoinProps = {
  maxCodeLength: number;
  maxNameLength: number;
  client: CelebrityClient;
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
      await this.props.client.connect();
    } catch (err) {
      this.setState({
        joinError: "Unable to connect to game server",
      });
    }
    this.setState({
      connecting: false,
    });

    // TODO actual handshake
    this.props.client.wsClient.send(
      `Name: ${this.state.name}, Room: ${this.state.gameCode}`
    );
  }

  handleCodeChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      gameCode: event.target.value,
    });
  }

  render(): React.ReactNode {
    return (
      <SmallForm>
        <form
          onSubmit={this.handleSubmit.bind(this)}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">
              Code
              <input
                type="text"
                value={this.state.gameCode}
                autoFocus
                required
                maxLength={this.props.maxCodeLength}
                onChange={this.handleCodeChange}
                className="bg-white uppercase focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal9"
              />
            </label>

            <label className="block text-gray-700 font-bold mb-2">
              Name
              <input
                type="text"
                value={this.state.name}
                placeholder="Your Name"
                required
                maxLength={this.props.maxNameLength}
                onChange={(event): void =>
                  this.setState({ name: event.target.value })
                }
                className="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal9"
              />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <input
              type="submit"
              value="Join Game"
              disabled={this.state.connecting}
              className={
                /* eslint-disable prefer-template */
                (this.state.connecting ? "opacity-50 " : "") +
                "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 cursor-pointer rounded focus:outline-none focus:shadow-outline"
              }
            />
            {this.state.joinError && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 p-2 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{this.state.joinError}</span>
              </div>
            )}
          </div>
        </form>
      </SmallForm>
    );
  }
}
