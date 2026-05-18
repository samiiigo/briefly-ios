import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, withAppFont } from '@/theme';

/** Matches {@link SearchField} leading icon + trailing gap for row alignment. */
const LEADING_ICON_SIZE = 18;
const LEADING_ICON_GAP = Spacing.sm;

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
        <View style={styles.leadingSlot}>
          <Ionicons name="time-outline" size={LEADING_ICON_SIZE} color={Colors.subtext} />
        </View>
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
    minHeight: 44,
  },
  labelPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.xs,
  },
  leadingSlot: {
    width: LEADING_ICON_SIZE,
    marginRight: LEADING_ICON_GAP,
    alignItems: 'center',
    flexShrink: 0,
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
