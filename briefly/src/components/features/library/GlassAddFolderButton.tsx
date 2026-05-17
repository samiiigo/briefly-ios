import React from 'react';
import { CircularIconButton } from '@/components/ui/CircularIconButton';

interface Props {
  onPress: () => void;
}

/** Library header add-folder control (uses shared circular button chrome). */
export function GlassAddFolderButton({ onPress }: Props) {
  return (
    <CircularIconButton icon="add" accessibilityLabel="New folder" onPress={onPress} />
  );
}

/** @deprecated Use {@link CircularIconButton} instead. */
export function GlassCircleIconButton({
  ionIcon,
  onPress,
  accessibilityLabel,
}: {
  ionIcon: React.ComponentProps<typeof CircularIconButton>['icon'];
  onPress?: () => void;
  accessibilityLabel: string;
}) {
  return (
    <CircularIconButton
      icon={ionIcon}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    />
  );
}
