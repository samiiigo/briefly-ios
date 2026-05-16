import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyInsight } from '@/types';
import { Colors, Spacing, BorderRadius } from '@/theme';

interface Props {
  insights: KeyInsight[];
}

export function KeyInsights({ insights }: Props) {
  if (!insights.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={16} color={Colors.primary} />
        <Text style={styles.headerText}>Key Insights</Text>
      </View>
      {insights.map((insight) => (
        <View key={insight.id} style={styles.item}>
          <View style={styles.bullet} />
          <Text style={styles.text}>{insight.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: Spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
