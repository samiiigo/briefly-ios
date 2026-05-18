import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { NavigatorBottomBlur } from '@/components/navigation/NavigatorBottomBlur';
import { TabBarPropsReporter } from '@/components/navigation/TabBarPropsReporter';
import { TabChromeOverlay } from '@/components/navigation/TabChromeOverlay';
import { Colors } from '@/theme';

export default function TabsLayout() {
  return (
    <View style={styles.root}>
      <Tabs
        tabBar={(props) => <TabBarPropsReporter {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          sceneStyle: { backgroundColor: Colors.background },
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
