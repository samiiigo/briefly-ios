import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCreateStyles, useThemedColors, Spacing, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
interface Props {
  query: string;
}
export function SearchEmptyState({ query }: Props) {
  const styles = useCreateStyles(createSearchEmptyStateStyles);
  const colors = useThemedColors();
  return (
    <View style={styles.wrap}>
      <View style={styles.iconRing}>
        <View style={styles.iconInner}>
          <Ionicons name="search-outline" size={40} color={colors.subtext} />
        </View>
      </View>
      <Text style={styles.title}>No results found</Text>
      <Text style={styles.subtitle}>
        Nothing matched &apos;{query}&apos;. Try a different term.
      </Text>
    </View>
  );
}
function createSearchEmptyStateStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xxl,
      paddingBottom: Spacing.xl,
    },
    iconRing: {
      width: 160,
      height: 160,
      borderRadius: 80,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
    },
    iconInner: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: withAppFont({
      fontSize: 22,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    }),
    subtitle: withAppFont({
      fontSize: 15,
      color: c.subtext,
      textAlign: 'center',
      lineHeight: 22,
    }),
  });
}
