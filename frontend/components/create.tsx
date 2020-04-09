import React, { Component } from "react";
import SmallForm from "./small-form";
import { CreateGameRequest } from "../clients/celebrity";

type CreateProps = {
  createGame: (CreateGameRequest) => void;
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
      name: "",
      connecting: false,
      createError: "",
    };
  }

  async handleSubmit(event: React.FormEvent<HTMLInputElement>): Promise<void> {
    this.setState({ connecting: true });

    try {
      await this.props.createGame({
        userName: this.state.name,
        maxPlayers: this.state.maxPlayers,
      });
    } catch (err) {
      this.setState({ createError: err });
    }
    this.setState({ connecting: false });
  }

  render(): React.ReactNode {
    return (
      <SmallForm>
        <form
          onSubmit={this.handleSubmit.bind(this)}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Name
              <input
                type="text"
                value={this.state.name}
                placeholder="Your Name"
                required
                onChange={(event): void =>
                  this.setState({ name: event.target.value })
                }
                className="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal9"
              />
            </label>
          </div>
          {this.state.createError && (
            <div className="flex items-center mb-4">
              <div
                className="bg-red-100 border border-red-400 text-red-700 p-2 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{this.state.createError}</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <input
              type="submit"
              value="Create Game"
              disabled={this.state.connecting}
              className={
                /* eslint-disable prefer-template */
                (this.state.connecting ? "opacity-50 " : "") +
                "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 cursor-pointer rounded focus:outline-none focus:shadow-outline"
              }
            />
          </div>
        </form>
      </SmallForm>
    );
  }
}
