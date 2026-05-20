import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, withAppFont } from '@/theme';

interface Props {
  text: string;
}

/** Short prose overview when the summary is a single block. */
export function SummaryOverview({ text }: Props) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Overview</Text>
      <Text style={styles.body}>{trimmed}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  heading: withAppFont({
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    color: Colors.textPrimary,
    marginBottom: 12,
  }),
  body: withAppFont({
    fontSize: 15,
    lineHeight: 22,
    color: Colors.summaryBody,
  }),
});
