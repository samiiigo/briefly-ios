import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import { FolderListViewOptionsSheet } from '@/components/features/library/FolderListViewOptionsSheet';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { TopBlurFade } from '@/components/navigation/TopBlurFade';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { screenLayoutStyles as sl } from '@/components/navigation/screenLayout';
import { transcriptionModeTitle } from '@/utils/transcriptionMode';
import { processingModeTitle } from '@/utils/processingMode';
import { Colors, Spacing } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { scrollPaddingTop, topInset } = useTopChromeLayout();
  const { summarizationMode, transcriptionMode } = useSettingsStore();
  const folderLayout = useFolderListLayoutStore((s) => s.layout);
  const [layoutSheetVisible, setLayoutSheetVisible] = useState(false);

  return (
    <View style={sl.container}>
      <ScrollView
        contentContainerStyle={[sl.scrollContent, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[sl.sectionLabel, styles.firstSectionLabel]}>Transcription</Text>
        <View style={sl.card}>
          <TouchableOpacity
            style={sl.settingsRow}
            onPress={() => router.push('/transcription-mode')}
          >
            <Ionicons
              name="mic-outline"
              size={20}
              color={Colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Transcription mode</Text>
            <Text style={sl.settingsRowValue}>
              {transcriptionModeTitle(transcriptionMode)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
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
              color={Colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Summarization mode</Text>
            <Text style={sl.settingsRowValue}>
              {processingModeTitle(summarizationMode)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={sl.sectionLabel}>Storage</Text>
        <View style={sl.card}>
          <TouchableOpacity style={sl.settingsRow}>
            <Ionicons
              name="phone-portrait-outline"
              size={20}
              color={Colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Manage local storage</Text>
            <Text style={sl.settingsRowValue}>1.2 GB</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={sl.cardDivider} />

          <TouchableOpacity style={sl.settingsRow}>
            <Ionicons
              name="cloud-upload-outline"
              size={20}
              color={Colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Export all transcripts</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={sl.cardDivider} />

          <TouchableOpacity style={sl.settingsRow}>
            <Ionicons
              name="cloud-download-outline"
              size={20}
              color={Colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Import transcripts</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={sl.cardDivider} />

          <TouchableOpacity
            style={sl.settingsRow}
            onPress={() =>
              Alert.alert('Clear Cache', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive' },
              ])
            }
          >
            <Ionicons name="trash-outline" size={20} color={Colors.red} style={sl.settingsRowIcon} />
            <Text style={[sl.settingsRowTitle, sl.settingsRowTitleDanger]}>Clear cache</Text>
          </TouchableOpacity>
        </View>

        <Text style={sl.sectionLabel}>Library</Text>
        <View style={sl.card}>
          <TouchableOpacity
            style={sl.settingsRow}
            onPress={() => setLayoutSheetVisible(true)}
          >
            <Ionicons
              name="grid-outline"
              size={20}
              color={Colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Folder layout</Text>
            <Text style={sl.settingsRowValue}>{folderListLayoutTitle(folderLayout)}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={sl.sectionLabel}>Preferences</Text>
        <View style={sl.card}>
          <TouchableOpacity style={sl.settingsRow}>
            <Text style={sl.settingsRowTitle}>Language</Text>
            <Text style={sl.settingsRowValue}>English (US)</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={sl.cardDivider} />

          <TouchableOpacity style={sl.settingsRow}>
            <Text style={sl.settingsRowTitle}>Theme</Text>
            <Text style={sl.settingsRowValue}>Dark</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>
          {Constants.expoConfig?.name ?? 'Briefly'}{' '}
          {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>

      <TopBlurFade />
      <View style={[sl.headerOverlay, { paddingTop: topInset }]} pointerEvents="box-none">
        <StackScreenHeader
          title="Settings"
          showBack
          onBack={() => router.back()}
        />
      </View>

      <FolderListViewOptionsSheet
        visible={layoutSheetVisible}
        onClose={() => setLayoutSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  firstSectionLabel: {
    marginTop: 0,
  },
  versionText: {
    ...sl.versionText,
    marginTop: Spacing.xl,
  },
});
