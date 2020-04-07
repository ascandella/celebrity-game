import React, { FunctionComponent } from "react";
import Head from "next/head";
import Header from "./header";

type ContentWrapperProps = {
  showHeader: boolean;
  children: React.ReactNode;
};

const ContentWrapper: FunctionComponent<ContentWrapperProps> = ({
  showHeader,
  children,
}: ContentWrapperProps) => (
  <div className="bg-gray-100 min-h-screen">
    <Head>
      <title>Celebrity Game</title>
    </Head>
    {showHeader && <Header />}
    <div className="p-6">{children}</div>
  </div>
);

export default ContentWrapper;
