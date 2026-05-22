import React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { useCreateStyles, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
import { SummaryMarkdownBlock } from '@/utils/summary/parseSummaryMarkdown';
import { EmojiAwareText } from '@/components/features/recording/EmojiAwareText';
interface Props {
  blocks: SummaryMarkdownBlock[];
}
type SummaryMarkdownStyles = ReturnType<typeof createSummaryMarkdownContentStyles>;
function renderInline(
  text: string,
  baseStyle: TextStyle,
  styles: SummaryMarkdownStyles,
) {
  return (
    <EmojiAwareText
      text={text}
      style={baseStyle}
      strongStyle={styles.strong}
      emStyle={styles.em}
    />
  );
}
function BlockView({
  block,
  index,
  styles,
}: {
  block: SummaryMarkdownBlock;
  index: number;
  styles: SummaryMarkdownStyles;
}) {
  switch (block.type) {
    case 'h2':
      return <EmojiAwareText key={index} text={block.text} style={styles.h2} />;
    case 'h3':
      return <EmojiAwareText key={index} text={block.text} style={styles.h3} />;
    case 'p':
      return (
        <View key={index} style={styles.paragraph}>
          {renderInline(block.text, styles.body, styles)}
        </View>
      );
    case 'ul':
      return (
        <View key={index} style={styles.list}>
          {block.items.map((item, itemIndex) => (
            <View key={`${index}-${itemIndex}`} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <View style={styles.listItemText}>
                {renderInline(item, styles.body, styles)}
              </View>
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}
export function SummaryMarkdownContent({ blocks }: Props) {
  const styles = useCreateStyles(createSummaryMarkdownContentStyles);
  if (!blocks.length) return null;
  return (
    <View style={styles.container}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} index={index} styles={styles} />
      ))}
    </View>
  );
}
function createSummaryMarkdownContentStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      gap: 0,
    },
    h2: withAppFont({
      fontSize: 19,
      fontWeight: '700',
      lineHeight: 28,
      color: c.textPrimary,
      marginTop: 4,
      marginBottom: 10,
    }),
    h3: withAppFont({
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 24,
      color: c.textPrimary,
      marginTop: 4,
      marginBottom: 8,
    }),
    paragraph: {
      marginBottom: 12,
    },
    body: withAppFont({
      fontSize: 17,
      lineHeight: 25,
      color: c.summaryBody,
    }),
    strong: withAppFont({
      fontWeight: '700',
      color: c.textPrimary,
    }),
    em: withAppFont({
      fontStyle: 'italic',
      color: c.summaryBody,
    }),
    list: {
      marginBottom: 12,
      gap: 8,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    bullet: withAppFont({
      width: 18,
      marginTop: 7,
      marginRight: 8,
      fontSize: 16,
      lineHeight: 22,
      color: c.summaryMuted,
    }),
    listItemText: {
      flex: 1,
    },
  });
}
