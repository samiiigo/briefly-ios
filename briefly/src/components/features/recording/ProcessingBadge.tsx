import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProcessingMode } from '@/types';
import { useCreateStyles, useThemedColors, BorderRadius } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

interface Props {
  mode: ProcessingMode;
  size?: 'sm' | 'md';
  /**
   * When false, only the icon is shown (no CLOUD / ON-DEVICE label).
   * Useful for compact list tiles where we want less visual noise.
   */
  showLabel?: boolean;
}

export function ProcessingBadge({ mode, size = 'md', showLabel = true }: Props) {
  const styles = useCreateStyles(createProcessingBadgeStyles);
  const colors = useThemedColors();
  const isCloud = mode !== 'on-device';
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, isCloud ? styles.cloudBadge : styles.onDeviceBadge]}>
      <Ionicons
        name={isCloud ? 'cloud' : 'shield-checkmark'}
        size={isSmall ? 10 : 12}
        color={isCloud ? colors.primary : colors.onDeviceText}
        style={[styles.icon, !showLabel && styles.iconOnly]}
      />
      {showLabel && (
        <Text
          style={[
            styles.text,
            isCloud ? styles.cloudText : styles.onDeviceText,
            isSmall && styles.textSmall,
          ]}
        >
          {isCloud ? 'CLOUD' : 'ON-DEVICE'}
        </Text>
      )}
    </View>
  );
}

function createProcessingBadgeStyles(c: ColorPalette) {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: BorderRadius.full,
    },
    cloudBadge: {
      backgroundColor: c.cloudBadge,
    },
    onDeviceBadge: {
      backgroundColor: c.onDeviceBadge,
    },
    icon: {
      marginRight: 4,
    },
    iconOnly: {
      marginRight: 0,
    },
    text: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    textSmall: {
      fontSize: 10,
    },
    cloudText: {
      color: c.primary,
    },
    onDeviceText: {
      color: c.onDeviceText,
    },
  });
}
