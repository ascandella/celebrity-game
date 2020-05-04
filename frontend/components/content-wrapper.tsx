import React, { FunctionComponent } from "react";
import { connect } from "react-redux";
import Head from "next/head";
import Header from "./header";
import { RootState } from "../reducers";

type ContentWrapperProps = {
  showHeader: boolean;
  children: React.ReactNode;
};

const ContentWrapper: FunctionComponent<ContentWrapperProps> = ({
  showHeader,
  children,
}: ContentWrapperProps) => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Head>
        <title>Celebrity Game</title>
      </Head>
      {showHeader && <Header />}
      <div className="p-8 mx-auto max-w-lg lg:max-w-lg">{children}</div>
    </div>
  );
};

const mapStateToProps = (state: RootState) => ({
  showHeader: !state.inGame,
});

export default connect(mapStateToProps)(ContentWrapper);
