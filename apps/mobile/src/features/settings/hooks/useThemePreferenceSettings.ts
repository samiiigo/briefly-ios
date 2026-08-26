import { useCallback, useMemo } from 'react';
import {
  themePreferenceDescription,
  themePreferenceTitle,
  type ThemePreference,
} from '@briefly/theme/native';
import { useThemePreferenceSlice } from '@/features/settings/hooks/settingsStoreSlices';
export const THEME_PREFERENCE_OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];
export function useThemePreferenceSettings() {
  const { themePreference, setThemePreference } = useThemePreferenceSlice();
  const selectPreference = useCallback(
    (option: ThemePreference) => setThemePreference(option),
    [setThemePreference],
  );
  const options = useMemo(
    () =>
      THEME_PREFERENCE_OPTIONS.map((option) => ({
        option,
        selected: themePreference === option,
        title: themePreferenceTitle(option),
        subtitle: themePreferenceDescription(option),
      })),
    [themePreference],
  );
  return { themePreference, options, selectPreference };
}
