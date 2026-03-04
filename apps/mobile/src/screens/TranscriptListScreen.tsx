import React from 'react';
import {FlatList, Pressable, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import {useBrieflyStore, useBrieflyStoreVersion} from '../store/BrieflyContext';

type Props = NativeStackScreenProps<RootStackParamList, 'TranscriptList'>;

export function TranscriptListScreen({navigation}: Props) {
  const store = useBrieflyStore();
  useBrieflyStoreVersion();
  const transcripts = store.getTranscripts();

  return (
    <FlatList
      contentContainerStyle={{padding: 16, gap: 8}}
      data={transcripts}
      keyExtractor={item => item.id}
      renderItem={({item}) => (
        <Pressable
          onPress={() =>
            navigation.navigate('TranscriptDetail', {transcriptId: item.id})
          }
          style={{borderWidth: 1, borderRadius: 8, padding: 12}}
        >
          <Text style={{fontWeight: '600'}}>{item.title}</Text>
          <Text>{new Date(item.createdAt).toLocaleDateString()}</Text>
          <Text>{item.durationSeconds}s</Text>
        </Pressable>
      )}
      ListEmptyComponent={<View><Text>No transcripts yet.</Text></View>}
    />
  );
}
