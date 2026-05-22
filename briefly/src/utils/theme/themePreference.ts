export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedColorScheme = 'dark' | 'light';
export function themePreferenceTitle(preference: ThemePreference): string {
  switch (preference) {
    case 'dark':
      return 'Dark';
    case 'light':
      return 'Light';
    case 'system':
      return 'System';
  }
}
export function themePreferenceDescription(preference: ThemePreference): string {
  switch (preference) {
    case 'dark':
      return 'Always use dark appearance.';
    case 'light':
      return 'Always use light appearance.';
    case 'system':
      return 'Match your device light or dark mode.';
  }
}
export function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: ResolvedColorScheme | null | undefined,
): ResolvedColorScheme {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return systemScheme === 'light' ? 'light' : 'dark';
}
