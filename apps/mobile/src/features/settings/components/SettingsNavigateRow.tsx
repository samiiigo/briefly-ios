import React from 'react';
import { TouchableOpacity, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedColors } from '@briefly/theme/native';
import { useSettingsSheetLayoutStyles } from '@/navigation/layout/screenLayout';
type SettingsNavigateRowProps = {
  title: string;
  value?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
  /** Defaults to true. Set false for Beeper-style icon+label rows. */
  showChevron?: boolean;
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
  showChevron = true,
  style,
}: SettingsNavigateRowProps) {
  const colors = useThemedColors();
  const sl = useSettingsSheetLayoutStyles();
  return (
    <TouchableOpacity style={[sl.settingsRow, style]} onPress={onPress} disabled={disabled}>
      {icon ? (
        <Ionicons
          name={icon}
          size={22}
          color={iconColor ?? colors.textPrimary}
          style={sl.settingsRowIcon}
        />
      ) : null}
      <Text style={[sl.settingsRowTitle, danger && sl.settingsRowTitleDanger]}>{title}</Text>
      {value ? <Text style={sl.settingsRowValue}>{value}</Text> : null}
      {showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      ) : null}
    </TouchableOpacity>
  );
}
