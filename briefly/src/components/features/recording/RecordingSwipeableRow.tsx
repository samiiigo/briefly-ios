import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  isValidElement,
  cloneElement,
} from 'react';
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
import { triggerHaptic } from '@/utils/haptics';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import type { Recording } from '@/types';
import { useActiveSwipeableStore } from '@/context/useActiveSwipeableStore';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useUserFolderStore } from '@/context/useUserFolderStore';
import { useExport } from '@/hooks/useExport';
import { folderFlagsFor } from '@/utils/folders/recordingFolder';
import { RecordingFolder } from '@/types';
import { BUILTIN_MOVE_ORDER, BUILT_IN_FOLDERS } from '@/constants/builtInFolders';
import { SWIPE_ACTION_GAP, SwipeableAnimatedAction } from './SwipeableAnimatedAction';
import { SwipeableMotionCard } from './SwipeableMotionCard';
import {
  RECORDING_SWIPE_FRICTION,
  RECORDING_SWIPE_OVERSHOOT_FRICTION,
  RECORDING_SWIPE_SPRING,
} from './recordingSwipeSpring';
import { TextInputDialog } from '@/components/ui/TextInputDialog';
import { useCreateStyles, Spacing, BorderRadius, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

interface RecordingSwipeableRowProps {
  recording: Recording;
  children: React.ReactNode;
  onPress: () => void;
  onDelete: () => void;
  /** When set, Rename appears in the More (⋯) menu. */
  onRename?: (newTitle: string) => void;
  /** When set (e.g. in Recently Deleted), Recover appears under the More (⋯) swipe action. */
  onRestore?: () => void;
  /** Recently Deleted: no swipe-right Favorite; swipe left is Delete, Share, More (Recover). */
  isRecentlyDeleted?: boolean;
}

type MoveDestination = { type: 'built-in'; id: RecordingFolder } | { type: 'user'; id: string; name: string };

export function RecordingSwipeableRow({
  recording,
  children,
  onPress,
  onDelete,
  onRename,
  onRestore,
  isRecentlyDeleted = false,
}: RecordingSwipeableRowProps) {
  const styles = useCreateStyles(createRecordingSwipeableRowStyles);
  const swipeableRef = useRef<React.ElementRef<typeof Swipeable> | null>(null);
  const swipeTranslationRef = useRef<SharedValue<number> | null>(null);
  const fallbackTranslation = useSharedValue(0);
  const [, syncSwipeTranslation] = useReducer((count) => count + 1, 0);
  const updateRecording = useRecordingStore((s) => s.updateRecording);

  const bindSwipeTranslation = useCallback((translation: SharedValue<number>) => {
    if (swipeTranslationRef.current === translation) return;
    swipeTranslationRef.current = translation;
    queueMicrotask(syncSwipeTranslation);
  }, []);

  const motionTranslation = swipeTranslationRef.current ?? fallbackTranslation;
  const { folders, loadFolders } = useUserFolderStore();
  const { shareBusy, openShareMenu } = useExport(recording);

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
    triggerHaptic();
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
  const [renameDialogVisible, setRenameDialogVisible] = React.useState(false);
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

  const handleShare = useCallback(() => {
    swipeableRef.current?.close();
    openShareMenu();
  }, [openShareMenu]);

  const promptRename = useCallback(() => {
    if (!onRename) return;
    closeThisRow();
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Rename Recording',
        undefined,
        (text) => {
          const trimmed = text?.trim();
          if (trimmed) onRename(trimmed);
        },
        'plain-text',
        recording.title
      );
    } else {
      setRenameDialogVisible(true);
    }
  }, [closeThisRow, onRename, recording.title]);

  const showExtraOptions = useCallback(() => {
    closeThisRow();
    if (isRecentlyDeleted) {
      const buttons: { text: string; style?: 'cancel'; onPress?: () => void }[] = [];
      if (onRename) {
        buttons.push({ text: 'Rename', onPress: promptRename });
      }
      if (onRestore) {
        buttons.push({ text: 'Recover', onPress: handleRecover });
      }
      if (buttons.length === 0) return;
      buttons.push({ text: 'Cancel', style: 'cancel' });
      Alert.alert(recording.title, undefined, buttons);
      return;
    }

    const archiveLabel = recording.isArchived ? 'Unarchive' : 'Archive';
    const iosOptions = ['Cancel'];
    if (onRename) iosOptions.push('Rename');
    iosOptions.push(archiveLabel, 'Move to…');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: iosOptions,
          cancelButtonIndex: 0,
        },
        (index) => {
          let cursor = 1;
          if (onRename) {
            if (index === cursor) {
              promptRename();
              return;
            }
            cursor += 1;
          }
          if (index === cursor) {
            if (recording.isArchived) removeFromArchive();
            else moveToArchive();
          } else if (index === cursor + 1) {
            showMoveSheet();
          }
        }
      );
      return;
    }

    const androidButtons: { text: string; style?: 'cancel'; onPress?: () => void }[] = [];
    if (onRename) {
      androidButtons.push({ text: 'Rename', onPress: promptRename });
    }
    androidButtons.push(
      {
        text: archiveLabel,
        onPress: recording.isArchived ? removeFromArchive : moveToArchive,
      },
      { text: 'Move to…', onPress: showMoveSheet },
      { text: 'Cancel', style: 'cancel' }
    );
    Alert.alert('More', undefined, androidButtons);
  }, [
    closeThisRow,
    handleRecover,
    isRecentlyDeleted,
    moveToArchive,
    onRename,
    onRestore,
    promptRename,
    recording.isArchived,
    recording.title,
    removeFromArchive,
    showMoveSheet,
  ]);

  const renderRightActions = useCallback(
    (progress: SharedValue<number>, translation: SharedValue<number>) => {
      bindSwipeTranslation(translation);

      const actionCount = 3;

      return (
        <View style={styles.trailingActions}>
          <SwipeableAnimatedAction
            progress={progress}
            index={0}
            count={actionCount}
            side="trailing"
            backgroundColor="#636366"
            icon="ellipsis-horizontal"
            label="More"
            onPress={showExtraOptions}
          />
          <SwipeableAnimatedAction
            progress={progress}
            index={1}
            count={actionCount}
            side="trailing"
            backgroundColor="#0A84FF"
            icon="share-outline"
            label="Share"
            onPress={handleShare}
            disabled={shareBusy}
          />
          <SwipeableAnimatedAction
            progress={progress}
            index={2}
            count={actionCount}
            side="trailing"
            backgroundColor="#FF3B30"
            icon="trash"
            label={isRecentlyDeleted ? 'Delete Forever' : 'Delete'}
            onPress={handleDelete}
            numberOfLines={isRecentlyDeleted ? 2 : 1}
          />
        </View>
      );
    },
    [
      bindSwipeTranslation,
      handleDelete,
      handleShare,
      isRecentlyDeleted,
      shareBusy,
      showExtraOptions,
    ]
  );

  const renderLeftActions = useCallback(
    (progress: SharedValue<number>, translation: SharedValue<number>) => {
      bindSwipeTranslation(translation);

      if (isRecentlyDeleted) {
        return null;
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
    [bindSwipeTranslation, isRecentlyDeleted, recording.isFavorite, toggleFavorite]
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
        <SwipeableMotionCard translation={motionTranslation}>
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

      {onRename ? (
        <TextInputDialog
          visible={renameDialogVisible}
          title="Rename Recording"
          defaultValue={recording.title}
          placeholder="Recording name"
          submitLabel="Rename"
          onSubmit={(text) => {
            setRenameDialogVisible(false);
            const trimmed = text.trim();
            if (trimmed) onRename(trimmed);
          }}
          onCancel={() => setRenameDialogVisible(false)}
        />
      ) : null}
    </>
  );
}

function createRecordingSwipeableRowStyles(c: ColorPalette) {
  return StyleSheet.create({
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
    backgroundColor: c.card,
    borderRadius: BorderRadius.cardXL,
    maxHeight: 400,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    overflow: 'hidden',
  },
  moveModalTitle: withAppFont({
    fontSize: 14,
    fontWeight: '500',
    color: c.subtext,
    paddingHorizontal: Spacing.md,
    paddingTop: 14,
    paddingBottom: 8,
  }),
  moveModalRow: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  moveModalRowText: withAppFont({
    fontSize: 17,
    color: c.textPrimary,
  }),
  moveModalCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
  },
  moveModalCancelText: withAppFont({
    fontSize: 17,
    fontWeight: '600',
    color: c.primary,
  }),
  });
}
