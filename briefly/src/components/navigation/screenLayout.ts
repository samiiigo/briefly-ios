import { StyleSheet } from 'react-native';
import { BorderRadius, Spacing, withAppFont } from '@/theme';
import { useCreateStyles } from '@/theme/createStyles';
import type { ColorPalette } from '@/theme/colorPalettes';

/** Bottom inset so list content clears the floating tab bar. */
export const SCREEN_LIST_BOTTOM_PADDING = 140;

function createScreenLayoutStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.md,
      paddingBottom: SCREEN_LIST_BOTTOM_PADDING,
    },
    sectionLabel: withAppFont({
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 16,
      color: colors.subtext,
      paddingHorizontal: Spacing.sm,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    }),
    sectionDescription: withAppFont({
      fontSize: 15,
      lineHeight: 22,
      color: colors.subtext,
      paddingHorizontal: Spacing.sm,
      marginBottom: Spacing.md,
    }),
    card: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.cardXL,
      overflow: 'hidden',
    },
    cardDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: Spacing.md + 24 + Spacing.md,
    },
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: 14,
      gap: Spacing.md,
    },
    settingsRowIcon: {
      width: 24,
      textAlign: 'center',
    },
    settingsRowTitle: withAppFont({
      flex: 1,
      fontSize: 17,
      color: colors.textPrimary,
    }),
    settingsRowTitleDanger: {
      color: colors.red,
    },
    settingsRowValue: withAppFont({
      fontSize: 15,
      color: colors.subtext,
      marginRight: 4,
    }),
    listSectionHeader: withAppFont({
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 16,
      color: colors.subtext,
      paddingHorizontal: Spacing.sm,
    }),
    listItemGap: {
      height: 12,
    },
    listSectionGap: {
      height: 8,
    },
    versionText: withAppFont({
      fontSize: 12,
      color: colors.subtext,
      textAlign: 'center',
      paddingVertical: Spacing.md,
      paddingBottom: SCREEN_LIST_BOTTOM_PADDING,
    }),
  });
}

function createModePickerStyles(colors: ColorPalette) {
  return StyleSheet.create({
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      gap: 12,
      minHeight: 72,
    },
    optionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: 16 + 22 + 12,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    radioSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    radioDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.textPrimary,
    },
    optionText: { flex: 1 },
    optionTitle: withAppFont({
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 22,
    }),
    optionSubtitle: withAppFont({
      fontSize: 14,
      color: colors.subtext,
      lineHeight: 20,
      marginTop: 4,
    }),
    optionRowDisabled: {
      opacity: 0.45,
    },
    optionTitleDisabled: {
      color: colors.subtext,
    },
    optionSubtitleDisabled: {
      color: colors.subtext,
    },
    radioDisabled: {
      borderColor: colors.subtext,
    },
    radioSelectedDisabled: {
      borderColor: colors.subtext,
      backgroundColor: colors.subtext,
    },
  });
}

export function useScreenLayoutStyles() {
  return useCreateStyles(createScreenLayoutStyles);
}

export function useModePickerStyles() {
  return useCreateStyles(createModePickerStyles);
}