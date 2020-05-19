import React, { FunctionComponent } from "react";
import Head from "next/head";
import Header from "./header";

type ContentWrapperProps = {
  children: React.ReactNode;
};

const ContentWrapper: FunctionComponent<ContentWrapperProps> = ({
  children,
}: ContentWrapperProps) => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Head>
        <title>Celebrity Game</title>
      </Head>
      <Header />
      <div className="p-5 mx-auto max-w-lg lg:max-w-lg">{children}</div>
    </div>
  );
};

export default ContentWrapper;
