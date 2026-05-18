import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { BottomTabBlurFade } from './BottomTabBlurFade';
import { FloatingTabBar } from './FloatingTabBar';
import { Platform } from 'react-native';
import { useTabBarProps } from './tabBarBridge';
import { tabRouteShowsRecordButton } from './tabChromeRoutes';
import { RecordButton } from '@/components/features/recording/RecordButton';
import { RecordingService } from '@/services/audio';
import { ensureRecordingPrerequisites } from '@/services/audio/recordingSession';
import { isAndroid } from '@/utils/platform';

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
    if (isAndroid) {
      await ensureRecordingPrerequisites();
    }
    router.push({ pathname: '/recording/new', params: { targetFolder: 'unlisted' } });
  }, [router]);

  return <RecordButton onPress={handlePress} />;
}

export function TabChromeOverlay() {
  const pathname = usePathname();
  const tabBarProps = useTabBarProps();
  const activeTabName = useActiveTabRouteName();
  const showsRecordButton = tabRouteShowsRecordButton(activeTabName);

  if (pathname.includes('settings') || activeTabName === 'settings') {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {Platform.OS !== 'android' && (
        <View style={styles.blurLayer} pointerEvents="none">
          <BottomTabBlurFade />
        </View>
      )}
      <View style={styles.chromeLayer} pointerEvents="box-none">
        {tabBarProps ? <FloatingTabBar {...tabBarProps} /> : null}
        {showsRecordButton ? <TabRecordButton /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  chromeLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});
