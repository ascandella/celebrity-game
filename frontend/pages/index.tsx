import React, { FunctionComponent } from 'react';
import Header from '../components/header';
import JoinGame from '../components/join';

const Index: FunctionComponent = () => (
  <div className="bg-gray-100 h-screen">
    <Header />
    <JoinGame />
  </div>
);


export default Index;
