import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useActiveSwipeableStore } from '@/store/useActiveSwipeableStore';
import { CircularIconButton } from '@briefly/ui/native';
import {
  TOP_HEADER_BUTTON_ROW_HEIGHT,
  TOP_HEADER_PADDING_BOTTOM,
  TOP_HEADER_PADDING_TOP,
} from '@/navigation/layout/topHeaderMetrics';
import { TopChromeOverlay } from '@/navigation/chrome/TopChromeOverlay';
import { openSettingsRoot } from '@/navigation/layout/useStackBack';
import { useCreateStyles, Spacing, withAppFont } from '@briefly/theme/native';
import type { ColorPalette } from '@briefly/theme';
export function RecentsHeader() {
  const styles = useCreateStyles(createRecentsHeaderStyles);
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
              openSettingsRoot();
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
function createRecentsHeaderStyles(c: ColorPalette) {
  return StyleSheet.create({
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
      color: c.textPrimary,
      letterSpacing: -0.5,
    }),
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
  });
}
