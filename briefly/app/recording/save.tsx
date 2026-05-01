import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecordingStore } from '../../store/useRecordingStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { ProcessingBadge } from '../../components/ProcessingBadge';
import { RecordingFolder, TranscriptionMode } from '../../types';
import { formatDuration, formatFileSize, generateId, generateTitle, ensureUniqueTitle } from '../../utils';
import { normalizeTranscriptionMode, transcriptionModeDescription, transcriptionModeTitle } from '../../utils/transcriptionMode';
import { processingModeTitle } from '../../utils/processingMode';
import { folderFlagsFor } from '../../utils/recordingFolder';
import { Colors, Spacing, BorderRadius } from '../../utils/theme';
import { logger } from '../../utils/logger';
import { consumeTransitData } from '../../utils/navigationTransit';

export default function SaveRecordingScreen() {
  const router = useRouter();
  const p = useLocalSearchParams<{ duration?: string; filePath?: string; fileSize?: string; transcriptionMode?: string; targetFolder?: string; targetUserFolderId?: string; markImported?: string; autoProcessOnOpen?: string }>();
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
  const { defaultProcessingMode, defaultTranscriptionMode } = useSettingsStore();
  const existingTitles = recordings.map((r) => r.title);
  const [title, setTitle] = useState(() => ensureUniqueTitle(generateTitle(), existingTitles));
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>(normalizeTranscriptionMode((p.transcriptionMode as TranscriptionMode) ?? defaultTranscriptionMode));
  const [saving, setSaving] = useState(false);
  const autoSaveTriggeredRef = useRef(false);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    const id = generateId();
    const baseTitle = title.trim() || generateTitle();
    const safeTitle = ensureUniqueTitle(baseTitle, existingTitles);
    const recording = { id, title: safeTitle, createdAt: Date.now(), duration, filePath, fileSize, transcriptionMode, processingMode: defaultProcessingMode, folder: targetFolder, ...folderFlagsFor(targetFolder), ...(markImported ? { isImported: true } : {}), userFolderId: targetUserFolderId, status: 'saved' as const, transcript: preTranscript };
    await addRecording(recording);
    router.replace({ pathname: '/recording/summarizing', params: { recordingId: id } });
  }, [saving, duration, fileSize, defaultProcessingMode, transcriptionMode, targetFolder, targetUserFolderId, markImported, preTranscript, title, existingTitles, filePath, addRecording, router]);

  useEffect(() => {
    if (!autoProcessOnOpen || autoSaveTriggeredRef.current) return;
    autoSaveTriggeredRef.current = true;
    void handleSave();
  }, [autoProcessOnOpen, handleSave]);

  const handleDiscard = () => {
    Alert.alert('Discard Recording', 'This recording will be permanently deleted.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => router.replace('/(tabs)') }]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><View style={styles.headerSide}><TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}><Ionicons name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity></View><View style={styles.headerCenterSlot}><Text style={styles.headerTitle}>Save Recording</Text></View><View style={[styles.headerSide, styles.headerSideRight]} /></View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Recording Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter a title..." placeholderTextColor={Colors.textTertiary} selectionColor={Colors.primary} />
        <View style={styles.detailsCard}>
          <Text style={styles.detailsHeading}>RECORDING DETAILS</Text>
          <View style={styles.detailRow}><Ionicons name="time-outline" size={18} color={Colors.textSecondary} /><Text style={styles.detailLabel}>Duration</Text><Text style={styles.detailValue}>{formatDuration(duration)}</Text></View>
          <View style={styles.divider} />
          <View style={styles.detailRow}><Ionicons name="folder-outline" size={18} color={Colors.textSecondary} /><Text style={styles.detailLabel}>File Size</Text><Text style={styles.detailValue}>{formatFileSize(fileSize)}</Text></View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.processingRow} onPress={() => Alert.alert('Transcription mode', transcriptionModeDescription(transcriptionMode), [{ text: 'Live (AssemblyAI)', onPress: () => setTranscriptionMode('live-assemblyai') }, { text: 'Post (AssemblyAI)', onPress: () => setTranscriptionMode('post-assemblyai') }, { text: 'Local', onPress: () => setTranscriptionMode('local-on-device') }, { text: 'Cancel', style: 'cancel' }])}><View style={{ flex: 1 }}><Text style={styles.detailLabel}>Transcription Mode</Text><Text style={styles.processingSubtitle}>{transcriptionModeTitle(transcriptionMode)}</Text></View><Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} /></TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.processingRow}><View><Text style={styles.detailLabel}>Summarization Mode</Text><Text style={styles.processingSubtitle}>{processingModeTitle(defaultProcessingMode)}</Text></View><TouchableOpacity onPress={() => router.push('/processing-mode')}><ProcessingBadge mode={defaultProcessingMode} /></TouchableOpacity></View>
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}><Ionicons name="sparkles" size={18} color={Colors.textPrimary} /><Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save & Transcribe'}</Text></TouchableOpacity>
        <TouchableOpacity onPress={handleDiscard}><Text style={styles.discardText}>Discard Recording</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenHorizontal, paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  headerSide: { width: 40, justifyContent: 'center' }, headerSideRight: { alignItems: 'flex-end' },
  headerCenterSlot: { flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 0 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  content: { paddingHorizontal: Spacing.screenHorizontal, paddingTop: Spacing.md, paddingBottom: Spacing.md },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, marginTop: Spacing.md },
  input: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: 14, fontSize: 17, color: Colors.textPrimary, marginBottom: Spacing.lg },
  detailsCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  detailsHeading: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.5, padding: Spacing.md, paddingBottom: Spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, gap: Spacing.sm },
  detailLabel: { fontSize: 15, color: Colors.textPrimary, flex: 1 },
  detailValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  processingSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  processingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 14 },
  actions: { paddingHorizontal: Spacing.screenHorizontal, paddingTop: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.md },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingVertical: 16, gap: Spacing.sm },
  saveButtonText: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  discardText: { fontSize: 17, fontWeight: '600', color: Colors.recordButton, textAlign: 'center' },
});
