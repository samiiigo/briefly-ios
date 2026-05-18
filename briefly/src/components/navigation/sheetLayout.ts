import { Platform, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';

/** Shared bottom-sheet chrome aligned with Recents cards and section labels. */
export const sheetLayoutStyles = StyleSheet.create({
  /** @deprecated Use {@link SheetModal} — backdrop tint must not share a slide transition with the sheet. */
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
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
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.border,
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
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  }),
  resetText: withAppFont({
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  }),
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  groupLabel: withAppFont({
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 16,
    color: Colors.subtext,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  }),
  groupLabelSpaced: {
    marginTop: Spacing.lg,
  },
  optionGroup: {
    borderRadius: BorderRadius.cardXL,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
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
    borderBottomColor: Colors.border,
  },
  optionRowSelected: {
    backgroundColor: Colors.surfaceElevated,
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
    color: Colors.textPrimary,
    fontWeight: '400',
  }),
  optionLabelSelected: {
    fontWeight: '600',
  },
  optionLabelDisabled: {
    color: Colors.subtext,
  },
  optionHint: withAppFont({
    marginTop: 4,
    fontSize: 14,
    color: Colors.subtext,
  }),
  doneBtn: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingVertical: 14,
    borderRadius: BorderRadius.cardXL,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  doneBtnText: withAppFont({
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  }),
});

/** Ionicons checkmark tint for selected sheet rows. */
export const SHEET_CHECKMARK_COLOR = Colors.textPrimary;
