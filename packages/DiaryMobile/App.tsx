import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
