import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { RecentsHeader } from '@/components/features/recents/RecentsHeader';
import { useTopChromeLayout } from '@/components/navigation/layout/useTopChromeLayout';
import {
  RECORD_BUTTON_SIZE,
  useFloatingTabBarLayout,
} from '@/components/navigation/layout/useFloatingTabBarLayout';
import { RecentsEntryCard } from '@/components/features/recents/RecentsEntryCard';
import { RecordingSwipeableRow } from '@/components/features/recording/RecordingSwipeableRow';
import { RecordingSectionFlashList } from '@/components/features/recording/RecordingSectionFlashList';
import { useRecentsScreen } from '@/hooks/library/useRecentsScreen';
import { useCreateStyles, useThemedColors, Spacing, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

const LIST_BOTTOM_PADDING = 140;

export default function HomeScreen() {
  const styles = useCreateStyles(createHomeScreenStyles);
  const colors = useThemedColors();
  const { scrollPaddingTop } = useTopChromeLayout();
  const { recordButtonBottom, horizontalInset } = useFloatingTabBarLayout();
  const { sections, isEmpty, renderRecording, closeOpenSwipe } = useRecentsScreen();

  useFocusEffect(
    React.useCallback(() => {
      return () => closeOpenSwipe();
    }, [closeOpenSwipe]),
  );

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <View style={[styles.emptyState, { paddingTop: scrollPaddingTop }]}>
          <View style={styles.emptyIconRing}>
            <View style={styles.emptyIconInner}>
              <Ionicons name="mic" size={40} color={colors.subtext} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>No recordings yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the record button to capture your first transcript and summary.
          </Text>
        </View>
        <View
          style={[
            styles.recordHint,
            {
              right: horizontalInset + RECORD_BUTTON_SIZE / 2 + 8,
              bottom: recordButtonBottom + RECORD_BUTTON_SIZE + 12,
            },
          ]}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={styles.recordHintText}>Start recording</Text>
          <Ionicons
            name="arrow-down"
            size={28}
            color={colors.primary}
            style={styles.recordHintArrow}
          />
        </View>
        <RecentsHeader />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RecordingSectionFlashList
        sections={sections}
        renderRecording={(item, groupPosition) => {
          const row = renderRecording(item, groupPosition);
          return (
            <RecordingSwipeableRow
              recording={row.recording}
              onPress={row.onPress}
              onDelete={row.onDelete}
              onRename={row.onRename}
            >
              <RecentsEntryCard recording={item} groupPosition={groupPosition} />
            </RecordingSwipeableRow>
          );
        }}
        sectionHeaderStyle={styles.sectionHeader}
        contentContainerStyle={[styles.listContent, { paddingTop: scrollPaddingTop }]}
        onScrollBeginDrag={closeOpenSwipe}
        onMomentumScrollBegin={closeOpenSwipe}
      />
      <RecentsHeader />
    </View>
  );
}

function createHomeScreenStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    listContent: {
      paddingHorizontal: Spacing.md,
      paddingBottom: LIST_BOTTOM_PADDING,
    },
    sectionHeader: withAppFont({
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 16,
      color: c.subtext,
      marginBottom: 0,
      paddingHorizontal: Spacing.sm,
    }),
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      paddingBottom: LIST_BOTTOM_PADDING,
    },
    emptyIconRing: {
      width: 160,
      height: 160,
      borderRadius: 80,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
    },
    emptyIconInner: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: withAppFont({
      fontSize: 22,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: Spacing.sm,
    }),
    emptySubtitle: withAppFont({
      fontSize: 15,
      color: c.subtext,
      textAlign: 'center',
      lineHeight: 22,
    }),
    recordHint: {
      position: 'absolute',
      alignItems: 'flex-end',
      gap: 4,
      zIndex: 5,
    },
    recordHintText: withAppFont({
      fontSize: 14,
      fontWeight: '600',
      color: c.primary,
    }),
    recordHintArrow: {
      transform: [{ rotate: '-45deg' }],
    },
  });
}
