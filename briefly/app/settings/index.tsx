import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useStackBack } from '@/components/navigation/layout/useStackBack';
import { StackScreenHeader } from '@/components/navigation/header/StackScreenHeader';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import { useTopChromeLayout } from '@/components/navigation/layout/useTopChromeLayout';
import { useSettingsSheetLayoutStyles } from '@/components/navigation/layout/screenLayout';
import { SettingsNavigateRow } from '@/components/settings/SettingsNavigateRow';
import { SettingsToggleRow } from '@/components/settings/SettingsToggleRow';
import { SettingsProfileCard } from '@/components/settings/SettingsProfileCard';
import { Spacing, useThemedColors } from '@/theme';
import { useSettingsHub } from '@/hooks/settings/useSettingsHub';
import { useSettingsProfile } from '@/hooks/settings/useSettingsProfile';

export default function SettingsScreen() {
  const goBack = useStackBack('/(tabs)');
  const { scrollPaddingTop } = useTopChromeLayout();
  const colors = useThemedColors();
  const sl = useSettingsSheetLayoutStyles();
  const { profile } = useSettingsProfile();
  const {
    showLivePreview,
    setShowLivePreview,
    routes,
    storageBusy,
    exportTranscripts,
    importTranscripts,
    confirmAndClearCache,
    appVersionLabel,
  } = useSettingsHub();

  return (
    <View style={sl.container}>
      <ScrollView
        contentContainerStyle={[sl.scrollContent, styles.content, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <SettingsProfileCard profile={profile} />
        <View style={sl.settingsProfileGap} />

        <Text style={[sl.sectionLabel, styles.firstSectionLabel]}>General</Text>
        <View style={sl.card}>
          <SettingsNavigateRow
            title="Preferences"
            icon="options-outline"
            showChevron={false}
            onPress={routes.appearance}
          />
          <View style={sl.cardDivider} />
          <SettingsNavigateRow
            title="Transcription"
            icon="mic-outline"
            showChevron={false}
            onPress={routes.transcriptionMode}
          />
          <View style={sl.cardDivider} />
          <SettingsNavigateRow
            title="Summarization"
            icon="sparkles-outline"
            showChevron={false}
            onPress={routes.processingMode}
          />
          <View style={sl.cardDivider} />
          <SettingsToggleRow
            title="Show live preview"
            icon="eye-outline"
            value={showLivePreview}
            onValueChange={setShowLivePreview}
          />
          <View style={sl.cardDivider} />
          <SettingsNavigateRow
            title="Library"
            icon="grid-outline"
            showChevron={false}
            onPress={routes.folderLayout}
          />
        </View>

        <Text style={sl.sectionLabel}>Storage</Text>
        <View style={sl.card}>
          <SettingsNavigateRow
            title="Export all transcripts"
            icon="cloud-upload-outline"
            showChevron={false}
            disabled={storageBusy}
            onPress={exportTranscripts}
          />
          <View style={sl.cardDivider} />
          <SettingsNavigateRow
            title="Import transcripts or audio"
            icon="cloud-download-outline"
            showChevron={false}
            disabled={storageBusy}
            onPress={importTranscripts}
          />
        </View>

        <View style={sl.settingsActionCard}>
          <TouchableOpacity
            style={sl.settingsActionButton}
            disabled={storageBusy}
            onPress={confirmAndClearCache}
            accessibilityRole="button"
            accessibilityLabel="Clear cache"
          >
            <Text style={sl.settingsActionLabel}>Clear cache</Text>
          </TouchableOpacity>
        </View>

        <Text style={[sl.versionText, styles.versionText]}>{appVersionLabel}</Text>
      </ScrollView>
      <StackScreenHeader
        title="Settings"
        centerTitle
        titleSize="nav"
        trailing={
          <CircularIconButton
            icon="close"
            accessibilityLabel="Close"
            onPress={goBack}
            style={{ backgroundColor: colors.surfaceElevated }}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  firstSectionLabel: {
    marginTop: 0,
  },
  versionText: {
    marginTop: 'auto',
    paddingTop: Spacing.xl,
    paddingBottom: 0,
  },
});
