import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SEARCH_ICON_COLOR = 'rgba(255,255,255,0.7)';
const SEARCH_ICON_SIZE = 20;

interface SearchIconButtonProps {
  onPress?: () => void;
}

export function SearchIconButton({ onPress }: SearchIconButtonProps) {
  return (
    <TouchableOpacity style={styles.searchIcon} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="search" size={SEARCH_ICON_SIZE} color={SEARCH_ICON_COLOR} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  searchIcon: {
    padding: 4,
  },
});
