import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyInsight } from '@/types';
import { EmojiAwareText } from '@/components/features/recording/EmojiAwareText';
import { useCreateStyles, useThemedColors, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
interface Props {
  insights: KeyInsight[];
}
export function KeyInsights({ insights }: Props) {
  const styles = useCreateStyles(createKeyInsightsStyles);
  const colors = useThemedColors();
  if (!insights.length) return null;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={18} color={colors.insightAccent} />
        <Text style={styles.headerText}>Key insights</Text>
      </View>
      <View style={styles.list}>
        {insights.map((insight) => (
          <View key={insight.id} style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <EmojiAwareText text={insight.text} style={styles.text} strongStyle={styles.textStrong} />
          </View>
        ))}
      </View>
    </View>
  );
}
function createKeyInsightsStyles(c: ColorPalette) {
  return StyleSheet.create({
  container: {
    backgroundColor: c.insightCard,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
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
  headerText: withAppFont({
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    color: c.textPrimary,
  }),
  list: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: withAppFont({
    width: 20,
    marginTop: 5,
    marginRight: 12,
    fontSize: 13,
    lineHeight: 16,
    color: c.insightAccent,
  }),
  text: withAppFont({
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: c.summaryBody,
  }),
  textStrong: withAppFont({
    fontWeight: '700',
    color: c.textPrimary,
  }),
  });
}
