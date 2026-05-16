import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useActiveSwipeableStore } from '@/context/useActiveSwipeableStore';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import { Colors, Spacing, withAppFont } from '@/theme';

export function RecentsHeader() {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Briefly</Text>
      <View style={styles.actions}>
        <CircularIconButton
          icon="settings-outline"
          accessibilityLabel="Settings"
          onPress={() => {
            useActiveSwipeableStore.getState().closeActive();
            router.push('/(tabs)/settings');
          }}
        />
        <CircularIconButton icon="search" accessibilityLabel="Search" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
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
