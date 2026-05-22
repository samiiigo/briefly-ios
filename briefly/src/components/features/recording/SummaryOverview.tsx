import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCreateStyles, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
interface Props {
  text: string;
}
/** Short prose overview when the summary is a single block. */
export function SummaryOverview({ text }: Props) {
  const styles = useCreateStyles(createSummaryOverviewStyles);
  const trimmed = text.trim();
  if (!trimmed) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Overview</Text>
      <Text style={styles.body}>{trimmed}</Text>
    </View>
  );
}
function createSummaryOverviewStyles(c: ColorPalette) {
  return StyleSheet.create({
    section: {
      marginBottom: 20,
    },
    heading: withAppFont({
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 30,
      color: c.textPrimary,
      marginBottom: 12,
    }),
    body: withAppFont({
      fontSize: 15,
      lineHeight: 22,
      color: c.summaryBody,
    }),
  });
}
