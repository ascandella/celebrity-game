import React, { FunctionComponent } from "react";
import ContentWrapper from "../components/content-wrapper";
import JoinGame from "../components/join";
import CelebrityClient from "../clients/celebrity";

const Index: FunctionComponent = () => {
  const client = new CelebrityClient();
  return (
    <ContentWrapper>
      <JoinGame client={client} />
    </ContentWrapper>
  );
};

export default Index;
