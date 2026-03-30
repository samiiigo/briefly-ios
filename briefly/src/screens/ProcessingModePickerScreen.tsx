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
import { RootStackParamList, ProcessingMode, CloudProvider } from '../types';
import {
  processingModeDescription,
  processingModeTitle,
} from '../utils/processingMode';
import { Colors, Spacing } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PROCESSING_MODES: ProcessingMode[] = [
  'cloud-shared-openrouter',
  'cloud-user-key',
  'on-device',
];

function getProviderTitle(provider: CloudProvider): string {
  if (provider === 'openrouter') return 'OpenRouter';
  if (provider === 'openai') return 'OpenAI';
  if (provider === 'gemini') return 'Google Gemini';
  return provider;
}

function getApiKeyPlaceholder(provider: CloudProvider): string {
  if (provider === 'openrouter') return 'sk-or-...';
  if (provider === 'openai') return 'sk-proj-...';
  if (provider === 'gemini') return 'AIza...';
  return 'Paste your API key';
}

function isValidApiKeyFormat(key: string, provider: CloudProvider): boolean {
  const trimmed = key.trim();
  if (provider === 'openrouter') return trimmed.startsWith('sk-or-');
  if (provider === 'openai') return trimmed.startsWith('sk-') || trimmed.startsWith('sk-proj-');
  if (provider === 'gemini') return trimmed.startsWith('AIza') || trimmed.length > 20;
  return trimmed.length > 10;
}

function detectCloudProviderFromKey(key: string): CloudProvider | null {
  const trimmed = key.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('sk-or-')) return 'openrouter';
  if (trimmed.startsWith('sk-') || trimmed.startsWith('sk-proj-')) return 'openai';
  if (trimmed.startsWith('AIza') || trimmed.startsWith('AI')) return 'gemini';
  return null;
}

export function ProcessingModePickerScreen() {
  const navigation = useNavigation<Nav>();
  const {
    defaultProcessingMode,
    setDefaultProcessingMode,
    cloudProvider,
    setCloudProvider,
    openrouterApiKey,
    setOpenrouterApiKey,
    openaiApiKey,
    setOpenaiApiKey,
    geminiApiKey,
    setGeminiApiKey,
  } = useSettingsStore();

  const isCloudUserKey =
    defaultProcessingMode === 'cloud-user-key' || defaultProcessingMode === 'cloud';

  const getProviderApiKey = (provider: CloudProvider): string => {
    if (provider === 'openrouter') return openrouterApiKey;
    if (provider === 'openai') return openaiApiKey;
    if (provider === 'gemini') return geminiApiKey;
    return '';
  };

  // Get the current API key based on selected provider
  const getCurrentApiKey = (): string => getProviderApiKey(cloudProvider);

  const setCurrentApiKey = (value: string) => {
    if (cloudProvider === 'openrouter') {
      setOpenrouterApiKey(value);
    } else if (cloudProvider === 'openai') {
      setOpenaiApiKey(value);
    } else if (cloudProvider === 'gemini') {
      setGeminiApiKey(value);
    }
  };

  const [apiKeyInput, setApiKeyInput] = useState(getCurrentApiKey());
  const isValidFormat = isValidApiKeyFormat(apiKeyInput, cloudProvider);

  const saveApiKeyForProvider = (provider: CloudProvider, value: string) => {
    if (provider === 'openrouter') {
      setOpenrouterApiKey(value);
    } else if (provider === 'openai') {
      setOpenaiApiKey(value);
    } else if (provider === 'gemini') {
      setGeminiApiKey(value);
    }
  };

  const handleApiKeyChange = (value: string) => {
    setApiKeyInput(value);
    const detected = detectCloudProviderFromKey(value);
    const providerToSave = detected ?? cloudProvider;
    if (detected && detected !== cloudProvider) {
      setCloudProvider(detected);
    }
    saveApiKeyForProvider(providerToSave, value);
  };

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

        {/* API key input — shown for Cloud (use your own key) */}
        {isCloudUserKey && (
          <React.Fragment>
            {/* API Key Input */}
            <Text style={styles.sectionLabel}>API KEY</Text>
            <Text style={styles.sectionDescription}>
              Paste one key and Briefly will auto-detect the provider type
              (for example: sk-or-..., sk-proj-..., or AIza...). The key is
              stored locally on your device.
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
                  onChangeText={handleApiKeyChange}
                  onBlur={() => setCurrentApiKey(apiKeyInput)}
                  placeholder={getApiKeyPlaceholder(cloudProvider)}
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {apiKeyInput.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setApiKeyInput('');
                      setCurrentApiKey('');
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
              {apiKeyInput.trim().length > 0 && isValidFormat && (
                <View style={styles.detectedRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.detectedText}>
                    Detected: {getProviderTitle(cloudProvider)}
                  </Text>
                </View>
              )}
              {apiKeyInput.trim().length > 0 && !isValidFormat && (
                <View style={styles.detectedRow}>
                  <Ionicons
                    name="help-circle"
                    size={14}
                    color={Colors.orange}
                  />
                  <Text
                    style={[styles.detectedText, { color: Colors.orange }]}
                  >
                    Key format not recognized yet. Expected patterns include sk-or-..., sk-proj-..., or AIza...
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
