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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRecordingStore } from '../store/useRecordingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ProcessingBadge } from '../components/ProcessingBadge';
import {
  RecordingFolder,
  RootStackParamList,
  TranscriptionMode,
} from '../types';
import { formatDuration, formatFileSize, generateId, generateTitle, ensureUniqueTitle } from '../utils';
import {
  normalizeTranscriptionMode,
  transcriptionModeDescription,
  transcriptionModeTitle,
} from '../utils/transcriptionMode';
import { processingModeTitle } from '../utils/processingMode';
import { folderFlagsFor } from '../utils/recordingFolder';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { logger } from '../utils/logger';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SaveRecording'>;

export function SaveRecordingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { duration, filePath, fileSize, preTranscript } = route.params;
  const targetFolder: RecordingFolder = route.params.targetFolder ?? 'unlisted';
  const targetUserFolderId = route.params.targetUserFolderId;

  const { addRecording, recordings } = useRecordingStore();
  const { defaultProcessingMode, defaultTranscriptionMode } = useSettingsStore();

  const existingTitles = recordings.map((r) => r.title);
  const [title, setTitle] = useState(() => ensureUniqueTitle(generateTitle(), existingTitles));
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>(
    normalizeTranscriptionMode(route.params.transcriptionMode ?? defaultTranscriptionMode)
  );
  const [saving, setSaving] = useState(false);
  const autoSaveTriggeredRef = useRef(false);
  const autoProcessOnOpen = route.params.autoProcessOnOpen ?? false;

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    logger.info('FLOW', 'Save recording requested', {
      durationSec: duration,
      fileSize,
      processingMode: defaultProcessingMode,
      transcriptionMode,
      targetFolder,
      hasUserFolder: !!targetUserFolderId,
      hasPreTranscript: !!preTranscript?.length,
    });

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
      transcriptionMode,
      processingMode: defaultProcessingMode,
      folder: targetFolder,
      ...folderFlagsFor(targetFolder),
      userFolderId: targetUserFolderId,
      status: 'saved' as const,
      transcript: preTranscript, // pre-built from live/local chunks captured during recording
    };

    await addRecording(recording);
    logger.info('FLOW', 'Recording metadata saved', {
      recordingId: id,
      title: safeTitle,
    });
    navigation.replace('Summarizing', { recordingId: id });
  }, [
    saving,
    duration,
    fileSize,
    defaultProcessingMode,
    transcriptionMode,
    targetFolder,
    targetUserFolderId,
    preTranscript,
    title,
    existingTitles,
    filePath,
    addRecording,
    navigation,
  ]);

  useEffect(() => {
    if (!autoProcessOnOpen || autoSaveTriggeredRef.current) return;
    autoSaveTriggeredRef.current = true;
    logger.info('FLOW', 'Auto-processing recording on SaveRecording open');
    void handleSave();
  }, [autoProcessOnOpen, handleSave]);

  const handleDiscard = () => {
    Alert.alert('Discard Recording', 'This recording will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          logger.warn('FLOW', 'Save recording discarded by user');
          navigation.navigate('Main');
        },
      },
    ]);
  };

  const chooseTranscriptionMode = () => {
    Alert.alert(
      'Transcription mode for this recording',
      transcriptionModeDescription(transcriptionMode),
      [
        { text: 'Live (AssemblyAI)', onPress: () => setTranscriptionMode('live-assemblyai') },
        { text: 'Post-recording (AssemblyAI)', onPress: () => setTranscriptionMode('post-assemblyai') },
        { text: 'Local (on-device)', onPress: () => setTranscriptionMode('local-on-device') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Save Recording</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Title */}
        <Text style={styles.label}>Recording Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter a title..."
          placeholderTextColor={Colors.textTertiary}
          selectionColor={Colors.primary}
        />

        {/* Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsHeading}>RECORDING DETAILS</Text>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{formatDuration(duration)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="folder-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>File Size</Text>
            <Text style={styles.detailValue}>{formatFileSize(fileSize)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.processingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Folder</Text>
              <Text style={styles.processingSubtitle}>
                {targetUserFolderId
                  ? 'User folder'
                  : targetFolder === 'archived'
                    ? 'Archived'
                    : 'Unlisted'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.processingRow} onPress={chooseTranscriptionMode}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Transcription Mode</Text>
              <Text style={styles.processingSubtitle}>
                {transcriptionModeTitle(transcriptionMode)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.processingRow}>
            <View>
              <Text style={styles.detailLabel}>Summarization Mode</Text>
              <Text style={styles.processingSubtitle}>
                {processingModeTitle(defaultProcessingMode)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ProcessingModePicker')}>
              <ProcessingBadge mode={defaultProcessingMode} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          <Ionicons name="sparkles" size={18} color={Colors.textPrimary} />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save & Transcribe'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDiscard}>
          <Text style={styles.discardText}>Discard Recording</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  content: {
    padding: Spacing.md,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  detailsHeading: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  detailLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  processingSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  actions: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
    gap: Spacing.sm,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  discardText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.recordButton,
    textAlign: 'center',
  },
});
