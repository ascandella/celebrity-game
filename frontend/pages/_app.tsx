import { AppProps } from "next/app";
import React from "react";
import "../styles/main.css";

export default function CelebrityApp({
  Component,
  pageProps,
}: AppProps): React.ReactNode {
  return <Component {...pageProps} />;
}
