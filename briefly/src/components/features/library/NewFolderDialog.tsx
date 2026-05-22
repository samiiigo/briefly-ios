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
import { Ionicons } from '@expo/vector-icons';
import {
  Spacing,
  BorderRadius,
  withAppFont,
  useCreateStyles,
  useThemedColors,
  useResolvedColorScheme,
  shadowElevated,
} from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
import {
  folderIconBadgeBackground,
  folderIconColor,
} from '@/utils/folders/folderIconTheme';

interface NewFolderDialogProps {
  visible: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

/** New-folder prompt styled like a user folder tile in the library grid. */
export function NewFolderDialog({ visible, onSubmit, onCancel }: NewFolderDialogProps) {
  const styles = useCreateStyles(createNewFolderDialogStyles);
  const colors = useThemedColors();
  const resolvedScheme = useResolvedColorScheme();
  const [value, setValue] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setValue('');
      const id = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(id);
    }
  }, [visible]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  }, [value, onSubmit]);

  const userAccent = colors.folderUserIcon;
  const iconBg = folderIconBadgeBackground(userAccent, true, colors);
  const iconFg = folderIconColor('user', userAccent, colors);
  const rippleColor =
    resolvedScheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centerWrap}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.panel}>
              <View style={styles.folderTop}>
                <View style={[styles.folderIconBadge, { backgroundColor: iconBg }]}>
                  <Ionicons name="folder" size={22} color={iconFg} />
                </View>
              </View>
              <Text style={styles.title}>New Folder</Text>
              <Text style={styles.message}>Enter a name for the folder</Text>
              <TextInput
                ref={inputRef}
                style={styles.nameInput}
                value={value}
                onChangeText={setValue}
                placeholder="Folder name"
                placeholderTextColor={colors.subtext}
                autoFocus
                selectTextOnFocus
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
              />
              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    pressed && Platform.OS === 'ios' && styles.actionPressed,
                  ]}
                  onPress={onCancel}
                  android_ripple={{ color: rippleColor }}
                >
                  <Text style={styles.cancelLabel}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.createBtn,
                    pressed && Platform.OS === 'ios' && styles.actionPressed,
                    !value.trim() && styles.createBtnDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!value.trim()}
                  android_ripple={{ color: rippleColor }}
                >
                  <Text style={styles.createLabel}>Create</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function createNewFolderDialogStyles(c: ColorPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    centerWrap: {
      width: '100%',
      maxWidth: 340,
    },
    panel: {
      position: 'relative',
      backgroundColor: c.card,
      borderRadius: BorderRadius.cardXL,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      ...shadowElevated,
    },
    folderTop: {
      marginBottom: 10,
    },
    folderIconBadge: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: withAppFont({
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 22,
      color: c.textPrimary,
      marginBottom: 4,
    }),
    message: withAppFont({
      fontSize: 14,
      lineHeight: 20,
      color: c.subtext,
      marginBottom: Spacing.md,
    }),
    nameInput: withAppFont({
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 22,
      color: c.textPrimary,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      marginBottom: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    }),
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: Spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      marginHorizontal: -Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
    },
    actionBtn: {
      paddingVertical: 10,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    actionPressed: {
      opacity: 0.72,
    },
    cancelLabel: withAppFont({
      fontSize: 16,
      fontWeight: '600',
      color: c.subtext,
    }),
    createBtn: {
      backgroundColor: c.primary,
    },
    createBtnDisabled: {
      opacity: 0.4,
    },
    createLabel: withAppFont({
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    }),
  });
}
