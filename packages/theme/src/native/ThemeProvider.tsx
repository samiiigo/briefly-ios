import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import * as NavigationBar from 'expo-navigation-bar';
import { isEdgeToEdge } from 'react-native-is-edge-to-edge';
import { darkColors, lightColors, type ColorPalette } from '../colorPalettes';
import { applyColorPalette } from './constants';
import {
  resolveColorScheme,
  type ResolvedColorScheme,
  type ThemePreference,
} from '../themePreference';

type ThemeContextValue = {
  colors: ColorPalette;
  resolvedScheme: ResolvedColorScheme;
  preference: ThemePreference;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  resolvedScheme: 'dark',
  preference: 'system',
});

export function ThemeProvider({
  children,
  preference = 'system',
}: {
  children: ReactNode;
  /** Theme preference from app settings (e.g. zustand store). */
  preference?: ThemePreference;
}) {
  const systemScheme = useColorScheme();
  const resolvedScheme = resolveColorScheme(preference, systemScheme);
  const colors = resolvedScheme === 'light' ? lightColors : darkColors;
  const value = useMemo(
    () => ({ colors, resolvedScheme, preference }),
    [colors, resolvedScheme, preference],
  );
  // Keep legacy `Colors` in sync before children render (useEffect ran one frame late).
  applyColorPalette(resolvedScheme);
  useLayoutEffect(() => {
    Appearance.setColorScheme(preference === 'system' ? null : preference);
  }, [preference]);
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
    if (Platform.OS === 'android' && !isEdgeToEdge()) {
      void NavigationBar.setBackgroundColorAsync(colors.background);
      void NavigationBar.setButtonStyleAsync(resolvedScheme === 'light' ? 'dark' : 'light');
    }
  }, [resolvedScheme, colors.background]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemedColors(): ColorPalette {
  return useContext(ThemeContext).colors;
}

export function useResolvedColorScheme(): ResolvedColorScheme {
  return useContext(ThemeContext).resolvedScheme;
}
