import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useStackBack } from '@/navigation/layout/useStackBack';
import { ModePickerOption } from '@/navigation/header/ModePickerOption';
import { StackScreenHeader } from '@/navigation/header/StackScreenHeader';
import { useSettingsTopChromeLayout } from '@/navigation/layout/useSettingsTopChromeLayout';
import {
  useModePickerStyles,
  useSettingsSheetLayoutStyles,
} from '@/navigation/layout/screenLayout';
import { NATIVE_BUILD_REQUIRED_HINT } from '@/shared/utils/platformCapabilities';
import { useTranscriptionModeSettings } from '@/features/settings/hooks/useTranscriptionModeSettings';
import { useThemedColors } from '@/shared/theme';

export default function TranscriptionModePickerScreen() {
  const goBack = useStackBack('/settings');
  const { scrollPaddingTop } = useSettingsTopChromeLayout();
  const colors = useThemedColors();
  const sl = useSettingsSheetLayoutStyles();
  const mp = useModePickerStyles();
  const { options, selectMode } = useTranscriptionModeSettings();

  return (
    <View style={sl.container}>
      <ScrollView
        contentContainerStyle={[sl.scrollContent, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={sl.sectionLabel}>Transcription mode</Text>
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
        <Text style={sl.sectionDescription}>
          Choose where Briefly transcribes after you stop recording. Live preview is configured
          separately.
        </Text>
      </ScrollView>
      <StackScreenHeader
        title="Transcription"
        showBack
        onBack={goBack}
        leadingIcon="chevron-back"
        centerTitle
        titleSize="nav"
        buttonStyle={{ backgroundColor: colors.surfaceElevated }}
      />
    </View>
  );
}
