import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/context/useSettingsStore';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { TopBlurFade } from '@/components/navigation/TopBlurFade';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import {
  modePickerStyles as mp,
  screenLayoutStyles as sl,
} from '@/components/navigation/screenLayout';
import { TranscriptionMode } from '@/types';
import {
  normalizeTranscriptionMode,
  transcriptionModeDescription,
  transcriptionModeTitle,
} from '@/utils/processing/transcriptionMode';

const TRANSCRIPTION_MODES: TranscriptionMode[] = [
  'live-assemblyai',
  'post-assemblyai',
  'local-on-device',
];

export default function TranscriptionModePickerScreen() {
  const router = useRouter();
  const { scrollPaddingTop, topInset } = useTopChromeLayout();
  const { transcriptionMode, setTranscriptionMode } = useSettingsStore();
  const selectedMode = normalizeTranscriptionMode(transcriptionMode);

  return (
    <View style={sl.container}>
      <ScrollView
        contentContainerStyle={[sl.scrollContent, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={sl.sectionDescription}>
          Choose how Briefly transcribes recordings. This applies to every recording.
        </Text>
        <View style={sl.card}>
          {TRANSCRIPTION_MODES.map((mode, index) => {
            const selected = selectedMode === mode;
            return (
              <React.Fragment key={mode}>
                <TouchableOpacity
                  style={mp.optionRow}
                  onPress={() => setTranscriptionMode(mode)}
                >
                  <View style={[mp.radio, selected && mp.radioSelected]}>
                    {selected ? <View style={mp.radioDot} /> : null}
                  </View>
                  <View style={mp.optionText}>
                    <Text style={mp.optionTitle}>{transcriptionModeTitle(mode)}</Text>
                    <Text style={mp.optionSubtitle}>
                      {transcriptionModeDescription(mode)}
                    </Text>
                  </View>
                </TouchableOpacity>
                {index !== TRANSCRIPTION_MODES.length - 1 ? (
                  <View style={mp.optionDivider} />
                ) : null}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>

      <TopBlurFade />
      <View style={[sl.headerOverlay, { paddingTop: topInset }]} pointerEvents="box-none">
        <StackScreenHeader
          title="Transcription"
          showBack
          onBack={() => router.back()}
        />
      </View>
    </View>
  );
}
