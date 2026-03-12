import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSettingsStore } from '../store/useSettingsStore';
import { RootStackParamList, ProcessingMode } from '../types';
import { detectProvider, providerLabel } from '../utils';
import {
  processingModeDescription,
  processingModeTitle,
} from '../utils/processingMode';
import { Colors, Spacing } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PROCESSING_MODES: ProcessingMode[] = ['on-device', 'cloud'];

export function ProcessingModePickerScreen() {
  const navigation = useNavigation<Nav>();
  const {
    defaultProcessingMode,
    setDefaultProcessingMode,
    cloudApiKey,
    setCloudApiKey,
  } = useSettingsStore();
  const [apiKeyInput, setApiKeyInput] = useState(cloudApiKey);
  const isCloud = defaultProcessingMode === 'cloud';
  const detectedProvider = detectProvider(apiKeyInput);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Summarization Mode</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionDescription}>
          Choose how Briefly generates your final summary after transcription.
        </Text>
        <View style={styles.card}>
          {PROCESSING_MODES.map((mode, index) => {
            const selected = defaultProcessingMode === mode;
            return (
              <React.Fragment key={mode}>
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => setDefaultProcessingMode(mode)}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>
                      {processingModeTitle(mode)}
                    </Text>
                    <Text style={styles.optionSubtitle}>
                      {processingModeDescription(mode)}
                    </Text>
                  </View>
                </TouchableOpacity>
                {index !== PROCESSING_MODES.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* API Key — shown when Cloud AI is selected */}
        {isCloud && (
          <React.Fragment>
            <Text style={styles.sectionLabel}>API KEY</Text>
            <Text style={styles.sectionDescription}>
              Paste any supported key — OpenAI, Google Gemini, Anthropic Claude,
              OpenRouter, or a GitHub PAT. The provider is detected automatically.
              Stored locally on your device and never shared.
            </Text>
            <View style={styles.card}>
              <View style={styles.apiKeyRow}>
                <View style={styles.apiKeyIconSlot}>
                  <Ionicons
                    name="key-outline"
                    size={18}
                    color={Colors.textSecondary}
                  />
                </View>
                <TextInput
                  style={styles.apiKeyInput}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  onBlur={() => setCloudApiKey(apiKeyInput)}
                  placeholder="sk-… · AIza… · sk-ant-… · sk-or-… · github_pat_…"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {apiKeyInput.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setApiKeyInput('');
                      setCloudApiKey('');
                    }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color="rgba(255,255,255,0.3)"
                    />
                  </TouchableOpacity>
                )}
              </View>
              {detectedProvider && (
                <View style={styles.detectedRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.detectedText}>
                    {providerLabel(detectedProvider)} detected
                  </Text>
                </View>
              )}
              {apiKeyInput.trim().length > 0 && !detectedProvider && (
                <View style={styles.detectedRow}>
                  <Ionicons
                    name="help-circle"
                    size={14}
                    color={Colors.orange}
                  />
                  <Text
                    style={[styles.detectedText, { color: Colors.orange }]}
                  >
                    Provider not recognised
                  </Text>
                </View>
              )}
            </View>
          </React.Fragment>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
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
    marginBottom: 16,
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
    marginLeft: 50, // Align with text start (16 padding + 22 radio + 12 gap)
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    minHeight: 72,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  optionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
    marginTop: 4,
  },
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  apiKeyIconSlot: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  apiKeyInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 4,
  },
  detectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 50,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  detectedText: {
    fontSize: 13,
    color: Colors.primary,
  },
});
