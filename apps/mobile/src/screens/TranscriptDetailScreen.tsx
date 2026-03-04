import React, {useEffect, useRef, useState} from 'react';
import {Button, ScrollView, Text, TextInput, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import {useBrieflyStore, useBrieflyStoreVersion} from '../store/BrieflyContext';

type Props = NativeStackScreenProps<RootStackParamList, 'TranscriptDetail'>;

export function TranscriptDetailScreen({route}: Props) {
  const store = useBrieflyStore();
  useBrieflyStoreVersion();
  const transcript = store.getTranscript(route.params.transcriptId);
  const transcriptId = transcript?.id;
  const transcriptText = transcript?.text ?? '';
  const previousTranscriptId = useRef<string | undefined>(transcriptId);
  const [draft, setDraft] = useState(transcript?.text ?? '');
  const [isDirty, setIsDirty] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    if (transcriptId !== previousTranscriptId.current) {
      previousTranscriptId.current = transcriptId;
      setIsDirty(false);
      setDraft(transcriptText);
      return;
    }

    if (transcript && !isDirty) {
      setDraft(transcriptText);
    }
  }, [isDirty, transcript, transcriptId, transcriptText]);

  if (!transcript) {
    return (
      <View style={{padding: 16}}>
        <Text>Transcript not found.</Text>
      </View>
    );
  }

  async function saveEdit() {
    await store.updateTranscriptText(transcript.id, draft);
    setIsDirty(false);
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
        onChangeText={value => {
          setDraft(value);
          setIsDirty(true);
        }}
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
