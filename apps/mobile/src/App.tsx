import React from 'react';
import {Appearance, StatusBar, useColorScheme} from 'react-native';
import {BrieflyStoreProvider} from './store/BrieflyContext';
import {RootNavigator} from './navigation/RootNavigator';

Appearance.setColorScheme?.(null);

export default function App() {
  const scheme = useColorScheme();

  return (
    <BrieflyStoreProvider>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </BrieflyStoreProvider>
  );
}
