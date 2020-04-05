import React, { Component } from "react";

type SmallFormProps = {
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent) => void;
  submitText: string;
};

export default class SmallForm extends Component<SmallFormProps, {}> {
  static defaultProps = {
    submitText: "submit",
  };

  render(): React.ReactNode {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <form
            onSubmit={this.props.onSubmit}
            className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
          >
            {this.props.children}

            <div className="flex items-center justify-between">
              <input
                type="submit"
                value={this.props.submitText}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4
                           cursor-pointer rounded focus:outline-none focus:shadow-outline"
              />
            </div>
          </form>
        </div>
      </div>
    );
  }
}
