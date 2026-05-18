import React from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface CircularIconButtonProps {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

export function CircularIconButton({
  icon,
  onPress,
  accessibilityLabel,
  style,
}: CircularIconButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && Platform.OS === 'ios' && { opacity: 0.75 },
      ]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false, radius: 22 }}
    >
      <Ionicons name={icon} size={22} color={Colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
