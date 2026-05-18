import React, { useRef, useEffect } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SEARCH_PLACEHOLDER } from '@/constants/search';
import { Colors, BorderRadius, Spacing, withAppFont } from '@/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onCancel: () => void;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChangeText, onCancel, autoFocus = true }: Props) {
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
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          selectionColor={Colors.primary}
          accessibilityLabel="Search"
        />
      </View>
      <Pressable
        onPress={onCancel}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Cancel search"
      >
        <Text style={styles.cancel}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
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
  cancel: withAppFont({
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  }),
});
