import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { BottomTabBlurFade } from './BottomTabBlurFade';
import { FloatingTabBar } from './FloatingTabBar';
import { useTabBarProps } from './tabBarBridge';
import { RecordButton } from '@/components/features/recording/RecordButton';
import { RecordingService } from '@/services/audio';

function useIsRecentsTab() {
  const pathname = usePathname();
  return (
    pathname === '/' ||
    pathname === '/(tabs)' ||
    pathname.endsWith('/index') ||
    pathname.endsWith('/(tabs)/index')
  );
}

function RecentsRecordButton() {
  const router = useRouter();

  const handlePress = useCallback(async () => {
    const granted = await RecordingService.requestPermissions();
    if (!granted) return;
    router.push({ pathname: '/recording/new', params: { targetFolder: 'unlisted' } });
  }, [router]);

  return <RecordButton onPress={handlePress} />;
}

export function TabChromeOverlay() {
  const pathname = usePathname();
  const tabBarProps = useTabBarProps();
  const isRecents = useIsRecentsTab();

  if (pathname.includes('settings')) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.blurLayer} pointerEvents="none">
        <BottomTabBlurFade />
      </View>
      <View style={styles.chromeLayer} pointerEvents="box-none">
        {tabBarProps ? <FloatingTabBar {...tabBarProps} /> : null}
        {isRecents ? <RecentsRecordButton /> : null}
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
