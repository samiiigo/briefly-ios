import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import * as NavigationBar from 'expo-navigation-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import { installRealtimeTerminalLogs, logger } from '@/utils/logging/logger';
import { checkEnvironment } from '@/utils/environment/environmentCheck';
import { Colors, installAppFonts } from '@/theme';

installAppFonts();

export default function RootLayout() {
  const loadRecordings = useRecordingStore((s) => s.loadRecordings);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(Colors.background);
    if (Platform.OS === 'android') {
      void NavigationBar.setBackgroundColorAsync(Colors.background);
      void NavigationBar.setButtonStyleAsync('light');
    }

    installRealtimeTerminalLogs();
    logger.info('SYSTEM', 'App startup: loading recordings from storage');
    loadRecordings();

    const runEnvCheck = () => {
      const env = checkEnvironment();
      logger.info('SYSTEM', 'Environment check', {
        hasNative: env.hasNativeModule,
        hasKey: env.hasAssemblyAIKey,
        canLive: env.canLiveTranscribe,
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
  }, [loadRecordings]);

  return (
    <GestureHandlerRootView style={rootStyles.root}>
      <SafeAreaProvider>
        <View style={rootStyles.root}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: 'slide_from_right',
              ...Platform.select({
                ios: {
                  gestureEnabled: true,
                },
                android: {
                  gestureEnabled: false,
                },
              }),
            }}
          >
            <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
            <Stack.Screen name="recording" />
            <Stack.Screen name="folder" />
            <Stack.Screen name="transcription-mode" />
            <Stack.Screen name="processing-mode" />
            <Stack.Screen name="folder-layout" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const rootStyles = {
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
} as const;
