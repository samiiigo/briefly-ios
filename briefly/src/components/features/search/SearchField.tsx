import React, { useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SEARCH_PLACEHOLDER } from '@/constants/search';
import { Colors, BorderRadius, Spacing, withAppFont } from '@/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}

export function SearchField({
  value,
  onChangeText,
  onSubmit,
  autoFocus = true,
}: Props) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [autoFocus]);

  return (
    <View style={styles.row}>
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
          blurOnSubmit
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          selectionColor={Colors.primary}
          accessibilityLabel="Search"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  leadingIcon: {
    marginRight: Spacing.sm,
  },
  input: withAppFont({
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 10,
  }),
});
