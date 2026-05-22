import 'react-native-gesture-handler';
import { useEffect, useMemo } from 'react';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useAppBootstrap } from '@/hooks/app/useAppBootstrap';
import { NavigatorBottomBlur } from '@/components/navigation/chrome/NavigatorBottomBlur';
import { LibraryFabChromeOverlay } from '@/components/navigation/overlays/LibraryFabChromeOverlay';
import { ThemeProvider, useResolvedColorScheme, useThemedColors } from '@/theme';
import { iconFonts } from '@/theme/iconFonts';
import { logger } from '@/utils/logging/logger';

function RootLayoutContent() {
  const colors = useThemedColors();
  const resolvedScheme = useResolvedColorScheme();
  const [iconFontsLoaded, iconFontError] = useFonts(iconFonts);
  const stackScreenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
      animation: 'slide_from_right' as const,
      ...Platform.select({
        ios: { gestureEnabled: true },
        android: { gestureEnabled: false },
      }),
    }),
    [colors.background],
  );

  useEffect(() => {
    if (iconFontError) {
      logger.error('SYSTEM', 'Failed to load Ionicons font', {
        message: iconFontError.message,
      });
    }
  }, [iconFontError]);

  useAppBootstrap(iconFontsLoaded);

  const rootStyle = useRootBackgroundStyle();

  if (!iconFontsLoaded) {
    return <View style={rootStyle} />;
  }

  return (
    <GestureHandlerRootView style={rootStyle}>
      <SafeAreaProvider>
        <View style={rootStyle}>
          <StatusBar style={resolvedScheme === 'light' ? 'dark' : 'light'} />
          <Stack screenOptions={stackScreenOptions}>
            <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
            <Stack.Screen name="search" options={{ animation: 'fade' }} />
            <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
          </Stack>
          <NavigatorBottomBlur scope="root" />
          <LibraryFabChromeOverlay />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

export default RootLayout;

function useRootBackgroundStyle() {
  const colors = useThemedColors();
  return useMemo(
    () => ({ flex: 1 as const, backgroundColor: colors.background }),
    [colors.background],
  );
}
