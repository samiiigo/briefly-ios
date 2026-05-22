/**
 * Cross-platform text-input dialog.
 *
 * On iOS `Alert.prompt` works natively; on Android there is no
 * equivalent, so this component renders a `Modal` + `TextInput`
 * with the same callback shape. Callers should use this component
 * everywhere a rename / new-folder prompt is needed.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';
interface TextInputDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}
/**
 * A simple dialog with a `TextInput`.
 * Designed to replace all `Alert.prompt` + fallback patterns.
 */
export function TextInputDialog({
  visible,
  title,
  message,
  defaultValue = '',
  placeholder,
  submitLabel = 'OK',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
}: TextInputDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<TextInput>(null);
  // Reset value when dialog opens
  useEffect(() => {
    if (visible) {
      setValue(defaultValue);
      // Delay focus so the keyboard opens after the modal animation
      const id = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(id);
    }
  }, [visible, defaultValue]);
  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  }, [value, onSubmit]);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        style={styles.overlay}
        onPress={onCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centerWrap}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.dialog}>
              <Text style={styles.title}>{title}</Text>
              {message ? <Text style={styles.message}>{message}</Text> : null}
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={value}
                onChangeText={setValue}
                placeholder={placeholder}
                placeholderTextColor={Colors.textTertiary}
                autoFocus
                selectTextOnFocus
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
              />
              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [styles.btn, pressed && Platform.OS === 'ios' && { opacity: 0.7 }]}
                  onPress={onCancel}
                  android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
                >
                  <Text style={styles.btnCancel}>{cancelLabel}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnPrimary,
                    pressed && Platform.OS === 'ios' && { opacity: 0.7 },
                    !value.trim() && { opacity: 0.4 },
                  ]}
                  onPress={handleSubmit}
                  disabled={!value.trim()}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  <Text style={styles.btnPrimaryText}>
                    {submitLabel}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centerWrap: {
    width: '100%',
    maxWidth: 340,
  },
  dialog: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  title: withAppFont({
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  }),
  message: withAppFont({
    fontSize: 14,
    color: Colors.subtext,
    marginBottom: 12,
    lineHeight: 20,
  }),
  input: withAppFont({
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  }),
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
  },
  btnCancel: withAppFont({
    fontSize: 16,
    color: Colors.subtext,
    fontWeight: '600',
  }),
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  btnPrimaryText: withAppFont({
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  }),
  btnDisabled: {
    opacity: 0.4,
  },
});
