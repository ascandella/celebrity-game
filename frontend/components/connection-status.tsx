import React, { FunctionComponent } from "react";
import styled from "styled-components";

const StatusBanner = styled.div.attrs({
  className:
    "bg-teal-100 border-t-4 border-teal-500 rounded-b text-teal-900 px-4 py-3 shadow-md",
  role: "alert",
})``;

type ConnectionStatusProps = {
  status: string;
};

const messages = {
  "pong-timeout": "Connection unstable",
  error: "Connection error",
  closed: "Connection lost",
};

const ConnectionStatus: FunctionComponent<ConnectionStatusProps> = ({
  status,
}: ConnectionStatusProps) => {
  const userMessage = messages[status];
  if (!userMessage) {
    return null;
  }
  return <StatusBanner>{userMessage}</StatusBanner>;
};

export default ConnectionStatus;
