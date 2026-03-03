import React from 'react';
import { StatusBar } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <RootNavigator />
    </>
  );
}
