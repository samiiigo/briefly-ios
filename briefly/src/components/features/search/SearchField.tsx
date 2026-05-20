import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SEARCH_PLACEHOLDER } from '@/constants/search';
import {
  BorderRadius,
  Spacing,
  useCreateStyles,
  useThemedColors,
  withAppFont,
} from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

export interface SearchFieldHandle {
  focus: () => void;
  blur: () => void;
}

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onSubmit?: () => void;
  /** Fires when the field loses focus (keyboard minimized, tap outside, etc.). */
  onBlur?: () => void;
  autoFocus?: boolean;
}

export const SearchField = forwardRef<SearchFieldHandle, Props>(function SearchField(
  { value, onChangeText, onClear, onSubmit, onBlur, autoFocus = true },
  ref
) {
  const styles = useCreateStyles(createSearchFieldStyles);
  const colors = useThemedColors();
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  useEffect(() => {
    if (!autoFocus) return;
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [autoFocus]);

  const showClear = value.length > 0;

  const handleClearPress = useCallback(() => {
    onClear();
    // Tap targets the ×, not the field — refocus so the keyboard stays open.
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [onClear]);

  return (
    <View style={styles.field}>
      <Ionicons name="search" size={18} color={colors.subtext} style={styles.leadingIcon} />
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={SEARCH_PLACEHOLDER}
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        onSubmitEditing={() => onSubmit?.()}
        onBlur={() => onBlur?.()}
        blurOnSubmit
        autoCorrect={false}
        autoCapitalize="none"
        selectionColor={colors.primary}
        accessibilityLabel="Search"
      />
      {showClear ? (
        <Pressable
          onPress={handleClearPress}
          hitSlop={8}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear search text"
        >
          <Ionicons name="close" size={14} color={colors.textPrimary} />
        </Pressable>
      ) : null}
    </View>
  );
});

function createSearchFieldStyles(c: ColorPalette) {
  return StyleSheet.create({
    field: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: BorderRadius.cardXL,
      paddingLeft: Spacing.md,
      paddingRight: Spacing.sm,
      minHeight: 44,
    },
    leadingIcon: {
      marginRight: Spacing.sm,
    },
    input: withAppFont({
      flex: 1,
      fontSize: 17,
      color: c.textPrimary,
      paddingVertical: 10,
      paddingRight: Spacing.xs,
    }),
    clearButton: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.pauseButton,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 2,
    },
  });
}
