import React, { Component } from "react";

type SmallFormProps = {
  children: React.ReactNode;
};

export default class SmallForm extends Component<SmallFormProps, {}> {
  render(): React.ReactNode {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-md">{this.props.children}</div>
      </div>
    );
  }
}
