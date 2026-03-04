import React, {useState} from 'react';
import {Button, ScrollView, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import {pauseRecording, startRecording, stopRecording} from '../services/recording';
import {startNativeTranscription, stopNativeTranscription} from '../services/transcription';
import {useBrieflyStore, useBrieflyStoreVersion} from '../store/BrieflyContext';
import {NativeIOSCard} from '../components/NativeIOSCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({navigation}: Props) {
  const store = useBrieflyStore();
  useBrieflyStoreVersion();
  const [recording, setRecording] = useState(false);
  const recent = store.getTranscripts().slice(0, 5);

  async function onRecord() {
    await startRecording();
    await startNativeTranscription();
    setRecording(true);
  }

  async function onPause() {
    await pauseRecording();
  }

  async function onStop() {
    await stopRecording();
    const {text, durationSeconds} = await stopNativeTranscription();
    if (text.trim().length > 0) {
      await store.addTranscript({
        title: `Recording ${new Date().toLocaleString()}`,
        durationSeconds,
        text,
      });
    }
    setRecording(false);
  }

  return (
    <ScrollView contentContainerStyle={{padding: 16, gap: 12}}>
      <NativeIOSCard title="Briefly Native iOS Card" />
      <Text>Record audio and create transcripts.</Text>
      <View style={{flexDirection: 'row', gap: 8}}>
        <Button title="Record" onPress={onRecord} disabled={recording} />
        <Button title="Pause" onPress={onPause} disabled={!recording} />
        <Button title="Stop" onPress={onStop} disabled={!recording} />
      </View>
      <Button title="View Transcripts" onPress={() => navigation.navigate('TranscriptList')} />
      <Button title="Settings" onPress={() => navigation.navigate('Settings')} />
      <Text style={{fontWeight: '600'}}>Recent</Text>
      {recent.map(item => (
        <View key={item.id} style={{paddingVertical: 8}}>
          <Text>{item.title}</Text>
          <Text>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
