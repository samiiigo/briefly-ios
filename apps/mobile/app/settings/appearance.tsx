import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useStackBack } from '@/navigation/layout/useStackBack';
import { StackScreenHeader } from '@/navigation/header/StackScreenHeader';
import { useSettingsTopChromeLayout } from '@/navigation/layout/useSettingsTopChromeLayout';
import { useSettingsSheetLayoutStyles } from '@/navigation/layout/screenLayout';
import { useThemePreferenceSettings } from '@/features/settings/hooks/useThemePreferenceSettings';
import { BorderRadius, useCreateStyles, useThemedColors, withAppFont } from '@briefly/theme/native';
import type { ColorPalette } from '@briefly/theme';

export default function ThemePickerScreen() {
  const goBack = useStackBack('/settings');
  const { scrollPaddingTop } = useSettingsTopChromeLayout();
  const colors = useThemedColors();
  const sl = useSettingsSheetLayoutStyles();
  const styles = useCreateStyles(createStyles);
  const { options, selectPreference } = useThemePreferenceSettings();

  return (
    <View style={sl.container}>
      <ScrollView
        contentContainerStyle={[sl.scrollContent, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={sl.sectionLabel}>Appearance</Text>
        <View style={[sl.card, styles.card]}>
          <Text style={styles.label}>Theme</Text>
          <View style={styles.segmentedControl}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.option}
                style={[styles.segment, option.selected && styles.segmentSelected]}
                onPress={() => selectPreference(option.option)}
                accessibilityRole="button"
                accessibilityState={{ selected: option.selected }}
              >
                <Text style={[styles.segmentText, option.selected && styles.segmentTextSelected]}>
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Text style={sl.sectionDescription}>
          Choose how Briefly looks. System follows your device light or dark mode.
        </Text>
      </ScrollView>
      <StackScreenHeader
        title="Preferences"
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

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      padding: 16,
      gap: 14,
    },
    label: withAppFont({
      fontSize: 17,
      color: c.textPrimary,
    }),
    segmentedControl: {
      flexDirection: 'row',
      borderRadius: BorderRadius.full,
      backgroundColor: c.textTertiary,
      padding: 2,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 34,
      borderRadius: BorderRadius.full,
    },
    segmentSelected: {
      backgroundColor: c.subtext,
    },
    segmentText: withAppFont({
      fontSize: 15,
      fontWeight: '500',
      color: c.textPrimary,
    }),
    segmentTextSelected: {
      fontWeight: '600',
    },
  });
}
