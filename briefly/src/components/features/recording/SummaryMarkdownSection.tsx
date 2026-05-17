import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, withSerifFont } from '@/theme';
import { SummaryMarkdownContent } from './SummaryMarkdownContent';
import { prepareSummaryMarkdownBlocks } from '@/utils/parseSummaryMarkdown';

interface Props {
  markdown: string;
  hasKeyInsights?: boolean;
}

/** Renders the AI summary as formatted Markdown (headings, bullets, bold). */
export function SummaryMarkdownSection({ markdown, hasKeyInsights = false }: Props) {
  const trimmed = markdown.trim();
  const blocks = prepareSummaryMarkdownBlocks(trimmed, { hasKeyInsights });
  if (!trimmed || blocks.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Summary</Text>
      <SummaryMarkdownContent blocks={blocks} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    marginBottom: 24,
  },
  heading: withSerifFont({
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: Colors.textPrimary,
    marginBottom: 16,
  }),
});
