import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { RecentsEntryCard } from '@/features/library/components/recents/RecentsEntryCard';
import { RecordingCard } from '@/features/recording/components/RecordingCard';
import { RecordingSwipeableRow } from '@/features/recording/components/RecordingSwipeableRow';
import { RecordingSectionFlashList } from '@/features/recording/components/RecordingSectionFlashList';
import { RecordingGridFlashList } from '@/features/recording/components/RecordingGridFlashList';
import { CircularIconButton } from '@briefly/ui/native';
import { FolderViewOptionsSheet } from '@/features/library/components/FolderViewOptionsSheet';
import { StackScreenHeader } from '@/navigation/header/StackScreenHeader';
import { useTopChromeLayout } from '@/navigation/layout/useTopChromeLayout';
import { useScreenLayoutStyles } from '@/navigation/layout/screenLayout';
import { useFolderRecordingsScreen } from '@/features/library/hooks/useFolderRecordingsScreen';
import { Colors, Spacing, withAppFont, useThemedColors } from '@briefly/theme/native';

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
    (
      item: Parameters<typeof renderListCard>[0],
      groupPosition: Parameters<typeof renderListCard>[1],
    ) => {
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
