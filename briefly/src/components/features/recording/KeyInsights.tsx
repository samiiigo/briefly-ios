import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { KeyInsight } from '@/types';
import { screenLayoutStyles as sl } from '@/components/navigation/screenLayout';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';

interface Props {
  insights: KeyInsight[];
}

export function KeyInsights({ insights }: Props) {
  if (!insights.length) return null;

  return (
    <View style={styles.section}>
      <Text style={sl.listSectionHeader}>Key insights</Text>
      <View style={styles.card}>
        {insights.map((insight) => (
          <View key={insight.id} style={styles.item}>
            <View style={styles.bullet} />
            <Text style={styles.text}>{insight.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
    padding: Spacing.md,
    gap: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
  },
  text: withAppFont({
    flex: 1,
    fontSize: 15,
    color: Colors.subtext,
    lineHeight: 22,
  }),
});
