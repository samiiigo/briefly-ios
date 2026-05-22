import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCreateStyles, useThemedColors, Spacing, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
/** Matches {@link SearchField} leading icon + trailing gap for row alignment. */
const LEADING_ICON_SIZE = 18;
const LEADING_ICON_GAP = Spacing.sm;
export const RECENT_SEARCH_LEADING_INSET = LEADING_ICON_SIZE + LEADING_ICON_GAP;
interface Props {
  query: string;
  onPress: () => void;
  onRemove: () => void;
}
export function RecentSearchCard({ query, onPress, onRemove }: Props) {
  const styles = useCreateStyles(createRecentSearchCardStyles);
  const colors = useThemedColors();
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.labelPressable}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Search for ${query}`}
      >
        <View style={styles.leadingSlot}>
          <Ionicons name="time-outline" size={LEADING_ICON_SIZE} color={colors.subtext} />
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
        <Ionicons name="close" size={18} color={colors.subtext} />
      </Pressable>
    </View>
  );
}
function createRecentSearchCardStyles(c: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
    },
    labelPressable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
      paddingVertical: Spacing.sm,
      marginRight: Spacing.sm,
    },
    leadingSlot: {
      width: LEADING_ICON_SIZE,
      marginRight: LEADING_ICON_GAP,
      alignItems: 'center',
    },
    label: withAppFont({
      flex: 1,
      fontSize: 17,
      fontWeight: '600',
      color: c.textPrimary,
      lineHeight: 22,
    }),
    removeButton: {
      padding: 4,
    },
  });
}
