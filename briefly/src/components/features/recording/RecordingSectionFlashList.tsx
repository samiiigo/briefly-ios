import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { Recording } from '@/types';
import {
  flattenRecordingSections,
  RECORDING_LIST_HEADER_GAP,
  RECORDING_LIST_ITEM_GAP,
  type FlatRecordingListItem,
} from '@/utils/list/flattenRecordingSections';

interface RecordingSectionFlashListProps {
  sections: ReadonlyArray<{ title: string; data: Recording[] }>;
  renderRecording: (recording: Recording) => React.ReactElement;
  contentContainerStyle?: StyleProp<ViewStyle>;
  sectionHeaderStyle?: StyleProp<TextStyle>;
  onScrollBeginDrag?: () => void;
  onMomentumScrollBegin?: () => void;
  drawDistance?: number;
}

function ListSeparator({
  leadingItem,
  trailingItem,
}: {
  leadingItem?: FlatRecordingListItem;
  trailingItem?: FlatRecordingListItem;
}) {
  if (leadingItem?.kind === 'header' && trailingItem?.kind === 'recording') {
    return <View style={styles.headerGap} />;
  }
  if (leadingItem?.kind === 'recording' && trailingItem?.kind === 'recording') {
    return <View style={styles.itemGap} />;
  }
  return null;
}

export function RecordingSectionFlashList({
  sections,
  renderRecording,
  contentContainerStyle,
  sectionHeaderStyle,
  onScrollBeginDrag,
  onMomentumScrollBegin,
  drawDistance = 400,
}: RecordingSectionFlashListProps) {
  const data = useMemo(() => flattenRecordingSections(sections), [sections]);

  const renderItem: ListRenderItem<FlatRecordingListItem> = useCallback(
    ({ item }) => {
      if (item.kind === 'header') {
        return <Text style={[styles.sectionHeader, sectionHeaderStyle]}>{item.title}</Text>;
      }
      if (item.kind === 'spacer') {
        return <View style={{ height: item.height }} />;
      }
      return renderRecording(item.item);
    },
    [renderRecording, sectionHeaderStyle],
  );

  const keyExtractor = useCallback((item: FlatRecordingListItem) => item.id, []);

  const getItemType = useCallback((item: FlatRecordingListItem) => item.kind, []);

  return (
    <FlashList
      style={styles.list}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      drawDistance={drawDistance}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      onScrollBeginDrag={onScrollBeginDrag}
      onMomentumScrollBegin={onMomentumScrollBegin}
      ItemSeparatorComponent={ListSeparator}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  headerGap: {
    height: RECORDING_LIST_HEADER_GAP,
  },
  itemGap: {
    height: RECORDING_LIST_ITEM_GAP,
  },
});
