import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface CircularIconButtonProps {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  style?: ViewStyle;
}

export function CircularIconButton({
  icon,
  onPress,
  accessibilityLabel,
  style,
}: CircularIconButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={22} color={Colors.textPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
