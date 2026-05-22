import React from 'react';
import { TouchableOpacity, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedColors } from '@/theme';
import { useScreenLayoutStyles } from '@/components/navigation/layout/screenLayout';
type SettingsNavigateRowProps = {
  title: string;
  value?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
};
export function SettingsNavigateRow({
  title,
  value,
  icon,
  iconColor,
  onPress,
  disabled,
  danger,
  style,
}: SettingsNavigateRowProps) {
  const colors = useThemedColors();
  const sl = useScreenLayoutStyles();
  return (
    <TouchableOpacity
      style={[sl.settingsRow, style]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={20}
          color={iconColor ?? colors.textPrimary}
          style={sl.settingsRowIcon}
        />
      ) : null}
      <Text style={[sl.settingsRowTitle, danger && sl.settingsRowTitleDanger]}>{title}</Text>
      {value ? <Text style={sl.settingsRowValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}
