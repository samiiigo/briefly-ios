import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { TopBlurFade } from '@/components/navigation/TopBlurFade';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { screenLayoutStyles as sl } from '@/components/navigation/screenLayout';
import { RecordingFolder } from '@/types';
import {
  formatDuration,
  formatFileSize,
  generateId,
  generateTitle,
  ensureUniqueTitle,
} from '@/utils';
import {
  normalizeTranscriptionMode,
  resolvePostRecordingPipeline,
} from '@/utils/transcriptionMode';
import { folderFlagsFor } from '@/utils/folders/recordingFolder';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';
import { consumeTransitData } from '@/utils/navigationTransit';
import {
  isRecordingFileMissing,
  isRecordingTooShort,
  minRecordingDurationHint,
} from '@/utils/recordingValidation';

export default function SaveRecordingScreen() {
  const { scrollPaddingTop, topInset } = useTopChromeLayout();
  const router = useRouter();
  const p = useLocalSearchParams<{
    duration?: string;
    filePath?: string;
    fileSize?: string;
    targetFolder?: string;
    targetUserFolderId?: string;
    markImported?: string;
    autoProcessOnOpen?: string;
  }>();
  const duration = Number(p.duration) || 0;
  const filePath = p.filePath ?? '';
  const fileSize = Number(p.fileSize) || 0;
  const targetFolder: RecordingFolder = (p.targetFolder as RecordingFolder) ?? 'unlisted';
  const targetUserFolderId = p.targetUserFolderId;
  const markImported = p.markImported === 'true';
  const autoProcessOnOpen = p.autoProcessOnOpen === 'true';
  const transitData = useRef(consumeTransitData());
  const preTranscript = transitData.current.preTranscript;

  const { addRecording, recordings } = useRecordingStore();
  const existingTitles = recordings.map((r) => r.title);
  const [title, setTitle] = useState(() => ensureUniqueTitle(generateTitle(), existingTitles));
  const [saving, setSaving] = useState(false);
  const autoSaveTriggeredRef = useRef(false);
  const skipTranscriptionOnSave = resolvePostRecordingPipeline(
    useSettingsStore.getState().transcriptionMode,
    preTranscript,
  ).skipAsyncTranscription;

  const assetCheck = { durationSec: duration, filePath, fileSizeBytes: fileSize };
  const recordingInvalid =
    isRecordingFileMissing(assetCheck) || isRecordingTooShort(assetCheck);

  const handleSave = useCallback(async () => {
    if (saving) return;

    if (isRecordingFileMissing(assetCheck)) {
      Alert.alert(
        'Recording unavailable',
        'No audio file was saved. Go back and record again.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }],
      );
      return;
    }
    if (isRecordingTooShort(assetCheck)) {
      Alert.alert('Recording too short', minRecordingDurationHint('save'), [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
      return;
    }

    setSaving(true);
    try {
    const { summarizationMode, transcriptionMode } = useSettingsStore.getState();
    const id = generateId();
    const baseTitle = title.trim() || generateTitle();
    const safeTitle = ensureUniqueTitle(baseTitle, existingTitles);
    const recording = {
      id,
      title: safeTitle,
      createdAt: Date.now(),
      duration,
      filePath,
      fileSize,
      transcriptionMode: normalizeTranscriptionMode(transcriptionMode),
      processingMode: summarizationMode,
      folder: targetFolder,
      ...folderFlagsFor(targetFolder),
      ...(markImported ? { isImported: true } : {}),
      userFolderId: targetUserFolderId,
      status: 'saved' as const,
      transcript: preTranscript,
    };
    await addRecording(recording);
    router.replace({ pathname: '/recording/summarizing', params: { recordingId: id } });
    } catch {
      Alert.alert('Could not save', 'Something went wrong while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    duration,
    fileSize,
    targetFolder,
    targetUserFolderId,
    markImported,
    preTranscript,
    title,
    existingTitles,
    filePath,
    addRecording,
    router,
  ]);

  useEffect(() => {
    if (!autoProcessOnOpen || autoSaveTriggeredRef.current) return;
    autoSaveTriggeredRef.current = true;
    void handleSave();
  }, [autoProcessOnOpen, handleSave]);

  const handleDiscard = () => {
    Alert.alert('Discard Recording', 'This recording will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  return (
    <View style={sl.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[sl.sectionLabel, styles.firstSectionLabel]}>Recording title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter a title..."
          placeholderTextColor={Colors.textTertiary}
          selectionColor={Colors.primary}
        />

        <Text style={sl.sectionLabel}>Details</Text>
        <View style={sl.card}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{formatDuration(duration)}</Text>
          </View>
          <View style={sl.cardDivider} />
          <View style={styles.detailRow}>
            <Ionicons name="folder-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>File size</Text>
            <Text style={styles.detailValue}>{formatFileSize(fileSize)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving || recordingInvalid}
        >
          <Ionicons name="sparkles" size={18} color={Colors.textPrimary} />
          <Text style={styles.saveButtonText}>
            {saving
              ? 'Saving...'
              : recordingInvalid
                ? 'Recording too short'
                : skipTranscriptionOnSave
                  ? 'Save & Summarize'
                  : 'Save & Transcribe'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDiscard}>
          <Text style={styles.discardText}>Discard Recording</Text>
        </TouchableOpacity>
      </View>

      <TopBlurFade />
      <View style={[sl.headerOverlay, { paddingTop: topInset }]} pointerEvents="box-none">
        <StackScreenHeader
          title="Save"
          showBack
          leadingIcon="close"
          onBack={() => router.back()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  firstSectionLabel: {
    marginTop: 0,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  input: withAppFont({
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  }),
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  detailLabel: withAppFont({
    fontSize: 17,
    color: Colors.textPrimary,
    flex: 1,
  }),
  detailValue: withAppFont({
    fontSize: 15,
    fontWeight: '600',
    color: Colors.subtext,
  }),
  actions: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
    paddingVertical: 16,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  saveButtonText: withAppFont({
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  }),
  discardText: withAppFont({
    fontSize: 17,
    fontWeight: '600',
    color: Colors.recordButton,
    textAlign: 'center',
  }),
});
