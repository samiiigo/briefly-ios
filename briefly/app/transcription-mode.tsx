import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../store/useSettingsStore';
import { TranscriptionMode } from '../types';
import { normalizeTranscriptionMode, transcriptionModeDescription, transcriptionModeTitle } from '../lib/transcriptionMode';
import { Colors, Spacing } from '../lib/theme';

const TRANSCRIPTION_MODES: TranscriptionMode[] = ['live-assemblyai', 'post-assemblyai', 'local-on-device'];

export default function TranscriptionModePickerScreen() {
  const router = useRouter();
  const { defaultTranscriptionMode, setDefaultTranscriptionMode } = useSettingsStore();
  const selectedMode = normalizeTranscriptionMode(defaultTranscriptionMode);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transcription Mode</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionDescription}>Choose how each recording is transcribed by default.</Text>
        <View style={styles.card}>
          {TRANSCRIPTION_MODES.map((mode, index) => {
            const selected = selectedMode === mode;
            return (
              <React.Fragment key={mode}>
                <TouchableOpacity style={styles.optionRow} onPress={() => setDefaultTranscriptionMode(mode)}>
                  <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioDot} />}</View>
                  <View style={styles.optionText}><Text style={styles.optionTitle}>{transcriptionModeTitle(mode)}</Text><Text style={styles.optionSubtitle}>{transcriptionModeDescription(mode)}</Text></View>
                </TouchableOpacity>
                {index !== TRANSCRIPTION_MODES.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenHorizontal, paddingVertical: Spacing.sm, paddingBottom: Spacing.xs },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: '#FFFFFF', marginLeft: 4 },
  content: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: 100 },
  sectionDescription: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 20, marginBottom: 16 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 12, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.1)', marginLeft: Spacing.md + 22 + 12 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, gap: 12, minHeight: 72 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioSelected: { borderColor: '#0A84FF', backgroundColor: '#0A84FF' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', lineHeight: 22 },
  optionSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 18, marginTop: 4 },
});
