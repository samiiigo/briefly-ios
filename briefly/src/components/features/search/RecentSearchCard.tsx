import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, withAppFont } from '@/theme';

const RECENT_SEARCH_ICON = '🕒';

interface Props {
  query: string;
  onPress: () => void;
  onRemove: () => void;
}

export function RecentSearchCard({ query, onPress, onRemove }: Props) {
  return (
    <View style={styles.card}>
      <Pressable
        style={styles.leading}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Search for ${query}`}
      >
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>{RECENT_SEARCH_ICON}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
    padding: Spacing.md,
  },
  leading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minWidth: 0,
    marginRight: Spacing.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  title: withAppFont({
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
  }),
  removeButton: {
    padding: 4,
  },
});
