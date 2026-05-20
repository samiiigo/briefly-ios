import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RECORD_BUTTON_SIZE,
  useFloatingTabBarLayout,
} from '@/components/navigation/useFloatingTabBarLayout';
import { useCreateStyles, useResolvedColorScheme, useThemedColors } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

const SIZE = RECORD_BUTTON_SIZE;

interface ImportFabButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function ImportFabButton({ onPress, disabled, style }: ImportFabButtonProps) {
  const styles = useCreateStyles(createImportFabButtonStyles);
  const colors = useThemedColors();
  const isLight = useResolvedColorScheme() === 'light';
  const { recordButtonBottom, horizontalInset } = useFloatingTabBarLayout();

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        isLight ? styles.fabBorderLight : styles.fabBorderDark,
        { bottom: recordButtonBottom, right: horizontalInset },
        disabled && styles.fabDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.9}
      accessibilityLabel="Import transcripts or audio"
      accessibilityRole="button"
      accessibilityHint="Opens the file picker to import a backup or audio file"
      accessibilityState={{ disabled: !!disabled }}
    >
      {disabled ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name="add" size={28} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
}

function createImportFabButtonStyles(c: ColorPalette) {
  return StyleSheet.create({
    fab: {
      position: 'absolute',
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      zIndex: 10,
      elevation: 10,
    },
    fabBorderDark: {
      borderColor: 'rgba(255,255,255,0.05)',
    },
    fabBorderLight: {
      borderColor: c.border,
    },
    fabDisabled: {
      opacity: 0.7,
    },
  });
}
