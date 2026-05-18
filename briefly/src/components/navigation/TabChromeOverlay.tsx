import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FloatingTabBar } from './FloatingTabBar';
import { useTabBarProps } from './tabBarBridge';
import { tabRouteShowsRecordButton } from './tabChromeRoutes';
import { RecordButton } from '@/components/features/recording/RecordButton';
import { RecordingService } from '@/services/audio';
import { ensureRecordingPrerequisites } from '@/services/audio/recordingSession';
function useActiveTabRouteName(): string | undefined {
  const tabBarProps = useTabBarProps();
  if (!tabBarProps) return undefined;
  return tabBarProps.state.routes[tabBarProps.state.index]?.name;
}

function TabRecordButton() {
  const router = useRouter();

  const handlePress = useCallback(async () => {
    const granted = await RecordingService.requestPermissions();
    if (!granted) return;
    await ensureRecordingPrerequisites();
    router.push({ pathname: '/recording/new', params: { targetFolder: 'unlisted' } });
  }, [router]);

  return <RecordButton onPress={handlePress} />;
}

export function TabChromeOverlay() {
  const tabBarProps = useTabBarProps();
  const activeTabName = useActiveTabRouteName();
  const showsRecordButton = tabRouteShowsRecordButton(activeTabName);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {tabBarProps ? <FloatingTabBar {...tabBarProps} /> : null}
      {showsRecordButton ? <TabRecordButton /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});
