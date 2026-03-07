import React, { useState } from 'react';
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
import { ProcessingMode, RootStackParamList } from '../types';
import { formatDuration, formatFileSize, generateId, generateTitle } from '../utils';
import { Colors, Spacing, BorderRadius } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SaveRecording'>;

export function SaveRecordingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { duration, filePath, fileSize, preTranscript } = route.params;

  const { addRecording } = useRecordingStore();
  const { defaultProcessingMode } = useSettingsStore();

  const [title, setTitle] = useState(generateTitle());
  const [processingMode, setProcessingMode] = useState<ProcessingMode>(defaultProcessingMode);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    const id = generateId();
    const recording = {
      id,
      title: title.trim() || generateTitle(),
      createdAt: Date.now(),
      duration,
      filePath,
      fileSize,
      processingMode,
      status: 'transcribing' as const,
      transcript: preTranscript, // pre-built from live chunks (cloud mode)
    };

    await addRecording(recording);
    navigation.replace('Summarizing', { recordingId: id });
  };

  const handleDiscard = () => {
    Alert.alert('Discard Recording', 'This recording will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => navigation.navigate('Main'),
      },
    ]);
  };

  const toggleMode = () => {
    setProcessingMode((m) => (m === 'on-device' ? 'cloud' : 'on-device'));
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
            <View>
              <Text style={styles.detailLabel}>Processing Mode</Text>
              <Text style={styles.processingSubtitle}>
                {processingMode === 'on-device'
                  ? 'Privacy-first local processing'
                  : 'Cloud-powered analysis'}
              </Text>
            </View>
            <TouchableOpacity onPress={toggleMode}>
              <ProcessingBadge mode={processingMode} />
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
