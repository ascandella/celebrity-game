import React, { Component } from "react";
import { connect } from "react-redux";
import { RootState } from "../../reducers";

type TimerProps = {
  turnEnds: Date;
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
      secondsRemaining: computeSeconds(this.props.turnEnds),
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
    if (this.props.turnEnds !== prevProps.turnEnds) {
      this.setState({
        secondsRemaining: computeSeconds(this.props.turnEnds),
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
    return <span className={textStyle}>{this.state.secondsRemaining}</span>;
  }
}

const mapStateToProps = (state: RootState) => ({
  turnEnds: state.turnEnds,
});

export default connect(mapStateToProps)(Timer);
