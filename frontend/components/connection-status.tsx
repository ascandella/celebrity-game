import React, { FunctionComponent, useEffect } from "react";
import { Dispatch } from "redux";
import { connect } from "react-redux";
import styled from "styled-components";
import { RootState } from "../reducers";
import CelebrityClient from "../clients/celebrity";
import { connectionStatus } from "../actions";

const StatusBanner = styled.div.attrs({
  className:
    "bg-teal-100 border-t-4 border-teal-500 rounded-b text-teal-900 px-4 py-3 shadow-md",
  role: "alert",
})``;

type ConnectionStatusProps = {
  connectionStatus: string;
  inGame: boolean;
  lastPongTime: number;
  client: CelebrityClient;
  pongTimeout: () => void;
};

const messages = {
  "pong-timeout": "Connection unstable",
  error: "Connection error",
  closed: "Connection lost",
};

const pingTime = 10000;

const ConnectionStatus: FunctionComponent<ConnectionStatusProps> = ({
  connectionStatus,
  inGame,
  client,
  lastPongTime,
  pongTimeout,
}: ConnectionStatusProps) => {
  useEffect(() => {
    if (!inGame) {
      return;
    }

    let lastPingSent: number;

    const pingInterval = window.setInterval(() => {
      lastPingSent = Date.now();
      client.sendCommand("ping", {});
      if (
        (lastPingSent && !lastPongTime) ||
        lastPingSent - lastPongTime > pingTime + 1000
      ) {
        pongTimeout();
      }
    }, pingTime);

    return () => {
      window.clearInterval(pingInterval);
    };
  });

  // TODO try to reconnect to server on pong-timeout

  const connectionStatusMessage = messages[connectionStatus];
  if (!connectionStatusMessage || !inGame) {
    return null;
  }
  return <StatusBanner>{connectionStatusMessage}</StatusBanner>;
};

const mapStateToProps = (state: RootState) => ({
  connectionStatus: state.connection.status,
  lastPongTime: state.connection.lastPong,
  inGame: state.inGame,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  pongTimeout: () => dispatch(connectionStatus("pong-timeout")),
});

export default connect(mapStateToProps, mapDispatchToProps)(ConnectionStatus);
