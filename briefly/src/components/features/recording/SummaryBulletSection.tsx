import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCreateStyles, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

interface Props {
  bullets: string[];
}

export function SummaryBulletSection({ bullets }: Props) {
  const styles = useCreateStyles(createSummaryBulletSectionStyles);
  if (!bullets.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Summary</Text>
      <View style={styles.list}>
        {bullets.map((bullet, index) => (
          <View key={`${index}-${bullet.slice(0, 24)}`} style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>{bullet}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function createSummaryBulletSectionStyles(c: ColorPalette) {
  return StyleSheet.create({
    section: {
      marginTop: 8,
      marginBottom: 24,
    },
    heading: withAppFont({
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 30,
      color: c.textPrimary,
      marginBottom: 16,
    }),
    list: {
      gap: 16,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    bullet: withAppFont({
      width: 16,
      marginTop: 6,
      marginRight: 8,
      fontSize: 14,
      lineHeight: 20,
      color: c.summaryMuted,
    }),
    text: withAppFont({
      flex: 1,
      fontSize: 15,
      lineHeight: 21,
      color: c.summaryBody,
    }),
  });
}
