import React, { useCallback, useEffect, useRef, isValidElement, cloneElement } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActionSheetIOS,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import type { Recording } from '@/types';
import { useActiveSwipeableStore } from '@/context/useActiveSwipeableStore';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useUserFolderStore } from '@/context/useUserFolderStore';
import { folderFlagsFor } from '@/utils/folders/recordingFolder';
import { RecordingFolder } from '@/types';
import { BUILTIN_MOVE_ORDER, BUILT_IN_FOLDERS } from '@/constants/builtInFolders';
import { SWIPE_ACTION_GAP } from './SwipeableAnimatedAction';
import { SwipeableAnimatedAction } from './SwipeableAnimatedAction';
import { SwipeableMotionCard } from './SwipeableMotionCard';
import {
  RECORDING_SWIPE_FRICTION,
  RECORDING_SWIPE_OVERSHOOT_FRICTION,
  RECORDING_SWIPE_SPRING,
} from './recordingSwipeSpring';

interface RecordingSwipeableRowProps {
  recording: Recording;
  children: React.ReactNode;
  onPress: () => void;
  onDelete: () => void;
  /** When set (e.g. in Recently Deleted), swipe right reveals Recover and swipe left shows Delete Forever. */
  onRestore?: () => void;
  /** When true, swipe right = Recover, swipe left = Delete Forever (same interaction pattern as elsewhere). */
  isRecentlyDeleted?: boolean;
}

type MoveDestination = { type: 'built-in'; id: RecordingFolder } | { type: 'user'; id: string; name: string };

export function RecordingSwipeableRow({
  recording,
  children,
  onPress,
  onDelete,
  onRestore,
  isRecentlyDeleted = false,
}: RecordingSwipeableRowProps) {
  const swipeableRef = useRef<React.ElementRef<typeof Swipeable> | null>(null);
  const dragTranslation = useSharedValue(0);
  const updateRecording = useRecordingStore((s) => s.updateRecording);
  const { folders, loadFolders } = useUserFolderStore();

  const closeThisRow = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  useEffect(() => {
    return () => {
      useActiveSwipeableStore.getState().release(recording.id);
    };
  }, [recording.id]);

  const handleSwipeableOpen = useCallback(() => {
    useActiveSwipeableStore.getState().open(recording.id, closeThisRow);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [closeThisRow, recording.id]);

  const handleSwipeableClose = useCallback(() => {
    useActiveSwipeableStore.getState().release(recording.id);
  }, [recording.id]);

  const handleSwipeableOpenStartDrag = useCallback(() => {
    const { activeId, closeActive } = useActiveSwipeableStore.getState();
    if (activeId && activeId !== recording.id) {
      closeActive();
    }
  }, [recording.id]);

  const wrapChildPress = useCallback(
    (child: React.ReactNode) => {
      if (!isValidElement<{ onPress?: () => void }>(child)) {
        return child;
      }
      const childOnPress = child.props.onPress;
      return cloneElement(child, {
        onPress: () => {
          useActiveSwipeableStore.getState().closeActive();
          if (childOnPress) {
            childOnPress();
          } else {
            onPress();
          }
        },
      });
    },
    [onPress]
  );

  const toggleFavorite = useCallback(() => {
    swipeableRef.current?.close();
    updateRecording(recording.id, { isFavorite: !recording.isFavorite });
  }, [recording.id, recording.isFavorite, updateRecording]);

  const moveToArchive = useCallback(() => {
    swipeableRef.current?.close();
    updateRecording(recording.id, {
      ...folderFlagsFor('archived', recording),
      userFolderId: undefined,
    });
  }, [recording, updateRecording]);

  const removeFromArchive = useCallback(() => {
    swipeableRef.current?.close();
    updateRecording(recording.id, {
      ...folderFlagsFor('unlisted', recording),
      userFolderId: undefined,
    });
  }, [recording, updateRecording]);

  const handleMoveTo = useCallback(
    (dest: MoveDestination) => {
      swipeableRef.current?.close();
      if (dest.type === 'built-in') {
        updateRecording(recording.id, {
          ...folderFlagsFor(dest.id, recording),
          userFolderId: undefined,
        });
      } else {
        updateRecording(recording.id, {
          ...folderFlagsFor('unlisted', recording),
          userFolderId: dest.id,
        });
      }
    },
    [recording, updateRecording]
  );

  const moveDestinations = useCallback((folderList = folders): MoveDestination[] => {
    const builtIn: MoveDestination[] = BUILTIN_MOVE_ORDER.map((id) => ({
      type: 'built-in' as const,
      id,
    }));
    const user = folderList.map((folder) => ({
      type: 'user' as const,
      id: folder.id,
      name: folder.name,
    }));
    return [...builtIn, ...user];
  }, [folders]);

  const showMoveSheet = useCallback(async () => {
    closeThisRow();
    await loadFolders();
    const latestFolders = useUserFolderStore.getState().folders;
    const dests = moveDestinations(latestFolders);
    const names = [
      ...BUILTIN_MOVE_ORDER.map(
        (id) => BUILT_IN_FOLDERS.find((f) => f.id === id)!.name
      ),
      ...latestFolders.map((folder) => folder.name),
    ];
    if (Platform.OS === 'ios' && names.length <= 10) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...names],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 0) return;
          const dest = dests[index - 1];
          if (dest) handleMoveTo(dest);
        }
      );
    } else {
      setMoveModalVisible(true);
    }
  }, [closeThisRow, loadFolders, moveDestinations, handleMoveTo]);

  const [moveModalVisible, setMoveModalVisible] = React.useState(false);
  const destsForModal = moveDestinations();
  const moveModalOptions = [
    ...BUILTIN_MOVE_ORDER.map((id) => ({
      label: BUILT_IN_FOLDERS.find((f) => f.id === id)!.name,
      dest: destsForModal.find((d) => d.type === 'built-in' && d.id === id)!,
    })),
    ...folders.map((folder) => ({
      label: folder.name,
      dest: { type: 'user' as const, id: folder.id, name: folder.name } as MoveDestination,
    })),
  ].filter((o) => o.dest);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    Alert.alert(
      isRecentlyDeleted ? 'Delete permanently' : 'Delete Recording',
      isRecentlyDeleted
        ? `"${recording.title}" will be removed and cannot be recovered.`
        : `Delete "${recording.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  }, [isRecentlyDeleted, recording.title, onDelete]);

  const handleRecover = useCallback(() => {
    swipeableRef.current?.close();
    onRestore?.();
  }, [onRestore]);

  const renderRightActions = useCallback(
    (progress: SharedValue<number>, translation: SharedValue<number>) => {
      dragTranslation.value = translation.value;

      if (isRecentlyDeleted) {
        return (
          <View style={styles.trailingActions}>
            <SwipeableAnimatedAction
              progress={progress}
              index={0}
              count={1}
              side="trailing"
              backgroundColor="#FF3B30"
              icon="trash"
              label="Delete Forever"
              onPress={handleDelete}
              numberOfLines={2}
            />
          </View>
        );
      }

      return (
        <View style={styles.trailingActions}>
          <SwipeableAnimatedAction
            progress={progress}
            index={0}
            count={3}
            side="trailing"
            backgroundColor="#5E5CE6"
            icon={recording.isArchived ? 'arrow-undo' : 'archive'}
            label={recording.isArchived ? 'Unarchive' : 'Archive'}
            onPress={recording.isArchived ? removeFromArchive : moveToArchive}
            numberOfLines={2}
          />
          <SwipeableAnimatedAction
            progress={progress}
            index={1}
            count={3}
            side="trailing"
            backgroundColor="#34C759"
            icon="folder-open"
            label="Move"
            onPress={showMoveSheet}
          />
          <SwipeableAnimatedAction
            progress={progress}
            index={2}
            count={3}
            side="trailing"
            backgroundColor="#FF3B30"
            icon="trash"
            label="Delete"
            onPress={handleDelete}
          />
        </View>
      );
    },
    [
      handleDelete,
      isRecentlyDeleted,
      moveToArchive,
      recording.isArchived,
      removeFromArchive,
      showMoveSheet,
      dragTranslation,
    ]
  );

  const renderLeftActions = useCallback(
    (progress: SharedValue<number>, translation: SharedValue<number>) => {
      dragTranslation.value = translation.value;

      if (isRecentlyDeleted && onRestore) {
        return (
          <SwipeableAnimatedAction
            progress={progress}
            index={0}
            count={1}
            side="leading"
            backgroundColor="#0A84FF"
            icon="arrow-undo"
            label="Recover"
            onPress={handleRecover}
            marginRight={SWIPE_ACTION_GAP}
            numberOfLines={2}
          />
        );
      }

      return (
        <SwipeableAnimatedAction
          progress={progress}
          index={0}
          count={1}
          side="leading"
          backgroundColor="#FF9F0A"
          icon={recording.isFavorite ? 'star' : 'star-outline'}
          label={recording.isFavorite ? 'Unfavorite' : 'Favorite'}
          onPress={toggleFavorite}
          marginRight={SWIPE_ACTION_GAP}
          numberOfLines={2}
        />
      );
    },
    [
      handleRecover,
      isRecentlyDeleted,
      onRestore,
      recording.isFavorite,
      toggleFavorite,
      dragTranslation,
    ]
  );

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        friction={RECORDING_SWIPE_FRICTION}
        overshootFriction={RECORDING_SWIPE_OVERSHOOT_FRICTION}
        overshootLeft={false}
        overshootRight={false}
        rightThreshold={36}
        leftThreshold={36}
        enableTrackpadTwoFingerGesture={Platform.OS === 'ios'}
        animationOptions={RECORDING_SWIPE_SPRING}
        onSwipeableOpen={handleSwipeableOpen}
        onSwipeableClose={handleSwipeableClose}
        onSwipeableOpenStartDrag={handleSwipeableOpenStartDrag}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
      >
        <SwipeableMotionCard translation={dragTranslation}>
          {wrapChildPress(children)}
        </SwipeableMotionCard>
      </Swipeable>

      <Modal
        visible={moveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMoveModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMoveModalVisible(false)}>
          <View style={styles.moveModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.moveModalContent}>
                <Text style={styles.moveModalTitle}>Move to…</Text>
                <FlatList
                  data={moveModalOptions}
                  keyExtractor={(item) => `${item.dest.type}-${item.dest.id}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.moveModalRow}
                      onPress={() => {
                        handleMoveTo(item.dest);
                        setMoveModalVisible(false);
                      }}
                    >
                      <Text style={styles.moveModalRowText}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity
                  style={styles.moveModalCancel}
                  onPress={() => setMoveModalVisible(false)}
                >
                  <Text style={styles.moveModalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trailingActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: SWIPE_ACTION_GAP,
    paddingLeft: SWIPE_ACTION_GAP,
    paddingRight: SWIPE_ACTION_GAP / 2,
  },
  moveModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  moveModalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    maxHeight: 400,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  moveModalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  moveModalRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  moveModalRowText: {
    fontSize: 17,
    color: '#FFFFFF',
  },
  moveModalCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  moveModalCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A84FF',
  },
});
