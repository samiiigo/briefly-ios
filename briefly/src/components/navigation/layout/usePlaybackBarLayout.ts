import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '@/theme';
/** Collapsed playback pill height (44px control + vertical padding). */
export const PLAYBACK_PILL_HEIGHT = 56;
/** Fade band above the playback pill where blur ramps up. */
export const PLAYBACK_BLUR_FADE_EXTENSION = 56;
export function usePlaybackBarLayout() {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 12) + Spacing.sm;
  const blurFadeHeight =
    paddingBottom + PLAYBACK_PILL_HEIGHT + PLAYBACK_BLUR_FADE_EXTENSION;
  return {
    paddingBottom,
    blurFadeHeight,
  };
}
