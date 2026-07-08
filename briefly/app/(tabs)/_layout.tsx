import { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon as NativeIcon, Label as NativeLabel } from 'expo-router/unstable-native-tabs';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { SymbolView } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';
import { NavigatorBottomBlur } from '@/components/navigation/chrome/NavigatorBottomBlur';
import { useCreateStyles, useThemedColors, useResolvedColorScheme } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeLabel>Recents</NativeLabel>
        <NativeIcon sf={{ default: 'clock', selected: 'clock.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <NativeLabel>Library</NativeLabel>
        <NativeIcon sf={{ default: 'folder', selected: 'folder.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const styles = useCreateStyles(createTabsLayoutStyles);
  const colors = useThemedColors();
  const resolvedScheme = useResolvedColorScheme();

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      sceneStyle: { backgroundColor: colors.background },
      animation: 'fade' as const,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.subtext,
      tabBarStyle: Platform.select({
        ios: {
          position: 'absolute' as const,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
        },
        default: {
          backgroundColor: colors.card,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 8,
        },
      }),
      tabBarBackground: Platform.OS === 'ios'
        ? () => (
            <BlurView
              tint={resolvedScheme === 'dark' ? 'dark' : 'light'}
              intensity={80}
              style={StyleSheet.absoluteFill}
            />
          )
        : undefined,
    }),
    [colors.background, colors.card, colors.border, colors.primary, colors.subtext, resolvedScheme],
  );

  return (
    <View style={styles.root}>
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Recents',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'time' : 'time-outline'}
                size={size || 24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'library' : 'library-outline'}
                size={size || 24}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
      <NavigatorBottomBlur scope="tabs" />
    </View>
  );
}

export default function TabsLayout() {
  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

function createTabsLayoutStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
  });
}
