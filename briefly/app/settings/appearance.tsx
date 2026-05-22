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
import { useThemePreferenceSettings } from '@/hooks/settings/useThemePreferenceSettings';

export default function ThemePickerScreen() {
  const goBack = useStackBack('/settings');
  const { scrollPaddingTop } = useTopChromeLayout();
  const sl = useScreenLayoutStyles();
  const mp = useModePickerStyles();
  const { options, selectPreference } = useThemePreferenceSettings();

  return (
    <View style={sl.container}>
      <ScrollView
        contentContainerStyle={[sl.scrollContent, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={sl.sectionDescription}>
          Choose how Briefly looks. System follows your device light or dark mode.
        </Text>
        <View style={sl.card}>
          {options.map((option, index) => (
            <React.Fragment key={option.option}>
              <ModePickerOption
                selected={option.selected}
                title={option.title}
                subtitle={option.subtitle}
                onPress={() => selectPreference(option.option)}
              />
              {index !== options.length - 1 ? <View style={mp.optionDivider} /> : null}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
      <StackScreenHeader title="Theme" showBack onBack={goBack} />
    </View>
  );
}
