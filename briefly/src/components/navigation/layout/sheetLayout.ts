import { Platform, StyleSheet } from 'react-native';
import { Spacing, BorderRadius, withAppFont } from '@/theme';
import { useCreateStyles } from '@/theme/createStyles';
import type { ColorPalette } from '@/theme/colorPalettes';
function createSheetLayoutStyles(c: ColorPalette) {
  return StyleSheet.create({
    /** Outer shell (shadow only); pairs with {@link sheetPanel}. */
    sheetShell: {
      marginTop: -1,
      borderTopLeftRadius: BorderRadius.cardXL,
      borderTopRightRadius: BorderRadius.cardXL,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 2 },
        },
        android: { elevation: 16 },
      }),
    },
    sheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: BorderRadius.cardXL,
      borderTopRightRadius: BorderRadius.cardXL,
      overflow: 'hidden',
      maxHeight: '92%',
    },
    grabberWrap: {
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 4,
    },
    grabber: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    sheetTitle: withAppFont({
      fontSize: 20,
      fontWeight: '700',
      color: c.textPrimary,
      letterSpacing: -0.3,
    }),
    resetText: withAppFont({
      fontSize: 16,
      fontWeight: '500',
      color: c.primary,
    }),
    scrollContent: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    groupLabel: withAppFont({
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 16,
      color: c.subtext,
      paddingHorizontal: Spacing.sm,
      marginBottom: Spacing.sm,
    }),
    groupLabelSpaced: {
      marginTop: Spacing.lg,
    },
    optionGroup: {
      borderRadius: BorderRadius.cardXL,
      overflow: 'hidden',
      backgroundColor: c.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: Spacing.md,
    },
    optionRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    optionRowSelected: {
      backgroundColor: c.surfaceElevated,
    },
    optionRowDisabled: {
      opacity: 0.45,
    },
    optionLabelCol: {
      flex: 1,
      paddingRight: 12,
    },
    optionLabel: withAppFont({
      fontSize: 17,
      color: c.textPrimary,
      fontWeight: '400',
    }),
    optionLabelSelected: {
      fontWeight: '600',
    },
    optionLabelDisabled: {
      color: c.subtext,
    },
    optionHint: withAppFont({
      marginTop: 4,
      fontSize: 14,
      color: c.subtext,
    }),
    doneBtn: {
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      paddingVertical: 14,
      borderRadius: BorderRadius.cardXL,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.primary,
      alignItems: 'center',
    },
    doneBtnText: withAppFont({
      fontSize: 17,
      fontWeight: '600',
      color: c.primary,
    }),
  });
}
export function useSheetLayoutStyles() {
  return useCreateStyles(createSheetLayoutStyles);
}
