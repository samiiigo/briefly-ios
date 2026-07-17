import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getSettingsHeaderTopInset,
  getSettingsScrollPaddingTop,
  getSettingsTopChromeFadeHeight,
  SETTINGS_TOP_HEADER_BODY_HEIGHT,
} from './settingsTopHeaderMetrics';

export function useSettingsTopChromeLayout() {
  const insets = useSafeAreaInsets();
  const topInset = getSettingsHeaderTopInset(insets.top);

  return {
    topInset,
    chromeHeight: topInset + SETTINGS_TOP_HEADER_BODY_HEIGHT,
    blurFadeHeight: getSettingsTopChromeFadeHeight(insets.top),
    scrollPaddingTop: getSettingsScrollPaddingTop(insets.top),
  };
}
