import React, { FunctionComponent } from "react";
import Header from "./header";

type ContentWrapperProps = {
  children: React.ReactNode;
};

const ContentWrapper: FunctionComponent = ({
  children,
}: ContentWrapperProps) => (
  <div className="bg-gray-100 min-h-screen">
    <Header />
    <div className="mt-6">{children}</div>
  </div>
);

export default ContentWrapper;
