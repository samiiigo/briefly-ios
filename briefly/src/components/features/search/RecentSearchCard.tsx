import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, withAppFont } from '@/theme';

interface Props {
  query: string;
  onPress: () => void;
  onRemove: () => void;
}

export function RecentSearchCard({ query, onPress, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.labelPressable}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Search for ${query}`}
      >
        <Text style={styles.label} numberOfLines={1}>
          {query}
        </Text>
      </Pressable>
      <Pressable
        onPress={onRemove}
        hitSlop={10}
        style={styles.removeButton}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${query} from recent searches`}
      >
        <Ionicons name="close" size={18} color={Colors.subtext} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  labelPressable: {
    flex: 1,
    minWidth: 0,
    marginRight: Spacing.sm,
  },
  label: withAppFont({
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
  }),
  removeButton: {
    padding: 4,
  },
});
