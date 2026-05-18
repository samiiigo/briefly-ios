import { StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';
import { SCREEN_HORIZONTAL_GUTTER } from './screenGutter';

export { SCREEN_HORIZONTAL_GUTTER, screenGutterStyles } from './screenGutter';

/** Bottom inset so list content clears the floating tab bar. */
export const SCREEN_LIST_BOTTOM_PADDING = 140;

export const screenLayoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    paddingHorizontal: SCREEN_HORIZONTAL_GUTTER,
    paddingBottom: SCREEN_LIST_BOTTOM_PADDING,
  },
  sectionLabel: withAppFont({
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 16,
    color: Colors.subtext,
    paddingHorizontal: 0,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  }),
  sectionDescription: withAppFont({
    fontSize: 15,
    lineHeight: 22,
    color: Colors.subtext,
    paddingHorizontal: 0,
    marginBottom: Spacing.md,
  }),
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
    overflow: 'hidden',
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
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
    color: Colors.textPrimary,
  }),
  settingsRowTitleDanger: {
    color: Colors.red,
  },
  settingsRowValue: withAppFont({
    fontSize: 15,
    color: Colors.subtext,
    marginRight: 4,
  }),
  listSectionHeader: withAppFont({
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 16,
    color: Colors.subtext,
    paddingHorizontal: 0,
  }),
  listItemGap: {
    height: 12,
  },
  listSectionGap: {
    height: 8,
  },
  versionText: withAppFont({
    fontSize: 12,
    color: Colors.subtext,
    textAlign: 'center',
    paddingVertical: Spacing.md,
    paddingBottom: SCREEN_LIST_BOTTOM_PADDING,
  }),
});

/** Radio rows for mode / layout picker screens (transcription, summarization, folder layout). */
export const modePickerStyles = StyleSheet.create({
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
    backgroundColor: Colors.border,
    marginLeft: 16 + 22 + 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textPrimary,
  },
  optionText: { flex: 1 },
  optionTitle: withAppFont({
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
  }),
  optionSubtitle: withAppFont({
    fontSize: 14,
    color: Colors.subtext,
    lineHeight: 20,
    marginTop: 4,
  }),
});
