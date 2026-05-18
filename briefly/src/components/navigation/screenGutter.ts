import { StyleSheet } from 'react-native';
import { Spacing } from '@/theme';

/**
 * App-wide horizontal inset from the screen edge.
 * Use for headers, scroll/list content, floating tab bar, and record FAB alignment.
 */
export const SCREEN_HORIZONTAL_GUTTER = Spacing.screenHorizontal;

export const screenGutterStyles = StyleSheet.create({
  /** ScrollView / FlashList `contentContainerStyle` horizontal inset. */
  scrollContent: {
    paddingHorizontal: SCREEN_HORIZONTAL_GUTTER,
  },
  /** Top chrome header rows (Recents, Library, stack screens). */
  headerRow: {
    paddingHorizontal: SCREEN_HORIZONTAL_GUTTER,
  },
});
