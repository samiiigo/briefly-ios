import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useActiveSwipeableStore } from '@/context/useActiveSwipeableStore';
import { useRecordingStore } from '@/context/useRecordingStore';
import { RecentsHeader } from '@/components/features/recents/RecentsHeader';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import {
  RECORD_BUTTON_SIZE,
  useFloatingTabBarLayout,
} from '@/components/navigation/useFloatingTabBarLayout';
import { RecentsEntryCard } from '@/components/features/recents/RecentsEntryCard';
import { RecordingSwipeableRow } from '@/components/features/recording/RecordingSwipeableRow';
import { RecordingSectionFlashList } from '@/components/features/recording/RecordingSectionFlashList';
import { Recording } from '@/types';
import {
  ensureUniqueTitle,
  groupRecordingsByTime,
  formatRecentsGroupLabel,
} from '@/utils';
import { resolveRecordingFolder } from '@/utils/folders/recordingFolder';
import { Colors, Spacing, withAppFont } from '@/theme';

const LIST_BOTTOM_PADDING = 140;

export default function HomeScreen() {
  const { scrollPaddingTop } = useTopChromeLayout();
  const { recordButtonBottom, horizontalInset } = useFloatingTabBarLayout();
  const router = useRouter();
  const recordings = useRecordingStore((s) => s.recordings);
  const loadRecordings = useRecordingStore((s) => s.loadRecordings);
  const deleteRecording = useRecordingStore((s) => s.deleteRecording);
  const updateRecording = useRecordingStore((s) => s.updateRecording);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => clearInterval(intervalId);
  }, []);

  const handleRename = useCallback(
    async (recording: Recording, newTitle: string) => {
      const existingTitles = recordings
        .filter((r) => r.id !== recording.id)
        .map((r) => r.title);
      try {
        await updateRecording(recording.id, {
          title: ensureUniqueTitle(newTitle, existingTitles),
        });
      } catch (err) {
        console.error('Failed to rename recording:', err);
      }
    },
    [recordings, updateRecording]
  );

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const visibleRecordings = useMemo(
    () =>
      recordings.filter(
        (r) => r.deletedAt == null && resolveRecordingFolder(r) !== 'archived'
      ),
    [recordings]
  );

  const sections = useMemo(() => {
    void now;
    return groupRecordingsByTime(visibleRecordings, formatRecentsGroupLabel);
  }, [visibleRecordings, now]);

  const closeOpenSwipe = useCallback(() => {
    useActiveSwipeableStore.getState().closeActive();
  }, []);

  const renderRecording = useCallback(
    (item: Recording) => (
      <RecordingSwipeableRow
        recording={item}
        onPress={() => router.push(`/recording/${item.id}`)}
        onDelete={() => deleteRecording(item.id)}
      >
        <RecentsEntryCard
          recording={item}
          onPress={() => router.push(`/recording/${item.id}`)}
          onDelete={() => deleteRecording(item.id)}
          onRename={(newTitle) => handleRename(item, newTitle)}
        />
      </RecordingSwipeableRow>
    ),
    [router, deleteRecording, handleRename],
  );

  useFocusEffect(
    useCallback(() => {
      return () => closeOpenSwipe();
    }, [closeOpenSwipe])
  );

  if (visibleRecordings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.emptyState, { paddingTop: scrollPaddingTop }]}>
          <View style={styles.emptyIconRing}>
            <View style={styles.emptyIconInner}>
              <Ionicons name="mic" size={40} color={Colors.subtext} />
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
            color={Colors.primary}
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
        renderRecording={renderRecording}
        sectionHeaderStyle={styles.sectionHeader}
        contentContainerStyle={[styles.listContent, { paddingTop: scrollPaddingTop }]}
        onScrollBeginDrag={closeOpenSwipe}
        onMomentumScrollBegin={closeOpenSwipe}
      />

      <RecentsHeader />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: LIST_BOTTOM_PADDING,
  },
  sectionHeader: withAppFont({
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 16,
    color: Colors.subtext,
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
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyIconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: withAppFont({
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  }),
  emptySubtitle: withAppFont({
    fontSize: 15,
    color: Colors.subtext,
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
    color: Colors.primary,
  }),
  recordHintArrow: {
    transform: [{ rotate: '-45deg' }],
  },
});
