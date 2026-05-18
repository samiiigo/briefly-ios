import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useActiveSwipeableStore } from '@/context/useActiveSwipeableStore';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import {
  TOP_HEADER_BUTTON_ROW_HEIGHT,
  TOP_HEADER_PADDING_BOTTOM,
  TOP_HEADER_PADDING_TOP,
} from '@/components/navigation/topHeaderMetrics';
import { TopChromeOverlay } from '@/components/navigation/TopChromeOverlay';
import { Colors, Spacing, withAppFont } from '@/theme';

export function RecentsHeader() {
  const router = useRouter();

  return (
    <TopChromeOverlay>
      <View style={styles.header}>
        <Text style={styles.title}>Briefly</Text>
        <View style={styles.actions}>
          <CircularIconButton
            icon="settings-outline"
            accessibilityLabel="Settings"
            onPress={() => {
              useActiveSwipeableStore.getState().closeActive();
              router.push('/settings');
            }}
          />
          <CircularIconButton
            icon="search"
            accessibilityLabel="Search"
            onPress={() => {
              useActiveSwipeableStore.getState().closeActive();
              router.push('/search');
            }}
          />
        </View>
      </View>
    </TopChromeOverlay>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: TOP_HEADER_PADDING_TOP,
    paddingBottom: TOP_HEADER_PADDING_BOTTOM,
    minHeight: TOP_HEADER_BUTTON_ROW_HEIGHT + TOP_HEADER_PADDING_TOP + TOP_HEADER_PADDING_BOTTOM,
  },
  title: withAppFont({
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  }),
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
});
