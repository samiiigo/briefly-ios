import React, {useState} from 'react';
import {Button, Switch, Text, TextInput, View} from 'react-native';
import {useBrieflyStore} from '../store/BrieflyContext';

export function SettingsScreen() {
  const store = useBrieflyStore();
  const [cloudEnabled, setCloudEnabled] = useState(store.getMode() === 'cloud');
  const [baseUrl, setBaseUrl] = useState(store.getCloudConfig().baseUrl);
  const [apiKey, setApiKey] = useState(store.getCloudConfig().apiKey ?? '');

  function toggleMode(value: boolean) {
    setCloudEnabled(value);
    store.setMode(value ? 'cloud' : 'local');
  }

  function saveCloudSettings() {
    store.setCloudConfig({baseUrl, apiKey});
  }

  return (
    <View style={{padding: 16, gap: 12}}>
      <Text style={{fontWeight: '600'}}>Cloud Mode</Text>
      <Switch value={cloudEnabled} onValueChange={toggleMode} />
      <Text>Cloud API Base URL</Text>
      <TextInput
        value={baseUrl}
        onChangeText={setBaseUrl}
        autoCapitalize="none"
        style={{borderWidth: 1, borderRadius: 8, padding: 8}}
      />
      <Text>Cloud API Key</Text>
      <TextInput
        value={apiKey}
        onChangeText={setApiKey}
        autoCapitalize="none"
        style={{borderWidth: 1, borderRadius: 8, padding: 8}}
      />
      <Button title="Save Settings" onPress={saveCloudSettings} />
    </View>
  );
}
