import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeScreen} from '../screens/HomeScreen';
import {TranscriptListScreen} from '../screens/TranscriptListScreen';
import {TranscriptDetailScreen} from '../screens/TranscriptDetailScreen';
import {SettingsScreen} from '../screens/SettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  TranscriptList: undefined;
  TranscriptDetail: {transcriptId: string};
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{title: 'Briefly'}} />
        <Stack.Screen name="TranscriptList" component={TranscriptListScreen} options={{title: 'Transcripts'}} />
        <Stack.Screen name="TranscriptDetail" component={TranscriptDetailScreen} options={{title: 'Transcript'}} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{title: 'Settings'}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
