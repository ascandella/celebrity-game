import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { RootState } from "../reducers";

const StatusBanner = styled.div.attrs({
  className:
    "bg-teal-100 border-t-4 border-teal-500 rounded-b text-teal-900 px-4 py-3 shadow-md",
  role: "alert",
})``;

type ConnectionStatusProps = {
  connectionStatus: string;
  inGame: boolean;
  lastPongTime: number;
};

const messages = {
  "pong-timeout": "Connection unstable",
  error: "Connection error",
  closed: "Connection lost",
};

const getConnectionStatus = (status: string): string => {
  return messages[status];
};

const ConnectionStatus: FunctionComponent<ConnectionStatusProps> = ({
  connectionStatus,
  inGame,
}: ConnectionStatusProps) => {
  if (!connectionStatus || !inGame) {
    return null;
  }
  return <StatusBanner>{connectionStatus}</StatusBanner>;
};

const mapStateToProps = (state: RootState) => ({
  connectionStatus: getConnectionStatus(state.connectionStatus),
  lastPongTime: state.lastPongTime,
  inGame: state.inGame,
});

export default connect(mapStateToProps)(ConnectionStatus);
