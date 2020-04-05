import React, { Component } from "react";
import SmallForm from "./small-form";

type JoinProps = {
  maxCodeLength: number;
  maxNameLength: number;
};

type JoinState = {
  gameCode: string;
  name: string;
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
    };
    this.handleCodeChange = this.handleCodeChange.bind(this);
  }

  /* eslint-disable class-methods-use-this */
  handleSubmit(event: React.FormEvent<HTMLInputElement>): void {
    event.preventDefault();
    // TODO connect
  }

  handleCodeChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      gameCode: event.target.value,
    });
  }

  render(): React.ReactNode {
    return (
      <div className="mt-6 mx-6">
        <SmallForm
          onSubmit={this.handleSubmit.bind(this)}
          submitText="Join Game"
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
        </SmallForm>
      </div>
    );
  }
}
