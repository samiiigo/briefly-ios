import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/useSettingsStore';
import { Colors, Spacing, BorderRadius } from '../utils/theme';

export function SettingsScreen() {
  const {
    defaultProcessingMode,
    cloudApiKey,
    cloudApiProvider,
    cloudApiEndpoint,
    setDefaultProcessingMode,
    setCloudApiKey,
    setCloudApiProvider,
    setCloudApiEndpoint,
  } = useSettingsStore();

  const [showKey, setShowKey] = useState(false);
  const [apiKeyDraft, setApiKeyDraft] = useState(cloudApiKey);

  const isCloud = defaultProcessingMode === 'cloud';

  const handleSaveApiKey = () => {
    setCloudApiKey(apiKeyDraft.trim());
    Alert.alert('Saved', 'API key updated.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Default Processing Mode */}
        <Text style={styles.sectionLabel}>PROCESSING</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Default Mode</Text>
              <Text style={styles.rowSubtitle}>
                {isCloud ? 'Cloud — more powerful analysis' : 'On-Device — fully private'}
              </Text>
            </View>
            <Switch
              value={isCloud}
              onValueChange={(v) => setDefaultProcessingMode(v ? 'cloud' : 'on-device')}
              trackColor={{ false: Colors.surface, true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="lock-closed-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              On-Device: audio never leaves your device. Cloud: audio sent via HTTPS with zero-data-retention headers.
            </Text>
          </View>
        </View>

        {/* Cloud API Settings */}
        <Text style={styles.sectionLabel}>CLOUD API</Text>
        <View style={styles.card}>
          {/* Provider */}
          <Text style={styles.fieldLabel}>Provider</Text>
          <View style={styles.segmentRow}>
            {(['openai', 'anthropic'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.segment, cloudApiProvider === p && styles.segmentActive]}
                onPress={() => setCloudApiProvider(p)}
              >
                <Text
                  style={[styles.segmentText, cloudApiProvider === p && styles.segmentTextActive]}
                >
                  {p === 'openai' ? 'OpenAI' : 'Anthropic'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Endpoint */}
          <Text style={styles.fieldLabel}>API Endpoint</Text>
          <TextInput
            style={styles.input}
            value={cloudApiEndpoint}
            onChangeText={setCloudApiEndpoint}
            placeholder="https://api.openai.com/v1"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="none"
            keyboardType="url"
          />

          <View style={styles.divider} />

          {/* API Key */}
          <Text style={styles.fieldLabel}>API Key</Text>
          <View style={styles.apiKeyRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={apiKeyDraft}
              onChangeText={setApiKeyDraft}
              placeholder="sk-..."
              placeholderTextColor={Colors.textTertiary}
              secureTextEntry={!showKey}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowKey((s) => !s)} style={styles.eyeButton}>
              <Ionicons
                name={showKey ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveApiKey}>
            <Text style={styles.saveButtonText}>Save API Key</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Briefly</Text>
            <Text style={styles.rowSubtitle}>v1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: Spacing.md, paddingBottom: 100 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    paddingHorizontal: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowTitle: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  rowSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: 12,
  },
  infoText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  fieldLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 14, marginBottom: 6 },
  segmentRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  segmentTextActive: { color: '#fff', fontWeight: '600' },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  apiKeyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  eyeButton: { padding: 8 },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  saveButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
