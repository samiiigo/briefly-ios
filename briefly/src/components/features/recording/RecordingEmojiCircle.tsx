import React from 'react';
import { Platform, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BorderRadius, useCreateStyles } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
type Size = 'md' | 'lg';
const SIZE_CONFIG: Record<Size, { dim: number; fontSize: number }> = {
  lg: { dim: 56, fontSize: 24 },
  md: { dim: 48, fontSize: 22 },
};
interface Props {
  emoji: string;
  size?: Size;
  style?: ViewStyle;
}
/** Circular emoji badge (Figma: Background+Border, 56×56). */
export function RecordingEmojiCircle({ emoji, size = 'lg', style }: Props) {
  const styles = useCreateStyles(createRecordingEmojiCircleStyles);
  const { dim, fontSize } = SIZE_CONFIG[size];
  return (
    <View
      style={[
        styles.circle,
        { width: dim, height: dim, borderRadius: BorderRadius.full },
        style,
      ]}
    >
      <Text
        style={[
          styles.emoji,
          {
            width: dim,
            fontSize,
            lineHeight: dim,
          },
        ]}
        allowFontScaling={true}
      >
        {emoji}
      </Text>
    </View>
  );
}
function createRecordingEmojiCircleStyles(c: ColorPalette) {
  return StyleSheet.create({
    circle: {
      backgroundColor: c.emojiCircleBackground,
      borderWidth: 1,
      borderColor: c.emojiCircleBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emoji: {
      color: c.textPrimary,
      textAlign: 'center',
      ...Platform.select({
        ios: { fontFamily: 'Apple Color Emoji' },
        android: {
          includeFontPadding: false,
          textAlignVertical: 'center',
        },
        default: {},
      }),
    },
  });
}
