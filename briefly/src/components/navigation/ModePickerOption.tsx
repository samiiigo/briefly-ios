import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useModePickerStyles } from './screenLayout';

type Props = {
  selected: boolean;
  disabled?: boolean;
  title: string;
  subtitle: string;
  unavailableHint?: string;
  onPress: () => void;
};

export function ModePickerOption({
  selected,
  disabled = false,
  title,
  subtitle,
  unavailableHint,
  onPress,
}: Props) {
  const mp = useModePickerStyles();

  return (
    <TouchableOpacity
      style={[mp.optionRow, disabled && mp.optionRowDisabled]}
      disabled={disabled}
      onPress={onPress}
      accessibilityState={{ disabled, selected }}
    >
      <View
        style={[
          mp.radio,
          selected && (disabled ? mp.radioSelectedDisabled : mp.radioSelected),
          disabled && !selected && mp.radioDisabled,
        ]}
      >
        {selected ? <View style={mp.radioDot} /> : null}
      </View>
      <View style={mp.optionText}>
        <Text style={[mp.optionTitle, disabled && mp.optionTitleDisabled]}>{title}</Text>
        <Text style={[mp.optionSubtitle, disabled && mp.optionSubtitleDisabled]}>
          {disabled && unavailableHint ? unavailableHint : subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
