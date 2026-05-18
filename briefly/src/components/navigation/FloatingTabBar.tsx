import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors, withAppFont } from '@/theme';
import { useFloatingTabBarLayout } from './useFloatingTabBarLayout';
import { TAB_CHROME_MAIN_ROUTES } from './tabChromeRoutes';

type TabConfig = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconFocused: React.ComponentProps<typeof Ionicons>['name'];
};

const TAB_CONFIG: Record<string, TabConfig> = {
  index: { label: 'Recents', icon: 'home-outline', iconFocused: 'home' },
  history: { label: 'Library', icon: 'folder-outline', iconFocused: 'folder' },
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { bottomOffset, horizontalInset, androidTabBarHeight, insetsBottom } = useFloatingTabBarLayout();
  const currentRoute = state.routes[state.index];
  const isAndroid = Platform.OS === 'android';

  if (currentRoute.name === 'settings') {
    return null;
  }

  const visibleRoutes = state.routes.filter((r) => TAB_CHROME_MAIN_ROUTES.has(r.name));

  return (
    <View
      style={[
        styles.wrapper,
        isAndroid
          ? {
              bottom: 0,
              height: androidTabBarHeight,
              paddingBottom: insetsBottom,
              backgroundColor: Colors.card,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: 'rgba(255,255,255,0.05)',
              justifyContent: 'space-around',
              alignItems: 'center',
            }
          : {
              bottom: bottomOffset,
              paddingLeft: horizontalInset,
              justifyContent: 'flex-start',
              alignItems: 'flex-end',
            },
      ]}
      pointerEvents={isAndroid ? 'auto' : 'box-none'}
    >
      <View style={isAndroid ? styles.androidPill : styles.pill}>
        {!isAndroid && Platform.OS === 'ios' && (
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        {!isAndroid && <View style={[StyleSheet.absoluteFill, styles.pillOverlay]} />}
        {visibleRoutes.map((route) => {
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === routeIndex;
          const config = TAB_CONFIG[route.name];
          if (!config) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={[
                isAndroid ? styles.androidTab : styles.tab,
                isFocused && !isAndroid && styles.tabActive
              ]}
              onPress={onPress}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={config.label}
            >
              <Ionicons
                name={isFocused ? config.iconFocused : config.icon}
                size={isAndroid ? 24 : 24}
                color={isFocused ? (isAndroid ? Colors.primary : Colors.primary) : Colors.subtext}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive, isAndroid && { marginTop: 4, fontSize: 11 }]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 10,
    elevation: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(28,28,30,0.92)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  androidPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  pillOverlay: {
    backgroundColor: 'rgba(28,28,30,0.9)',
  },
  tab: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 9999,
  },
  androidTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabActive: {
    backgroundColor: Colors.surfaceElevated,
  },
  tabLabel: withAppFont({
    fontSize: 10,
    fontWeight: '500',
    color: Colors.subtext,
    marginTop: 2,
  }),
  tabLabelActive: {
    color: Colors.primary,
  },
});
