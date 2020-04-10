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

const ConnectionStatus: FunctionComponent<ConnectionStatusProps> = ({
  status,
}: ConnectionStatusProps) => {
  if (status == "pong-timeout") {
    return <StatusBanner>Connection unstable</StatusBanner>;
  } else if (status == "error") {
    return <StatusBanner>Connection error</StatusBanner>;
  } else if (status == "closed") {
    return <StatusBanner>Connection lost</StatusBanner>;
  }
  return null;
};

export default ConnectionStatus;
