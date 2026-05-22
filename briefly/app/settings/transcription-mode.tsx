import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useStackBack } from '@/components/navigation/useStackBack';
import { ModePickerOption } from '@/components/navigation/ModePickerOption';
import { useSettingsStore } from '@/context/useSettingsStore';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import {
  useModePickerStyles,
  useScreenLayoutStyles,
} from '@/components/navigation/screenLayout';
import { TranscriptionMode } from '@/types';
import {
  normalizeTranscriptionMode,
  transcriptionModeDescription,
  transcriptionModeTitle,
} from '@/utils/processing/transcriptionMode';
import {
  NATIVE_BUILD_REQUIRED_HINT,
  supportsOnDeviceLiveTranscription,
} from '@/utils/platformCapabilities';

const TRANSCRIPTION_MODES: TranscriptionMode[] = ['cloud', 'local'];

export default function TranscriptionModePickerScreen() {
  const goBack = useStackBack('/settings');
  const { scrollPaddingTop } = useTopChromeLayout();
  const sl = useScreenLayoutStyles();
  const mp = useModePickerStyles();
  const { transcriptionMode, setTranscriptionMode } = useSettingsStore();
  const selectedMode = normalizeTranscriptionMode(transcriptionMode);
  const canUseOnDeviceTranscription = supportsOnDeviceLiveTranscription();

  return (
    <View style={sl.container}>
      <ScrollView
        contentContainerStyle={[sl.scrollContent, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={sl.sectionDescription}>
          Choose where Briefly transcribes and summarizes after you stop recording. Live preview
          while recording is optional and does not change this.
        </Text>
        <View style={sl.card}>
          {TRANSCRIPTION_MODES.map((mode, index) => {
            const selected = selectedMode === mode;
            const disabled = mode === 'local' && !canUseOnDeviceTranscription;
            return (
              <React.Fragment key={mode}>
                <ModePickerOption
                  selected={selected}
                  disabled={disabled}
                  title={transcriptionModeTitle(mode)}
                  subtitle={transcriptionModeDescription(mode)}
                  unavailableHint={NATIVE_BUILD_REQUIRED_HINT}
                  onPress={() => setTranscriptionMode(mode)}
                />
                {index !== TRANSCRIPTION_MODES.length - 1 ? (
                  <View style={mp.optionDivider} />
                ) : null}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>

      <StackScreenHeader
        title="Transcription"
        showBack
        onBack={goBack}
      />
    </View>
  );
}
