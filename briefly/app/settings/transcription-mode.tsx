import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useStackBack } from '@/components/navigation/layout/useStackBack';
import { ModePickerOption } from '@/components/navigation/header/ModePickerOption';
import { StackScreenHeader } from '@/components/navigation/header/StackScreenHeader';
import { useTopChromeLayout } from '@/components/navigation/layout/useTopChromeLayout';
import {
  useModePickerStyles,
  useScreenLayoutStyles,
} from '@/components/navigation/layout/screenLayout';
import { NATIVE_BUILD_REQUIRED_HINT } from '@/utils/platformCapabilities';
import { useTranscriptionModeSettings } from '@/hooks/settings/useTranscriptionModeSettings';

export default function TranscriptionModePickerScreen() {
  const goBack = useStackBack('/settings');
  const { scrollPaddingTop } = useTopChromeLayout();
  const sl = useScreenLayoutStyles();
  const mp = useModePickerStyles();
  const { options, selectMode } = useTranscriptionModeSettings();

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
          {options.map((option, index) => (
            <React.Fragment key={option.mode}>
              <ModePickerOption
                selected={option.selected}
                disabled={option.disabled}
                title={option.title}
                subtitle={option.subtitle}
                unavailableHint={NATIVE_BUILD_REQUIRED_HINT}
                onPress={() => selectMode(option.mode)}
              />
              {index !== options.length - 1 ? <View style={mp.optionDivider} /> : null}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
      <StackScreenHeader title="Transcription" showBack onBack={goBack} />
    </View>
  );
}
