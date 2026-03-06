import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProcessingMode } from '../types';
import { Colors, BorderRadius } from '../utils/theme';

interface Props {
  mode: ProcessingMode;
  size?: 'sm' | 'md';
}

export function ProcessingBadge({ mode, size = 'md' }: Props) {
  const isCloud = mode === 'cloud';
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, isCloud ? styles.cloudBadge : styles.onDeviceBadge]}>
      <Ionicons
        name={isCloud ? 'cloud' : 'lock-closed'}
        size={isSmall ? 10 : 12}
        color={isCloud ? Colors.primary : Colors.onDeviceText}
        style={styles.icon}
      />
      <Text
        style={[
          styles.text,
          isCloud ? styles.cloudText : styles.onDeviceText,
          isSmall && styles.textSmall,
        ]}
      >
        {isCloud ? 'CLOUD' : 'ON-DEVICE'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  cloudBadge: {
    backgroundColor: Colors.cloudBadge,
  },
  onDeviceBadge: {
    backgroundColor: Colors.onDeviceBadge,
  },
  icon: {
    marginRight: 4,
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
    color: Colors.primary,
  },
  onDeviceText: {
    color: Colors.onDeviceText,
  },
});
