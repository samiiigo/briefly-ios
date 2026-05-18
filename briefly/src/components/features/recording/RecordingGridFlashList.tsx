import React, { useCallback } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { Recording } from '@/types';

interface RecordingGridFlashListProps {
  data: Recording[];
  renderItem: (recording: Recording) => React.ReactElement;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onScrollBeginDrag?: () => void;
  onMomentumScrollBegin?: () => void;
  drawDistance?: number;
}

export function RecordingGridFlashList({
  data,
  renderItem,
  contentContainerStyle,
  onScrollBeginDrag,
  onMomentumScrollBegin,
  drawDistance = 400,
}: RecordingGridFlashListProps) {
  const renderRow: ListRenderItem<Recording> = useCallback(
    ({ item }) => <View style={styles.gridCell}>{renderItem(item)}</View>,
    [renderItem],
  );

  return (
    <FlashList
      style={styles.list}
      data={data}
      numColumns={2}
      renderItem={renderRow}
      keyExtractor={(item) => item.id}
      drawDistance={drawDistance}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      onScrollBeginDrag={onScrollBeginDrag}
      onMomentumScrollBegin={onMomentumScrollBegin}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  gridCell: {
    flex: 1,
    maxWidth: '50%',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
});
