import 'react-native-gesture-handler';
import { useEffect, useMemo } from 'react';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import { installRealtimeTerminalLogs, logger } from '@/utils/logging/logger';
import { checkEnvironment } from '@/utils/environment/environmentCheck';
import { refreshLocalLlmModelStateFromDisk } from '@/services/summarization';
import { NavigatorBottomBlur } from '@/components/navigation/NavigatorBottomBlur';
import { LibraryFabChromeOverlay } from '@/components/navigation/LibraryFabChromeOverlay';
import { ThemeProvider, useResolvedColorScheme, useThemedColors } from '@/theme';
import { iconFonts } from '@/theme/iconFonts';

function RootLayoutContent() {
  const loadRecordings = useRecordingStore((s) => s.loadRecordings);
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

  useEffect(() => {
    if (!iconFontsLoaded) return;

    installRealtimeTerminalLogs();
    logger.info('SYSTEM', 'App startup: loading recordings from storage');
    loadRecordings();

    const runEnvCheck = () => {
      refreshLocalLlmModelStateFromDisk();
      const env = checkEnvironment();
      logger.info('SYSTEM', 'Environment check', {
        hasNative: env.hasNativeModule,
        hasOnDeviceSpeech: env.hasOnDeviceSpeech,
        hasKey: env.hasAssemblyAIKey,
        canLive: env.canLiveTranscribe,
        canRecord: env.canRecord,
        recommended: env.recommendedTranscriptionMode,
      });
      useSettingsStore.getState().applyEnvironmentDefaults(
        env.recommendedTranscriptionMode,
      );
    };

    if (useSettingsStore.persist.hasHydrated()) {
      runEnvCheck();
    } else {
      const unsub = useSettingsStore.persist.onFinishHydration(runEnvCheck);
      return unsub;
    }
  }, [iconFontsLoaded, loadRecordings]);

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
