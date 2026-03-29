import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useRecordingStore } from './src/store/useRecordingStore';
import { installRealtimeTerminalLogs, logger } from './src/utils/logger';

export default function App() {
  const loadRecordings = useRecordingStore((s) => s.loadRecordings);

  useEffect(() => {
    installRealtimeTerminalLogs();
    logger.info('SYSTEM', 'App startup: loading recordings from storage');
    loadRecordings();
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
