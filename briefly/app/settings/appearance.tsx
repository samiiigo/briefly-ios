import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSettingsStore } from '@/context/useSettingsStore';
import {
  themePreferenceDescription,
  themePreferenceTitle,
  type ThemePreference,
} from '@/utils/theme/themePreference';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import {
  useModePickerStyles,
  useScreenLayoutStyles,
} from '@/components/navigation/screenLayout';
import { useStackBack } from '@/components/navigation/useStackBack';

const THEME_OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];

export default function ThemePickerScreen() {
  const goBack = useStackBack('/settings');
  const { scrollPaddingTop } = useTopChromeLayout();
  const sl = useScreenLayoutStyles();
  const mp = useModePickerStyles();
  const themePreference = useSettingsStore((s) => s.themePreference);
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);

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
          {THEME_OPTIONS.map((option, index) => {
            const selected = themePreference === option;
            return (
              <React.Fragment key={option}>
                <TouchableOpacity
                  style={mp.optionRow}
                  onPress={() => setThemePreference(option)}
                >
                  <View style={[mp.radio, selected && mp.radioSelected]}>
                    {selected ? <View style={mp.radioDot} /> : null}
                  </View>
                  <View style={mp.optionText}>
                    <Text style={mp.optionTitle}>{themePreferenceTitle(option)}</Text>
                    <Text style={mp.optionSubtitle}>
                      {themePreferenceDescription(option)}
                    </Text>
                  </View>
                </TouchableOpacity>
                {index !== THEME_OPTIONS.length - 1 ? (
                  <View style={mp.optionDivider} />
                ) : null}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>

      <StackScreenHeader title="Theme" showBack onBack={goBack} />
    </View>
  );
}
