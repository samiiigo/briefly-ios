import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { RecentsEntryCard } from '@/components/features/recents/RecentsEntryCard';
import { RecordingCard } from '@/components/features/recording/RecordingCard';
import { RecordingSwipeableRow } from '@/components/features/recording/RecordingSwipeableRow';
import { RecordingSectionFlashList } from '@/components/features/recording/RecordingSectionFlashList';
import { RecordingGridFlashList } from '@/components/features/recording/RecordingGridFlashList';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import { FolderViewOptionsSheet } from '@/components/features/library/FolderViewOptionsSheet';
import { StackScreenHeader } from '@/components/navigation/header/StackScreenHeader';
import { useTopChromeLayout } from '@/components/navigation/layout/useTopChromeLayout';
import { useScreenLayoutStyles } from '@/components/navigation/layout/screenLayout';
import { useFolderRecordingsScreen } from '@/hooks/library/useFolderRecordingsScreen';
import { Colors, Spacing, withAppFont, useThemedColors } from '@/theme';

const LIST_BOTTOM_PADDING = 140;

export default function FolderRecordingsScreen() {
  const sl = useScreenLayoutStyles();
  const colors = useThemedColors();
  const { scrollPaddingTop } = useTopChromeLayout();
  const params = useLocalSearchParams<{ id: string; folderName?: string; folderType?: string }>();
  const {
    folderName,
    folderId,
    folderType,
    folderKey,
    isRecentlyDeleted,
    sections,
    flatData,
    listEmpty,
    effectiveLayout,
    viewSheetVisible,
    setViewSheetVisible,
    renderListCard,
    renderGridCard,
    handleDeleteAll,
    closeOpenSwipe,
    goBack,
  } = useFolderRecordingsScreen({
    folderId: params.id!,
    folderName: params.folderName,
    folderType: params.folderType,
  });

  useFocusEffect(
    useCallback(() => {
      return () => closeOpenSwipe();
    }, [closeOpenSwipe]),
  );

  const renderListRow = useCallback(
    (item: Parameters<typeof renderListCard>[0], groupPosition: Parameters<typeof renderListCard>[1]) => {
      const row = renderListCard(item, groupPosition);
      return (
        <RecordingSwipeableRow {...row}>
          <RecentsEntryCard recording={item} groupPosition={groupPosition} />
        </RecordingSwipeableRow>
      );
    },
    [renderListCard],
  );

  const renderGridItem = useCallback(
    (item: Parameters<typeof renderGridCard>[0]) => {
      const row = renderGridCard(item, true);
      return (
        <RecordingSwipeableRow {...row}>
          <RecordingCard recording={item} compact />
        </RecordingSwipeableRow>
      );
    },
    [renderGridCard],
  );

  return (
    <View style={sl.container}>
      {listEmpty ? (
        <View style={[styles.emptyWrap, { paddingTop: scrollPaddingTop }]}>
          <Text style={styles.emptyText}>No recordings match this view.</Text>
        </View>
      ) : effectiveLayout === 'grid' ? (
        <RecordingGridFlashList
          data={flatData}
          renderItem={renderGridItem}
          contentContainerStyle={[styles.listContent, { paddingTop: scrollPaddingTop }]}
          onScrollBeginDrag={closeOpenSwipe}
          onMomentumScrollBegin={closeOpenSwipe}
        />
      ) : (
        <RecordingSectionFlashList
          sections={sections}
          renderRecording={renderListRow}
          sectionHeaderStyle={sl.listSectionHeader}
          contentContainerStyle={[styles.listContent, { paddingTop: scrollPaddingTop }]}
          onScrollBeginDrag={closeOpenSwipe}
          onMomentumScrollBegin={closeOpenSwipe}
        />
      )}
      {!isRecentlyDeleted ? (
        <FolderViewOptionsSheet
          visible={viewSheetVisible}
          folderKey={folderKey}
          folderId={folderId}
          folderType={folderType}
          onClose={() => setViewSheetVisible(false)}
        />
      ) : null}
      <StackScreenHeader
        title={folderName}
        showBack
        onBack={goBack}
        trailing={
          isRecentlyDeleted ? (
            <Pressable
              onPress={handleDeleteAll}
              disabled={listEmpty}
              accessibilityLabel="Delete all"
              accessibilityRole="button"
              hitSlop={8}
              style={({ pressed }) => [
                styles.deleteAllBtn,
                listEmpty && styles.deleteAllBtnDisabled,
                pressed && !listEmpty && styles.deleteAllBtnPressed,
              ]}
            >
              <Text
                style={[
                  styles.deleteAllText,
                  { color: colors.danger },
                  listEmpty && styles.deleteAllTextDisabled,
                ]}
              >
                Delete All
              </Text>
            </Pressable>
          ) : (
            <CircularIconButton
              icon="funnel-outline"
              accessibilityLabel="Filters"
              onPress={() => setViewSheetVisible(true)}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: LIST_BOTTOM_PADDING,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: LIST_BOTTOM_PADDING,
  },
  emptyText: withAppFont({
    fontSize: 15,
    fontWeight: '500',
    color: Colors.subtext,
    textAlign: 'center',
  }),
  deleteAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  deleteAllBtnPressed: {
    opacity: 0.7,
  },
  deleteAllBtnDisabled: {
    opacity: 0.35,
  },
  deleteAllText: withAppFont({
    fontSize: 17,
    fontWeight: '600',
  }),
  deleteAllTextDisabled: {
    opacity: 0.5,
  },
});
