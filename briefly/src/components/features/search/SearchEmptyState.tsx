import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, withAppFont } from '@/theme';

interface Props {
  query: string;
}

export function SearchEmptyState({ query }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconRing}>
        <Ionicons name="search-outline" size={36} color={Colors.subtext} />
      </View>
      <Text style={styles.message}>
        No results found for &apos;{query}&apos;
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    minHeight: 280,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  message: withAppFont({
    fontSize: 17,
    fontWeight: '500',
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 24,
  }),
});
