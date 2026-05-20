import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/context/useSettingsStore';
import {
  folderListLayoutTitle,
  useFolderListLayoutStore,
} from '@/context/useFolderListLayoutStore';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { useScreenLayoutStyles } from '@/components/navigation/screenLayout';
import { themePreferenceTitle } from '@/utils/theme/themePreference';
import { transcriptionModeTitle } from '@/utils/processing/transcriptionMode';
import { processingModeTitle } from '@/utils/processing/processingMode';
import { useThemedColors, Spacing } from '@/theme';
import { useTranscriptBackup } from '@/hooks/useTranscriptBackup';
import { useClearCache } from '@/hooks/useClearCache';

export default function SettingsScreen() {
  const router = useRouter();
  const { scrollPaddingTop } = useTopChromeLayout();
  const colors = useThemedColors();
  const sl = useScreenLayoutStyles();
  const { summarizationMode, transcriptionMode, themePreference } = useSettingsStore();
  const folderLayout = useFolderListLayoutStore((s) => s.layout);
  const { busy: transcriptBackupBusy, exportTranscripts, importTranscripts } =
    useTranscriptBackup();
  const { busy: clearCacheBusy, confirmAndClearCache } = useClearCache();
  const storageBusy = transcriptBackupBusy || clearCacheBusy;

  return (
    <View style={sl.container}>
      <View style={[sl.scrollContent, styles.content, { paddingTop: scrollPaddingTop }]}>
        <Text style={[sl.sectionLabel, styles.firstSectionLabel]}>Transcription</Text>
        <View style={sl.card}>
          <TouchableOpacity
            style={sl.settingsRow}
            onPress={() => router.push('/transcription-mode')}
          >
            <Ionicons
              name="mic-outline"
              size={20}
              color={colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Transcription mode</Text>
            <Text style={sl.settingsRowValue}>
              {transcriptionModeTitle(transcriptionMode)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={sl.sectionLabel}>Summarization</Text>
        <View style={sl.card}>
          <TouchableOpacity
            style={sl.settingsRow}
            onPress={() => router.push('/processing-mode')}
          >
            <Ionicons
              name="sparkles-outline"
              size={20}
              color={colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Summarization mode</Text>
            <Text style={sl.settingsRowValue}>
              {processingModeTitle(summarizationMode)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={sl.sectionLabel}>Storage</Text>
        <View style={sl.card}>
          <TouchableOpacity
            style={sl.settingsRow}
            disabled={storageBusy}
            onPress={exportTranscripts}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={20}
              color={colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Export all transcripts</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={sl.cardDivider} />

          <TouchableOpacity
            style={sl.settingsRow}
            disabled={storageBusy}
            onPress={importTranscripts}
          >
            <Ionicons
              name="cloud-download-outline"
              size={20}
              color={colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Import transcripts or audio</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={sl.cardDivider} />

          <TouchableOpacity
            style={sl.settingsRow}
            disabled={storageBusy}
            onPress={confirmAndClearCache}
          >
            <Ionicons name="trash-outline" size={20} color={colors.red} style={sl.settingsRowIcon} />
            <Text style={[sl.settingsRowTitle, sl.settingsRowTitleDanger]}>Clear cache</Text>
          </TouchableOpacity>
        </View>

        <Text style={sl.sectionLabel}>Library</Text>
        <View style={sl.card}>
          <TouchableOpacity
            style={sl.settingsRow}
            onPress={() => router.push('/folder-layout')}
          >
            <Ionicons
              name="grid-outline"
              size={20}
              color={colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Folder layout</Text>
            <Text style={sl.settingsRowValue}>{folderListLayoutTitle(folderLayout)}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={sl.sectionLabel}>Preferences</Text>
        <View style={sl.card}>
          <TouchableOpacity
            style={sl.settingsRow}
            onPress={() => router.push('/theme')}
          >
            <Text style={sl.settingsRowTitle}>Theme</Text>
            <Text style={sl.settingsRowValue}>{themePreferenceTitle(themePreference)}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[sl.versionText, styles.versionText]}>
          {Constants.expoConfig?.name ?? 'Briefly'}{' '}
          {Constants.expoConfig?.version ?? '3.6.0'}
        </Text>
      </View>

      <StackScreenHeader
        title="Settings"
        showBack
        onBack={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  firstSectionLabel: {
    marginTop: 0,
  },
  versionText: {
    marginTop: 'auto',
    paddingTop: Spacing.xl,
  },
});
