import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/context/useSettingsStore';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { TopBlurFade } from '@/components/navigation/TopBlurFade';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { screenLayoutStyles as sl } from '@/components/navigation/screenLayout';
import { TranscriptionMode } from '@/types';
import {
  normalizeTranscriptionMode,
  transcriptionModeDescription,
  transcriptionModeTitle,
} from '@/utils/transcriptionMode';
import { Colors, withAppFont } from '@/theme';

const TRANSCRIPTION_MODES: TranscriptionMode[] = [
  'live-assemblyai',
  'post-assemblyai',
  'local-on-device',
];

export default function TranscriptionModePickerScreen() {
  const router = useRouter();
  const { scrollPaddingTop, topInset } = useTopChromeLayout();
  const { defaultTranscriptionMode, setDefaultTranscriptionMode } = useSettingsStore();
  const selectedMode = normalizeTranscriptionMode(defaultTranscriptionMode);

  return (
    <View style={sl.container}>
      <ScrollView
        contentContainerStyle={[sl.scrollContent, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={sl.sectionDescription}>
          Choose how each recording is transcribed by default.
        </Text>
        <View style={sl.card}>
          {TRANSCRIPTION_MODES.map((mode, index) => {
            const selected = selectedMode === mode;
            return (
              <React.Fragment key={mode}>
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => setDefaultTranscriptionMode(mode)}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{transcriptionModeTitle(mode)}</Text>
                    <Text style={styles.optionSubtitle}>
                      {transcriptionModeDescription(mode)}
                    </Text>
                  </View>
                </TouchableOpacity>
                {index !== TRANSCRIPTION_MODES.length - 1 ? (
                  <View style={styles.optionDivider} />
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

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    minHeight: 72,
  },
  optionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 16 + 22 + 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textPrimary,
  },
  optionText: { flex: 1 },
  optionTitle: withAppFont({
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
  }),
  optionSubtitle: withAppFont({
    fontSize: 14,
    color: Colors.subtext,
    lineHeight: 20,
    marginTop: 4,
  }),
});
