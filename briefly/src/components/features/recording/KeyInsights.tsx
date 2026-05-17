import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyInsight } from '@/types';
import { Colors } from '@/theme';

interface Props {
  insights: KeyInsight[];
}

export function KeyInsights({ insights }: Props) {
  if (!insights.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={18} color={Colors.insightAccent} />
        <Text style={styles.headerText}>Key insights</Text>
      </View>
      <View style={styles.list}>
        {insights.map((insight) => (
          <View key={insight.id} style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>{insight.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.insightCard,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  list: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 19,
    marginTop: 6,
    marginRight: 12,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.insightAccent,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    color: Colors.summaryBody,
  },
});
