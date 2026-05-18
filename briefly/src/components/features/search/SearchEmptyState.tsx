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
        <View style={styles.iconInner}>
          <Ionicons name="search-outline" size={40} color={Colors.subtext} />
        </View>
      </View>
      <Text style={styles.title}>No results found</Text>
      <Text style={styles.subtitle}>
        Nothing matched &apos;{query}&apos;. Try a different term.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: withAppFont({
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  }),
  subtitle: withAppFont({
    fontSize: 15,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
  }),
});
