import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { NavigatorBottomBlur } from '@/components/navigation/NavigatorBottomBlur';
import { TabBarPropsReporter } from '@/components/navigation/TabBarPropsReporter';
import { TabChromeOverlay } from '@/components/navigation/TabChromeOverlay';
import { useCreateStyles, useThemedColors } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

export default function TabsLayout() {
  const styles = useCreateStyles(createTabsLayoutStyles);
  const colors = useThemedColors();

  return (
    <View style={styles.root}>
      <Tabs
        tabBar={(props) => <TabBarPropsReporter {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          sceneStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
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
