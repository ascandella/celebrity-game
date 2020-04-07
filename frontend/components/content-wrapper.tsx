import React, { FunctionComponent } from "react";
import Head from "next/head";
import Header from "./header";

type ContentWrapperProps = {
  children: React.ReactNode;
};

const ContentWrapper: FunctionComponent = ({
  children,
}: ContentWrapperProps) => (
  <div className="bg-gray-100 min-h-screen">
    <Head>
      <title>Celebrity Game</title>
    </Head>
    <Header />
    <div className="mt-6 px-6">{children}</div>
  </div>
);

export default ContentWrapper;