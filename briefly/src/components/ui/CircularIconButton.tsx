import React from 'react';
import {
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Platform,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCreateStyles, useThemedColors } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
type IconName = React.ComponentProps<typeof Ionicons>['name'];
interface CircularIconButtonProps {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
}
export function CircularIconButton({
  icon,
  onPress,
  accessibilityLabel,
  style,
  loading = false,
  disabled: disabledProp = false,
}: CircularIconButtonProps) {
  const styles = useCreateStyles(createCircularIconButtonStyles);
  const colors = useThemedColors();
  const disabled = loading || disabledProp || onPress == null;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        style,
        disabled && styles.buttonDisabled,
        pressed && !disabled && Platform.OS === 'ios' && { opacity: 0.75 },
      ]}
      onPress={disabled ? undefined : onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false, radius: 22 }}
    >
      <Ionicons
        name={icon}
        size={22}
        color={disabled ? colors.subtext : colors.textPrimary}
        style={loading ? styles.iconLoading : undefined}
      />
      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null}
    </Pressable>
  );
}
function createCircularIconButtonStyles(c: ColorPalette) {
  return StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  iconLoading: {
    opacity: 0.35,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  });
}
