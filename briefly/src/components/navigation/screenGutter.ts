import { StyleSheet } from 'react-native';
import { Spacing } from '@/theme';

/**
 * App-wide horizontal inset from the screen edge.
 * Use for headers, scroll/list content, floating tab bar, and record FAB alignment.
 */
export const SCREEN_HORIZONTAL_GUTTER = Spacing.screenHorizontal;

/** Extra inset for screen titles, section labels, and trailing header controls. */
export const CHROME_LABEL_OFFSET = Spacing.xs;

/** Gutter + label offset — aligns tab pill and record FAB with header title/actions. */
export const BOTTOM_CHROME_HORIZONTAL_INSET =
  SCREEN_HORIZONTAL_GUTTER + CHROME_LABEL_OFFSET;

export const screenGutterStyles = StyleSheet.create({
  /** ScrollView / FlashList `contentContainerStyle` horizontal inset. */
  scrollContent: {
    paddingHorizontal: SCREEN_HORIZONTAL_GUTTER,
  },
  /** Top chrome header rows (Recents, Library, stack screens). */
  headerRow: {
    paddingHorizontal: SCREEN_HORIZONTAL_GUTTER,
  },
  /** Large titles and header row labels (e.g. Briefly, Library). */
  headerTitle: {
    marginLeft: CHROME_LABEL_OFFSET,
  },
  /** Trailing icon buttons (search, settings, close, etc.). */
  headerActions: {
    marginRight: CHROME_LABEL_OFFSET,
  },
  /** List / settings section labels (Recent Searches, Folders, etc.). */
  sectionLabel: {
    marginLeft: CHROME_LABEL_OFFSET,
  },
  /** Trailing section actions (Clear All, See all). */
  sectionTrailing: {
    marginRight: CHROME_LABEL_OFFSET,
  },
});
