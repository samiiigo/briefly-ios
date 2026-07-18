import React from 'react';
import { Platform, Text, TextStyle } from 'react-native';
/** Matches emoji runs, bold, and italic (same rules as summary markdown inline). */
const INLINE_TOKEN_RE = /(\p{Extended_Pictographic}+|\*\*[^*]+\*\*|\*[^*]+\*)/gu;
/** System color emoji font so glyphs stay upright and aligned with custom text fonts. */
const EMOJI_STYLE: TextStyle = Platform.select({
  ios: { fontFamily: 'Apple Color Emoji' },
  default: {},
}) ?? {};
interface Props {
  text: string;
  style: TextStyle;
  strongStyle?: TextStyle;
  emStyle?: TextStyle;
  numberOfLines?: number;
}
/** Renders text with upright emojis and optional **bold** / *italic* markers. */
export function EmojiAwareText({ text, style, strongStyle, emStyle, numberOfLines }: Props) {
  const parts = text.split(INLINE_TOKEN_RE).filter((part) => part.length > 0);
  if (parts.length === 0) return null;
  const hasRichContent =
    parts.length > 1 ||
    /^\p{Extended_Pictographic}+$/u.test(parts[0]!) ||
    parts[0]!.includes('**') ||
    parts[0]!.includes('*');
  if (!hasRichContent) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) => {
        const key = `t-${index}`;
        if (/^\p{Extended_Pictographic}+$/u.test(part)) {
          return (
            <Text
              key={key}
              style={[
                style,
                EMOJI_STYLE,
                { fontWeight: '400', fontStyle: 'normal' },
              ]}
            >
              {part}
            </Text>
          );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={key} style={[style, strongStyle, { fontWeight: '700' }]}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <Text key={key} style={[style, emStyle, { fontStyle: 'italic' }]}>
              {part.slice(1, -1)}
            </Text>
          );
        }
        return <Text key={key}>{part}</Text>;
      })}
    </Text>
  );
}
