import React from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RecordingRetryAction } from '@/utils/processing/recordingRetryAction';
import { useCreateStyles, useThemedColors } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
type Size = 'md' | 'lg' | 'compact';
const DIM: Record<Size, number> = {
  md: 48,
  lg: 56,
  compact: 48,
};
const ICON_SIZE: Record<Size, number> = {
  md: 24,
  lg: 26,
  compact: 22,
};
interface Props {
  action: RecordingRetryAction;
  onPress: () => void;
  size?: Size;
}
export function RecordingProcessingRetryCircle({ action, onPress, size = 'md' }: Props) {
  const styles = useCreateStyles(createRecordingProcessingRetryCircleStyles);
  const colors = useThemedColors();
  const dim = DIM[size];
  return (
    <Pressable
      style={({ pressed }) => [
        styles.circle,
        { width: dim, height: dim, borderRadius: dim / 2 },
        pressed && Platform.OS === 'ios' && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel}
    >
      <Ionicons name={action.icon} size={ICON_SIZE[size]} color={colors.orange} />
    </Pressable>
  );
}
function createRecordingProcessingRetryCircleStyles(c: ColorPalette) {
  return StyleSheet.create({
    circle: {
      backgroundColor: 'rgba(255, 159, 10, 0.2)',
      borderWidth: 1,
      borderColor: 'rgba(255, 159, 10, 0.45)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.75,
    },
  });
}
