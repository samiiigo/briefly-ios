import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/context/useSettingsStore';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import {
  modePickerStyles as mp,
  screenLayoutStyles as sl,
} from '@/components/navigation/screenLayout';
import { ProcessingMode } from '@/types';
import { processingModeDescription, processingModeTitle } from '@/utils/processing/processingMode';
import {
  getProviderTitle,
  getApiKeyPlaceholder,
  isValidApiKeyFormat,
  detectCloudProviderFromKey,
} from '@/utils/providers/cloudProvider';
import { Colors, withAppFont } from '@/theme';
import {
  cancelLocalGemmaModelDownload,
  ensureLocalGemmaModelDownloaded,
  refreshLocalLlmModelStateFromDisk,
} from '@/services/summarization';

const PROCESSING_MODES: ProcessingMode[] = [
  'cloud-shared-openrouter',
  'cloud-user-key',
  'on-device',
];

export default function ProcessingModePickerScreen() {
  const router = useRouter();
  const { scrollPaddingTop } = useTopChromeLayout();
  const {
    summarizationMode,
    setSummarizationMode,
    cloudProvider,
    setCloudProvider,
    setProviderApiKey,
    getActiveApiKey,
    localLlmModelReady,
    localLlmDownloadProgress,
    localLlmDownloadStatus,
    localLlmDownloadError,
    deleteLocalLlmModel,
  } = useSettingsStore();

  useEffect(() => {
    refreshLocalLlmModelStateFromDisk();
  }, []);

  const isDownloading = localLlmDownloadStatus === 'downloading';

  const handleDownloadLocalModel = useCallback(async () => {
    if (isDownloading) return;
    try {
      await ensureLocalGemmaModelDownloaded();
    } catch {
      // Error message is stored on the settings slice
    }
  }, [isDownloading]);

  const handleCancelDownload = useCallback(async () => {
    await cancelLocalGemmaModelDownload();
  }, []);

  const handleDeleteLocalModel = useCallback(() => {
    Alert.alert(
      'Delete on-device model?',
      'This removes the Gemma model from your device (~3.5 GB). You can download it again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteLocalLlmModel();
          },
        },
      ],
    );
  }, [deleteLocalLlmModel]);

  const isCloudUserKey =
    summarizationMode === 'cloud-user-key' || summarizationMode === 'cloud';
  const [apiKeyInput, setApiKeyInput] = useState(getActiveApiKey());
  const isValidFormat = isValidApiKeyFormat(apiKeyInput, cloudProvider);

  const handleApiKeyChange = (value: string) => {
    setApiKeyInput(value);
    const detected = detectCloudProviderFromKey(value);
    const p = detected ?? cloudProvider;
    if (detected && detected !== cloudProvider) setCloudProvider(detected);
    setProviderApiKey(p, value);
  };

  return (
    <View style={sl.container}>
      <ScrollView
        contentContainerStyle={[sl.scrollContent, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={sl.sectionDescription}>
          Choose how Briefly generates your final summary after transcription.
        </Text>
        <View style={sl.card}>
          {PROCESSING_MODES.map((mode, index) => {
            const selected = summarizationMode === mode;
            return (
              <React.Fragment key={mode}>
                <TouchableOpacity
                  style={mp.optionRow}
                  onPress={() => setSummarizationMode(mode)}
                >
                  <View style={[mp.radio, selected && mp.radioSelected]}>
                    {selected ? <View style={mp.radioDot} /> : null}
                  </View>
                  <View style={mp.optionText}>
                    <Text style={mp.optionTitle}>{processingModeTitle(mode)}</Text>
                    <Text style={mp.optionSubtitle}>
                      {processingModeDescription(mode)}
                    </Text>
                  </View>
                </TouchableOpacity>
                {index !== PROCESSING_MODES.length - 1 ? (
                  <View style={mp.optionDivider} />
                ) : null}
              </React.Fragment>
            );
          })}
        </View>

        {summarizationMode === 'on-device' ? (
          <>
            <Text style={sl.sectionLabel}>On-device model</Text>
            <Text style={sl.sectionDescription}>
              Gemma 4 E2B (Q4) is stored in your app documents (~3.5 GB). Download once while on Wi‑Fi.
            </Text>
            <View style={sl.card}>
              {localLlmModelReady && localLlmDownloadStatus === 'ready' ? (
                <>
                  <View style={styles.modelStatusRow}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                    <Text style={styles.modelStatusText}>Model ready for offline summarization</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteModelButton}
                    onPress={handleDeleteLocalModel}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.orange} />
                    <Text style={styles.deleteModelButtonText}>Delete model from device</Text>
                  </TouchableOpacity>
                </>
              ) : isDownloading ? (
                <>
                  <View style={styles.modelStatusRow}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.modelStatusText}>
                      Downloading…{' '}
                      {localLlmDownloadProgress != null
                        ? `${Math.round(localLlmDownloadProgress * 100)}%`
                        : '0%'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelDownloadButton}
                    onPress={() => {
                      void handleCancelDownload();
                    }}
                  >
                    <Text style={styles.cancelDownloadButtonText}>Cancel download</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.downloadModelButton}
                    onPress={() => {
                      void handleDownloadLocalModel();
                    }}
                    disabled={isDownloading}
                  >
                    <Ionicons name="cloud-download-outline" size={18} color={Colors.textPrimary} />
                    <Text style={styles.downloadModelButtonText}>
                      {localLlmDownloadStatus === 'error' ? 'Retry download' : 'Download Gemma model'}
                    </Text>
                  </TouchableOpacity>
                  {localLlmDownloadError ? (
                    <Text style={styles.modelErrorText}>{localLlmDownloadError}</Text>
                  ) : null}
                </>
              )}
            </View>
          </>
        ) : null}

        {isCloudUserKey ? (
          <>
            <Text style={sl.sectionLabel}>API key</Text>
            <Text style={sl.sectionDescription}>
              Paste one key and Briefly will auto-detect the provider.
            </Text>
            <View style={sl.card}>
              <View style={styles.apiKeyRow}>
                <View style={styles.apiKeyIconSlot}>
                  <Ionicons name="key-outline" size={18} color={Colors.textSecondary} />
                </View>
                <TextInput
                  style={styles.apiKeyInput}
                  value={apiKeyInput}
                  onChangeText={handleApiKeyChange}
                  onBlur={() => setProviderApiKey(cloudProvider, apiKeyInput)}
                  placeholder={getApiKeyPlaceholder(cloudProvider)}
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {apiKeyInput.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setApiKeyInput('');
                      setProviderApiKey(cloudProvider, '');
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>
              {apiKeyInput.trim().length > 0 && isValidFormat ? (
                <View style={styles.detectedRow}>
                  <View style={styles.apiKeyIconSlot}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                  </View>
                  <Text style={styles.detectedText}>
                    Detected: {getProviderTitle(cloudProvider)}
                  </Text>
                </View>
              ) : null}
              {apiKeyInput.trim().length > 0 && !isValidFormat ? (
                <View style={styles.detectedRow}>
                  <View style={styles.apiKeyIconSlot}>
                    <Ionicons name="help-circle" size={14} color={Colors.orange} />
                  </View>
                  <Text style={[styles.detectedText, styles.detectedTextWarning]}>
                    Key format not recognized.
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>

      <StackScreenHeader
        title="Summarization"
        showBack
        onBack={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  apiKeyInput: withAppFont({
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 4,
  }),
  detectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  detectedText: withAppFont({
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
  }),
  detectedTextWarning: {
    color: Colors.orange,
  },
  modelStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  modelStatusText: withAppFont({
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  }),
  downloadModelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  downloadModelButtonText: withAppFont({
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  }),
  modelErrorText: withAppFont({
    fontSize: 13,
    color: Colors.orange,
    paddingHorizontal: 16,
    paddingBottom: 12,
  }),
  cancelDownloadButton: {
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  cancelDownloadButtonText: withAppFont({
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  }),
  deleteModelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  deleteModelButtonText: withAppFont({
    fontSize: 15,
    fontWeight: '600',
    color: Colors.orange,
  }),
});
