import React, {useMemo, useState} from 'react';
import {Button, ScrollView, Text, TextInput, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import {useBrieflyStore} from '../store/BrieflyContext';

type Props = NativeStackScreenProps<RootStackParamList, 'TranscriptDetail'>;

export function TranscriptDetailScreen({route}: Props) {
  const store = useBrieflyStore();
  const transcript = useMemo(
    () => store.getTranscript(route.params.transcriptId),
    [route.params.transcriptId, store],
  );
  const [draft, setDraft] = useState(transcript?.text ?? '');
  const [result, setResult] = useState('');

  if (!transcript) {
    return (
      <View style={{padding: 16}}>
        <Text>Transcript not found.</Text>
      </View>
    );
  }

  async function saveEdit() {
    await store.updateTranscriptText(transcript.id, draft);
  }

  async function summarize() {
    const response = await store.summarize(transcript.id, 'summary');
    setResult(response);
  }

  async function insights() {
    const response = await store.summarize(transcript.id, 'insights');
    setResult(response);
  }

  return (
    <ScrollView contentContainerStyle={{padding: 16, gap: 12}}>
      <Text style={{fontWeight: '700'}}>{transcript.title}</Text>
      <Text>{new Date(transcript.createdAt).toLocaleString()}</Text>
      <TextInput
        multiline
        value={draft}
        onChangeText={setDraft}
        style={{borderWidth: 1, borderRadius: 8, minHeight: 180, padding: 8}}
      />
      <Button title="Save" onPress={saveEdit} />
      <View style={{flexDirection: 'row', gap: 8}}>
        <Button title="Summarize" onPress={summarize} />
        <Button title="Get Insights" onPress={insights} />
      </View>
      <Text style={{fontWeight: '600'}}>Result</Text>
      <Text>{result}</Text>
    </ScrollView>
  );
}
