import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/useSettingsStore';
import { Colors, Spacing, BorderRadius } from '../utils/theme';

export function SettingsScreen() {
  const {
    defaultProcessingMode,
    setDefaultProcessingMode,
    cloudApiKey,
    setCloudApiKey,
    cloudApiProvider,
    setCloudApiProvider,
    setCloudApiEndpoint,
  } = useSettingsStore();

  const [apiKeyInput, setApiKeyInput] = useState(cloudApiKey);
  const isCloud = defaultProcessingMode === 'cloud';

  const handleProviderChange = (provider: 'openai' | 'gemini') => {
    setCloudApiProvider(provider);
    setCloudApiKey('');
    setApiKeyInput('');
    setCloudApiEndpoint(
      provider === 'gemini'
        ? 'https://generativelanguage.googleapis.com/v1beta'
        : 'https://api.openai.com/v1'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* AI Processing Engine */}
        <Text style={styles.sectionLabel}>AI PROCESSING ENGINE</Text>
        <Text style={styles.sectionDescription}>
          Briefly uses both local and cloud processing to offer the best transcription and meeting assistance while respecting your privacy.
        </Text>

        <View style={styles.card}>
          {/* On-Device Mode */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setDefaultProcessingMode('on-device')}
          >
            <View style={[styles.radio, !isCloud && styles.radioSelected]}>
              {!isCloud && <View style={styles.radioDot} />}
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>On-Device Mode</Text>
              <Text style={styles.optionSubtitle}>
                All processing happens locally on your phone. Maximum privacy, but may consume more battery.
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Cloud Mode */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setDefaultProcessingMode('cloud')}
          >
            <View style={[styles.radio, isCloud && styles.radioSelected]}>
              {isCloud && <View style={styles.radioDot} />}
            </View>
            <View style={styles.optionText}>
              <View style={styles.optionTitleRow}>
                <Text style={styles.optionTitle}>Cloud Mode</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>RECOMMENDED</Text>
                </View>
              </View>
              <Text style={styles.optionSubtitle}>
                Uses advanced cloud AI for better accuracy and speed. Zero Data Retention (ZDR) policy strictly applies.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Cloud Provider + API Key */}
        {isCloud && (
          <>
            <Text style={styles.sectionLabel}>AI PROVIDER</Text>
            <View style={styles.card}>
              {/* OpenAI */}
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => handleProviderChange('openai')}
              >
                <View style={[styles.radio, cloudApiProvider === 'openai' && styles.radioSelected]}>
                  {cloudApiProvider === 'openai' && <View style={styles.radioDot} />}
                </View>
                <View style={styles.optionText}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.optionTitle}>OpenAI</Text>
                    <View style={styles.badge}><Text style={styles.badgeText}>WHISPER + GPT-4o</Text></View>
                  </View>
                  <Text style={styles.optionSubtitle}>
                    Whisper for transcription · GPT-4o-mini for summaries. Requires an OpenAI API key (sk-...).
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Gemini */}
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => handleProviderChange('gemini')}
              >
                <View style={[styles.radio, cloudApiProvider === 'gemini' && styles.radioSelected]}>
                  {cloudApiProvider === 'gemini' && <View style={styles.radioDot} />}
                </View>
                <View style={styles.optionText}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.optionTitle}>Google Gemini</Text>
                    <View style={[styles.badge, styles.badgeGemini]}><Text style={styles.badgeText}>GEMINI 2.0 FLASH</Text></View>
                  </View>
                  <Text style={styles.optionSubtitle}>
                    Gemini 2.0 Flash for both transcription and summaries. Requires a Google AI Studio key (AIza...).
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>API KEY</Text>
            <Text style={styles.sectionDescription}>
              Stored locally on your device and never shared.
            </Text>
            <View style={styles.card}>
              <View style={styles.apiKeyRow}>
                <Ionicons name="key-outline" size={18} color={Colors.textSecondary} style={styles.rowIcon} />
                <TextInput
                  style={styles.apiKeyInput}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  onBlur={() => setCloudApiKey(apiKeyInput)}
                  placeholder={cloudApiProvider === 'gemini' ? 'AIza...' : 'sk-...'}
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {apiKeyInput.length > 0 && (
                  <TouchableOpacity onPress={() => { setApiKeyInput(''); setCloudApiKey(''); }}>
                    <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}

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
    paddingBottom: 100,
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
  // Processing options
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioSelected: {
    borderColor: '#0A84FF',
    backgroundColor: '#0A84FF',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#0A84FF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
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
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  apiKeyInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 4,
  },
});
