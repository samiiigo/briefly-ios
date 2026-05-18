import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SEARCH_PLACEHOLDER } from '@/constants/search';
import { Colors, BorderRadius, Spacing, withAppFont } from '@/theme';

export interface SearchFieldHandle {
  focus: () => void;
}

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}

export const SearchField = forwardRef<SearchFieldHandle, Props>(function SearchField(
  { value, onChangeText, onClear, onSubmit, autoFocus = true },
  ref
) {
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    if (!autoFocus) return;
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [autoFocus]);

  const showClear = value.length > 0;

  return (
    <View style={styles.field}>
      <Ionicons name="search" size={18} color={Colors.subtext} style={styles.leadingIcon} />
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={SEARCH_PLACEHOLDER}
        placeholderTextColor={Colors.textSecondary}
        returnKeyType="search"
        onSubmitEditing={() => onSubmit?.()}
        blurOnSubmit={false}
        autoCorrect={false}
        autoCapitalize="none"
        selectionColor={Colors.primary}
        accessibilityLabel="Search"
      />
      {showClear ? (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear search text"
        >
          <Ionicons name="close" size={14} color={Colors.textPrimary} />
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
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
    color: Colors.textPrimary,
    paddingVertical: 10,
    paddingRight: Spacing.xs,
  }),
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
