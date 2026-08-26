import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { NavigatorBottomBlur } from '@/navigation/chrome/NavigatorBottomBlur';
import { TabBarPropsReporter } from '@/navigation/tabBar/TabBarPropsReporter';
import { TabChromeOverlay } from '@/navigation/tabBar/TabChromeOverlay';
import { useCreateStyles, useThemedColors } from '@briefly/theme/native';
import type { ColorPalette } from '@briefly/theme';
export default function TabsLayout() {
  const styles = useCreateStyles(createTabsLayoutStyles);
  const colors = useThemedColors();
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarStyle: { display: 'none' as const },
      sceneStyle: { backgroundColor: colors.background },
      animation: 'fade' as const,
    }),
    [colors.background],
  );
  return (
    <View style={styles.root}>
      <Tabs tabBar={(props) => <TabBarPropsReporter {...props} />} screenOptions={screenOptions}>
        <Tabs.Screen name="index" options={{ title: 'Recents' }} />
        <Tabs.Screen name="history" options={{ title: 'Library' }} />
      </Tabs>
      <NavigatorBottomBlur scope="tabs" />
      <TabChromeOverlay />
    </View>
  );
}
function createTabsLayoutStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
  });
}
