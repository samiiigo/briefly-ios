import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSettingsStore } from '../store/useSettingsStore';
import { RootStackParamList } from '../types';
import { transcriptionModeTitle } from '../utils/transcriptionMode';
import { processingModeTitle } from '../utils/processingMode';
import { Colors, Spacing } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const {
    defaultProcessingMode,
    defaultTranscriptionMode,
  } = useSettingsStore();

  // #region agent log
  fetch('http://127.0.0.1:7276/ingest/3b8a80c6-5c97-439c-93c0-97e4ed6ba274',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a409d8'},body:JSON.stringify({sessionId:'a409d8',location:'SettingsScreen.tsx:afterStore',message:'SettingsScreen after useSettingsStore',data:{defaultTranscriptionMode},hypothesisId:'H1',timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, styles.contentGrow]}>
        {/* Transcription mode */}
        <Text style={styles.sectionLabel}>TRANSCRIPTION</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('TranscriptionModePicker')}
          >
            <Ionicons
              name="mic-outline"
              size={20}
              color={Colors.textPrimary}
              style={styles.rowIcon}
            />
            <Text style={styles.rowTitle}>Transcription mode</Text>
            <Text style={styles.rowValue}>
              {transcriptionModeTitle(defaultTranscriptionMode)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Summarization mode */}
        <Text style={styles.sectionLabel}>SUMMARIZATION</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('ProcessingModePicker')}
          >
            <Ionicons
              name="sparkles-outline"
              size={20}
              color={Colors.textPrimary}
              style={styles.rowIcon}
            />
            <Text style={styles.rowTitle}>Summarization mode</Text>
            <Text style={styles.rowValue}>
              {processingModeTitle(defaultProcessingMode)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Storage Management */}
        <Text style={styles.sectionLabel}>STORAGE MANAGEMENT</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row}>
            <Ionicons name="phone-portrait-outline" size={20} color={Colors.textPrimary} style={styles.rowIcon} />
            <Text style={styles.rowTitle}>Manage Local Storage</Text>
            <Text style={styles.rowValue}>1.2 GB</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row}>
            <Ionicons name="cloud-upload-outline" size={20} color={Colors.textPrimary} style={styles.rowIcon} />
            <Text style={styles.rowTitle}>Export All Transcripts</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row}>
            <Ionicons name="cloud-download-outline" size={20} color={Colors.textPrimary} style={styles.rowIcon} />
            <Text style={styles.rowTitle}>Import Transcripts</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              Alert.alert('Clear Cache', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive' },
              ])
            }
          >
            <Ionicons name="trash-outline" size={20} color={Colors.red} style={styles.rowIcon} />
            <Text style={[styles.rowTitle, styles.rowTitleRed]}>Clear Cache</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowTitle}>Language</Text>
            <Text style={styles.rowValue}>English (US)</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowTitle}>Theme</Text>
            <Text style={styles.rowValue}>Dark Glass</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.versionSpacer} />
        <Text style={styles.versionText}>
          {Constants.expoConfig?.name ?? 'Briefly'}{' '}
          {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  contentGrow: {
    flexGrow: 1,
  },
  versionSpacer: {
    flex: 1,
    minHeight: 40,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    paddingVertical: 16,
    paddingBottom: 88,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 6,
    marginLeft: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 16,
  },
  // Storage / Preference rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 24,
    textAlign: 'center',
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  rowTitleRed: {
    color: Colors.red,
  },
  rowValue: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
    marginRight: 4,
  },
});
