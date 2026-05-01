import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../store/useSettingsStore';
import { ProcessingMode } from '../types';
import { processingModeDescription, processingModeTitle } from '../lib/processingMode';
import { getProviderTitle, getApiKeyPlaceholder, isValidApiKeyFormat, detectCloudProviderFromKey } from '../lib/providers/cloudProvider';
import { Colors, Spacing } from '../lib/theme';

const PROCESSING_MODES: ProcessingMode[] = ['cloud-shared-openrouter', 'cloud-user-key', 'on-device'];

export default function ProcessingModePickerScreen() {
  const router = useRouter();
  const { defaultProcessingMode, setDefaultProcessingMode, cloudProvider, setCloudProvider, setProviderApiKey, getActiveApiKey } = useSettingsStore();
  const isCloudUserKey = defaultProcessingMode === 'cloud-user-key' || defaultProcessingMode === 'cloud';
  const [apiKeyInput, setApiKeyInput] = useState(getActiveApiKey());
  const isValidFormat = isValidApiKeyFormat(apiKeyInput, cloudProvider);
  const handleApiKeyChange = (value: string) => { setApiKeyInput(value); const detected = detectCloudProviderFromKey(value); const p = detected ?? cloudProvider; if (detected && detected !== cloudProvider) setCloudProvider(detected); setProviderApiKey(p, value); };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}><Ionicons name="chevron-back" size={28} color={Colors.primary} /></TouchableOpacity><Text style={styles.headerTitle}>Summarization Mode</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionDescription}>Choose how Briefly generates your final summary after transcription.</Text>
        <View style={styles.card}>
          {PROCESSING_MODES.map((mode, index) => {
            const selected = defaultProcessingMode === mode;
            return (<React.Fragment key={mode}><TouchableOpacity style={styles.optionRow} onPress={() => setDefaultProcessingMode(mode)}><View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioDot} />}</View><View style={styles.optionText}><Text style={styles.optionTitle}>{processingModeTitle(mode)}</Text><Text style={styles.optionSubtitle}>{processingModeDescription(mode)}</Text></View></TouchableOpacity>{index !== PROCESSING_MODES.length - 1 && <View style={styles.divider} />}</React.Fragment>);
          })}
        </View>
        {isCloudUserKey && (<>
          <Text style={styles.sectionLabel}>API KEY</Text>
          <Text style={styles.sectionDescription}>Paste one key and Briefly will auto-detect the provider.</Text>
          <View style={styles.card}>
            <View style={styles.apiKeyRow}><View style={styles.apiKeyIconSlot}><Ionicons name="key-outline" size={18} color={Colors.textSecondary} /></View><TextInput style={styles.apiKeyInput} value={apiKeyInput} onChangeText={handleApiKeyChange} onBlur={() => setProviderApiKey(cloudProvider, apiKeyInput)} placeholder={getApiKeyPlaceholder(cloudProvider)} placeholderTextColor="rgba(255,255,255,0.25)" secureTextEntry autoCapitalize="none" autoCorrect={false} />{apiKeyInput.length > 0 && <TouchableOpacity onPress={() => { setApiKeyInput(''); setProviderApiKey(cloudProvider, ''); }}><Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" /></TouchableOpacity>}</View>
            {apiKeyInput.trim().length > 0 && isValidFormat && <View style={styles.detectedRow}><View style={styles.apiKeyIconSlot}><Ionicons name="checkmark-circle" size={14} color={Colors.primary} /></View><Text style={styles.detectedText}>Detected: {getProviderTitle(cloudProvider)}</Text></View>}
            {apiKeyInput.trim().length > 0 && !isValidFormat && <View style={styles.detectedRow}><View style={styles.apiKeyIconSlot}><Ionicons name="help-circle" size={14} color={Colors.orange} /></View><Text style={[styles.detectedText, styles.detectedTextWarning]}>Key format not recognized.</Text></View>}
          </View>
        </>)}
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
  sectionLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, marginTop: 24, marginBottom: 6 },
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
  apiKeyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, gap: 12 },
  apiKeyIconSlot: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  apiKeyInput: { flex: 1, fontSize: 15, color: '#FFFFFF', paddingVertical: 4 },
  detectedRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 8, paddingBottom: 12, gap: 12 },
  detectedText: { flex: 1, fontSize: 13, color: Colors.primary },
  detectedTextWarning: { color: Colors.orange },
});
