import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useRecordingStore } from './src/store/useRecordingStore';
import { useSettingsStore } from './src/store/useSettingsStore';
import { installRealtimeTerminalLogs, logger } from './src/utils/logger';
import { checkEnvironment } from './src/utils/environmentCheck';

export default function App() {
  const loadRecordings = useRecordingStore((s) => s.loadRecordings);

  useEffect(() => {
    installRealtimeTerminalLogs();
    logger.info('SYSTEM', 'App startup: loading recordings from storage');
    loadRecordings();

    // Run environment check after the settings store has finished hydrating
    // from AsyncStorage. If already hydrated, run immediately.
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
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
