import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useStackBack } from '@/navigation/layout/useStackBack';
import { StackScreenHeader } from '@/navigation/header/StackScreenHeader';
import { CircularIconButton } from '@briefly/ui/native';
import { useSettingsTopChromeLayout } from '@/navigation/layout/useSettingsTopChromeLayout';
import { useSettingsSheetLayoutStyles } from '@/navigation/layout/screenLayout';
import { SettingsNavigateRow } from '@/features/settings/components/SettingsNavigateRow';
import { SettingsToggleRow } from '@/features/settings/components/SettingsToggleRow';
import { SettingsProfileCard } from '@/features/settings/components/SettingsProfileCard';
import { Spacing, useThemedColors } from '@briefly/theme/native';
import { useSettingsHub } from '@/features/settings/hooks/useSettingsHub';
import { useSettingsProfile } from '@/features/settings/hooks/useSettingsProfile';
import { useAuth } from '@/providers/AuthProvider';

export default function SettingsScreen() {
  const goBack = useStackBack('/(tabs)');
  const { scrollPaddingTop } = useSettingsTopChromeLayout();
  const colors = useThemedColors();
  const sl = useSettingsSheetLayoutStyles();
  const { profile } = useSettingsProfile();
  const { user, signOutUser } = useAuth();
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
        <View style={styles.profileCard}>
          <SettingsProfileCard profile={profile} />
        </View>
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

        <Text style={sl.sectionLabel}>Account</Text>
        <View style={sl.card}>
          <SettingsNavigateRow
            title={user?.email ?? user?.fullName ?? 'Signed in'}
            icon="person-circle-outline"
            showChevron={false}
            onPress={() => {}}
          />
          <View style={sl.cardDivider} />
          <SettingsNavigateRow
            title="Sign out"
            icon="log-out-outline"
            showChevron={false}
            onPress={() => {
              void signOutUser();
            }}
          />
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
  profileCard: {
    marginTop: Spacing.md,
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
