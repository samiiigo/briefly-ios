import React, { useMemo } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { withAppFont } from '@/theme';

interface Props {
  text: string;
  query: string;
  style?: TextStyle;
  numberOfLines?: number;
}

export function HighlightedText({ text, query, style, numberOfLines }: Props) {
  const parts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || text.length === 0) return [{ value: text, highlighted: false }];
    if (text.length < q.length) return [{ value: text, highlighted: false }];

    const lower = text.toLowerCase();
    const segments: { value: string; highlighted: boolean }[] = [];
    let cursor = 0;

    while (cursor < text.length) {
      const index = lower.indexOf(q, cursor);
      if (index === -1) {
        segments.push({ value: text.slice(cursor), highlighted: false });
        break;
      }
      if (index > cursor) {
        segments.push({ value: text.slice(cursor, index), highlighted: false });
      }
      segments.push({
        value: text.slice(index, index + q.length),
        highlighted: true,
      });
      cursor = index + q.length;
    }

    return segments;
  }, [text, query]);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) =>
        part.highlighted ? (
          <Text key={i} style={[style, styles.highlight]}>
            {part.value}
          </Text>
        ) : (
          <Text key={i}>{part.value}</Text>
        )
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  highlight: withAppFont({
    color: '#FFFFFF',
    backgroundColor: 'rgba(10, 132, 255, 0.35)',
    borderRadius: 4,
  }),
});
