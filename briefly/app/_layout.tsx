import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import { installRealtimeTerminalLogs, logger } from '@/utils/logger';
import { checkEnvironment } from '@/utils/environmentCheck';
import { Colors, installAppFonts } from '@/theme';

installAppFonts();

export default function RootLayout() {
  const loadRecordings = useRecordingStore((s) => s.loadRecordings);

  useEffect(() => {
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="recording" />
          <Stack.Screen name="folder" />
          <Stack.Screen name="transcription-mode" />
          <Stack.Screen name="processing-mode" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
