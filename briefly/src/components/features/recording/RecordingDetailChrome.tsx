import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import { AnchoredOverflowMenu } from '@/components/ui/AnchoredOverflowMenu';
import {
  TOP_HEADER_BUTTON_ROW_HEIGHT,
  TOP_HEADER_PADDING_BOTTOM,
  TOP_HEADER_PADDING_TOP,
} from '@/components/navigation/topHeaderMetrics';
import { TopChromeOverlay } from '@/components/navigation/TopChromeOverlay';
import { useCreateStyles, useThemedColors, Spacing, BorderRadius } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

interface HeaderProps {
  onBack: () => void;
  folderLabel: string;
  onShare: () => void;
  shareDisabled?: boolean;
  menuItems: { label: string; onPress: () => void }[];
}

/** Summary screen top bar (Figma mock). */
export function RecordingDetailHeader({
  onBack,
  folderLabel,
  onShare,
  shareDisabled,
  menuItems,
}: HeaderProps) {
  const headerStyles = useCreateStyles(createRecordingDetailHeaderStyles);
  return (
    <TopChromeOverlay>
      <View style={headerStyles.header}>
        <View style={headerStyles.leading}>
          <CircularIconButton
            icon="arrow-back"
            accessibilityLabel="Back"
            onPress={onBack}
            style={headerStyles.backButton}
          />
          <Text style={headerStyles.folderLabel} numberOfLines={1}>
            {folderLabel}
          </Text>
        </View>
        <View style={headerStyles.actions}>
          <CircularIconButton
            icon={shareDisabled ? 'hourglass-outline' : 'share-outline'}
            accessibilityLabel="Share"
            onPress={shareDisabled ? undefined : onShare}
            style={[
              headerStyles.secondaryButton,
              shareDisabled ? headerStyles.shareDisabled : undefined,
            ]}
          />
          <AnchoredOverflowMenu
            items={menuItems}
            renderTrigger={(open) => (
              <CircularIconButton
                icon="ellipsis-horizontal"
                accessibilityLabel="Recording options"
                onPress={open}
                style={headerStyles.secondaryButton}
              />
            )}
          />
        </View>
      </View>
    </TopChromeOverlay>
  );
}

interface ShareFabProps {
  onPress: () => void;
  disabled?: boolean;
}

/** Floating share pill (Figma summary screen). */
export function RecordingShareFab({ onPress, disabled }: ShareFabProps) {
  const fabStyles = useCreateStyles(createRecordingShareFabStyles);
  const colors = useThemedColors();
  return (
    <TouchableOpacity
      style={[fabStyles.button, disabled && fabStyles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Share"
    >
      <Ionicons name="share-outline" size={14} color={colors.textPrimary} />
      <Text style={fabStyles.label}>Share</Text>
    </TouchableOpacity>
  );
}

function createRecordingShareFabStyles(c: ColorPalette) {
  return StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.surfaceElevated,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: { elevation: 6 },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: 0.375,
    color: c.textPrimary,
  },
  });
}

function createRecordingDetailHeaderStyles(c: ColorPalette) {
  return StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: TOP_HEADER_PADDING_TOP,
    paddingBottom: TOP_HEADER_PADDING_BOTTOM,
    minHeight: TOP_HEADER_BUTTON_ROW_HEIGHT + TOP_HEADER_PADDING_TOP + TOP_HEADER_PADDING_BOTTOM,
  },
  leading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    marginRight: Spacing.sm,
  },
  backButton: {
    backgroundColor: c.surface,
    marginRight: Spacing.sm,
  },
  folderLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    color: c.textPrimary,
  },
  actions: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  secondaryButton: {
    backgroundColor: c.headerButtonMuted,
  },
  shareDisabled: {
    opacity: 0.6,
  },
  });
}
