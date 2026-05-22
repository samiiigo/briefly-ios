import React from 'react';
import { View, Text, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedColors } from '@/theme';
import { useScreenLayoutStyles } from '@/components/navigation/layout/screenLayout';
type SettingsToggleRowProps = {
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};
export function SettingsToggleRow({ title, value, onValueChange, icon }: SettingsToggleRowProps) {
  const colors = useThemedColors();
  const sl = useScreenLayoutStyles();
  return (
    <View style={sl.settingsRow}>
      {icon ? (
        <Ionicons
          name={icon}
          size={20}
          color={colors.textPrimary}
          style={sl.settingsRowIcon}
        />
      ) : null}
      <Text style={sl.settingsRowTitle}>{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
      />
    </View>
  );
}
