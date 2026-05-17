import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/context/useSettingsStore';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { TopBlurFade } from '@/components/navigation/TopBlurFade';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import {
  modePickerStyles as mp,
  screenLayoutStyles as sl,
} from '@/components/navigation/screenLayout';
import { ProcessingMode } from '@/types';
import { processingModeDescription, processingModeTitle } from '@/utils/processingMode';
import {
  getProviderTitle,
  getApiKeyPlaceholder,
  isValidApiKeyFormat,
  detectCloudProviderFromKey,
} from '@/utils/providers/cloudProvider';
import { Colors, withAppFont } from '@/theme';

const PROCESSING_MODES: ProcessingMode[] = [
  'cloud-shared-openrouter',
  'cloud-user-key',
  'on-device',
];

export default function ProcessingModePickerScreen() {
  const router = useRouter();
  const { scrollPaddingTop, topInset } = useTopChromeLayout();
  const {
    summarizationMode,
    setSummarizationMode,
    cloudProvider,
    setCloudProvider,
    setProviderApiKey,
    getActiveApiKey,
  } = useSettingsStore();
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

      <TopBlurFade />
      <View style={[sl.headerOverlay, { paddingTop: topInset }]} pointerEvents="box-none">
        <StackScreenHeader
          title="Summarization"
          showBack
          onBack={() => router.back()}
        />
      </View>
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
});
