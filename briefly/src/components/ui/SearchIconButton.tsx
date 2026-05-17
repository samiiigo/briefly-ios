import React from 'react';
import { CircularIconButton } from '@/components/ui/CircularIconButton';

interface SearchIconButtonProps {
  onPress?: () => void;
}

/** @deprecated Prefer {@link CircularIconButton} with `icon="search"` directly. */
export function SearchIconButton({ onPress }: SearchIconButtonProps) {
  return (
    <CircularIconButton
      icon="search"
      accessibilityLabel="Search"
      onPress={onPress}
    />
  );
}
