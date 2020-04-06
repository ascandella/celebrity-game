import React, { FunctionComponent } from "react";
import Header from "../components/header";
import JoinGame from "../components/join";
import CelebrityClient from "../clients/celebrity";

const Index: FunctionComponent = () => {
  const client = new CelebrityClient();
  return (
    <div className="bg-gray-100 h-screen">
      <Header />
      <JoinGame client={client} />
    </div>
  );
};

export default Index;
