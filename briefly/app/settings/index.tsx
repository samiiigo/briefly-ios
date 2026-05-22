import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStackBack } from '@/components/navigation/layout/useStackBack';
import { StackScreenHeader } from '@/components/navigation/header/StackScreenHeader';
import { useTopChromeLayout } from '@/components/navigation/layout/useTopChromeLayout';
import { useScreenLayoutStyles } from '@/components/navigation/layout/screenLayout';
import { useThemedColors, Spacing } from '@/theme';
import { useSettingsHub } from '@/hooks/settings/useSettingsHub';

export default function SettingsScreen() {
  const goBack = useStackBack('/(tabs)');
  const { scrollPaddingTop } = useTopChromeLayout();
  const colors = useThemedColors();
  const sl = useScreenLayoutStyles();
  const {
    showLivePreview,
    setShowLivePreview,
    labels,
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
        <Text style={[sl.sectionLabel, styles.firstSectionLabel]}>Transcription</Text>
        <View style={sl.card}>
          <TouchableOpacity style={sl.settingsRow} onPress={routes.transcriptionMode}>
            <Ionicons
              name="mic-outline"
              size={20}
              color={colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Transcription mode</Text>
            <Text style={sl.settingsRowValue}>{labels.transcriptionMode}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={sl.cardDivider} />
          <View style={sl.settingsRow}>
            <Ionicons
              name="eye-outline"
              size={20}
              color={colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Show live preview</Text>
            <Switch
              value={showLivePreview}
              onValueChange={setShowLivePreview}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>
        <Text style={sl.sectionLabel}>Summarization</Text>
        <View style={sl.card}>
          <TouchableOpacity style={sl.settingsRow} onPress={routes.processingMode}>
            <Ionicons
              name="sparkles-outline"
              size={20}
              color={colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Summarization mode</Text>
            <Text style={sl.settingsRowValue}>{labels.summarizationMode}</Text>
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
          <TouchableOpacity style={sl.settingsRow} onPress={routes.folderLayout}>
            <Ionicons
              name="grid-outline"
              size={20}
              color={colors.textPrimary}
              style={sl.settingsRowIcon}
            />
            <Text style={sl.settingsRowTitle}>Folder layout</Text>
            <Text style={sl.settingsRowValue}>{labels.folderLayout}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={sl.sectionLabel}>Preferences</Text>
        <View style={sl.card}>
          <TouchableOpacity style={sl.settingsRow} onPress={routes.appearance}>
            <Text style={sl.settingsRowTitle}>Theme</Text>
            <Text style={sl.settingsRowValue}>{labels.theme}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={[sl.versionText, styles.versionText]}>{appVersionLabel}</Text>
      </ScrollView>
      <StackScreenHeader title="Settings" showBack onBack={goBack} />
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
