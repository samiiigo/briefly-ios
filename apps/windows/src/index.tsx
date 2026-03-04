import React from 'react';
import {AppRegistry, Button, Text, View} from 'react-native';

function WindowsApp() {
  return (
    <View style={{padding: 16, gap: 8}}>
      <Text style={{fontSize: 22, fontWeight: '600'}}>Briefly (Windows)</Text>
      <Text>React Native for Windows shell is wired.</Text>
      <Button title="Record" onPress={() => undefined} />
      <Button title="Transcripts" onPress={() => undefined} />
      <Button title="Settings" onPress={() => undefined} />
    </View>
  );
}

AppRegistry.registerComponent('BrieflyWindows', () => WindowsApp);
