import { StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';

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
    paddingHorizontal: Spacing.md,
    paddingBottom: SCREEN_LIST_BOTTOM_PADDING,
  },
  sectionLabel: withAppFont({
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 16,
    color: Colors.subtext,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  }),
  sectionDescription: withAppFont({
    fontSize: 15,
    lineHeight: 22,
    color: Colors.subtext,
    paddingHorizontal: Spacing.sm,
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
    color: Colors.subtext,
    textAlign: 'center',
    paddingVertical: Spacing.md,
    paddingBottom: SCREEN_LIST_BOTTOM_PADDING,
  }),
});
