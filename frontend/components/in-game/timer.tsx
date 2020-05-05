import React, { Component } from "react";
import { connect } from "react-redux";
import { RootState } from "../../reducers";

type TimerProps = {
  turnEnd: Date;
};

type TimerState = {
  secondsRemaining: number;
};

const computeSeconds = (turnEnd: Date): number => {
  if (!turnEnd) {
    return null;
  }
  const timeDelta = turnEnd.getTime() - new Date().getTime();

  return Math.max(0, Math.ceil(timeDelta / 1000));
};

class Timer extends Component<TimerProps, TimerState> {
  interval: ReturnType<typeof setInterval>;

  constructor(props) {
    super(props);
    this.state = {
      secondsRemaining: computeSeconds(this.props.turnEnd),
    };
  }

  componentDidMount(): void {
    this.interval = setInterval(() => {
      if (this.state.secondsRemaining > 0) {
        this.setState({
          secondsRemaining: this.state.secondsRemaining - 1,
        });
      }
    }, 1000);
  }

  componentDidUpdate(prevProps): void {
    if (this.props.turnEnd !== prevProps.turnEnd && this.props.turnEnd) {
      this.setState({
        secondsRemaining: computeSeconds(this.props.turnEnd),
      });
    }
  }

  componentWillUnmount(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  render(): React.ReactNode {
    if (!this.state.secondsRemaining) {
      return null;
    }
    const textStyle = this.state.secondsRemaining <= 10 ? "text-red-700" : " ";
    return (
      <div
        className={`w-full text-center text-lg font-medium mb-6 ${textStyle}`}
      >
        {this.state.secondsRemaining}
      </div>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  turnEnd: state.turnEnds,
});

export default connect(mapStateToProps)(Timer);
