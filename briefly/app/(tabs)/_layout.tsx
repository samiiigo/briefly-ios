import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
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
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            href: null,
          }}
        />
      </Tabs>
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
