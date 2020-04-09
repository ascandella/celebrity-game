import React, { Component } from "react";
import SmallForm from "./small-form";
import CelebrityClient from "../clients/celebrity";

type CreateProps = {
  client: CelebrityClient;
};

type CreateState = {
  maxPlayers: number;
  name: string;
  connecting: boolean;
};

export default class CreateGame extends Component<CreateProps, CreateState> {
  constructor(props: CreateProps) {
    super(props);
    this.state = {
      maxPlayers: 12,
      name: "",
      connecting: false,
    };
  }

  async handleSubmit(event: React.FormEvent<HTMLInputElement>): Promise<void> {
    event.preventDefault();
    try {
      await this.props.client.connect();
    } catch (err) {
      // TODO this
      // console.error("Error connecting");
    }

    try {
      await this.props.client.createGame({
        userName: this.state.name,
        maxPlayers: this.state.maxPlayers,
      });
    } catch (err) {
      // console.error("Error creating");
    }
    // TODO
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
