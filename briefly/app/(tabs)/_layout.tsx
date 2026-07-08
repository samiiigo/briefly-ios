import { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon as NativeIcon, Label as NativeLabel } from 'expo-router/unstable-native-tabs';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { SymbolView } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';
import { NavigatorBottomBlur } from '@/components/navigation/chrome/NavigatorBottomBlur';
import { FloatingTabBar } from '@/components/navigation/tabBar/FloatingTabBar';
import { useCreateStyles, useThemedColors, useResolvedColorScheme, Spacing } from '@/theme';
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
          left: Spacing.screenHorizontal || 20,
          right: 'auto' as const,
          width: 'auto' as const,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          borderRadius: 9999,
          overflow: 'hidden' as const,
          flexDirection: 'row' as const,
          justifyContent: 'flex-start' as const,
          alignSelf: 'flex-start' as const,
        },
        default: {
          backgroundColor: colors.card,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 8,
          flexDirection: 'row' as const,
          justifyContent: 'flex-start' as const,
        },
      }),
      tabBarItemStyle: Platform.select({
        ios: {
          flex: 0 as const,
          width: 'auto' as const,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.xs,
        },
        default: {
          flex: 0 as const,
          width: 'auto' as const,
          paddingHorizontal: Spacing.lg,
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
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={screenOptions}
      >
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
