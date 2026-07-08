import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={56} color={Colors.danger || '#FF453A'} />
        </View>

        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          We encountered an unexpected issue while loading this screen.
        </Text>

        <View style={styles.errorSnippetBox}>
          <Text style={styles.errorSnippetText} numberOfLines={2}>
            {error.message || 'Unknown error occurred'}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={resetError}>
            <Ionicons name="refresh" size={18} color={Colors.background} />
            <Text style={styles.primaryButtonText}>Reload App</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="code-slash" size={18} color={Colors.primary} />
              <Text style={styles.secondaryButtonText}>Inspect Stack Trace</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Developer-friendly modal to inspect stack traces */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalVisible(false)}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Developer Error Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.sectionLabel}>ERROR MESSAGE</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{error.message || 'No message provided'}</Text>
              </View>

              <Text style={styles.sectionLabel}>STACK TRACE</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{error.stack || 'No stack trace available'}</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalPrimaryButton} onPress={resetError}>
                <Text style={styles.modalPrimaryButtonText}>Reload & Reset</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: withAppFont({
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  }),
  subtitle: withAppFont({
    fontSize: 15,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  }),
  errorSnippetBox: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  errorSnippetText: withAppFont({
    fontSize: 13,
    color: Colors.danger || '#FF453A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  }),
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.cardXL,
    gap: Spacing.sm,
  },
  primaryButtonText: withAppFont({
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  }),
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.cardXL,
    gap: Spacing.sm,
  },
  secondaryButtonText: withAppFont({
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  }),
  modalSafeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  modalTitle: withAppFont({
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  }),
  closeButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
  },
  sectionLabel: withAppFont({
    fontSize: 12,
    fontWeight: '700',
    color: Colors.subtext,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    letterSpacing: 0.8,
  }),
  codeBox: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeText: withAppFont({
    fontSize: 12,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  }),
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  modalPrimaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.cardXL,
  },
  modalPrimaryButtonText: withAppFont({
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  }),
});
