import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  isValidElement,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  Platform,
  ActionSheetIOS,
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
import { isRecordingProcessing } from '@/utils/recording/recordingContentEmoji';
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
import {
  AnchoredMenuModal,
  useAnchoredMenu,
  type AnchoredMenuItem,
} from '@/components/ui/AnchoredOverflowMenu';
import { useCreateStyles, Spacing } from '@/theme';
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
  const { shareBusy, shareMenuItems, openShareMenu } = useExport(recording);
  const moreAnchorRef = useRef<View>(null);
  const shareMenu = useAnchoredMenu();
  const moreMenu = useAnchoredMenu(moreAnchorRef);
  const moveMenu = useAnchoredMenu(moreAnchorRef);

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

  const [renameDialogVisible, setRenameDialogVisible] = React.useState(false);

  const moveMenuItems = React.useMemo((): AnchoredMenuItem[] => {
    return moveDestinations().map((dest) => ({
      label:
        dest.type === 'built-in'
          ? BUILT_IN_FOLDERS.find((f) => f.id === dest.id)!.name
          : dest.name,
      onPress: () => handleMoveTo(dest),
    }));
  }, [folders, handleMoveTo, moveDestinations]);

  const openMoveMenu = useCallback(async () => {
    await loadFolders();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => moveMenu.open());
    });
  }, [loadFolders, moveMenu.open]);

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

  /** Opens share options anchored to the swipe Share button (row should stay open). */
  const openShareAnchored = useCallback(() => {
    if (shareBusy) return;
    shareMenu.open();
  }, [shareBusy, shareMenu.open]);

  /** Share from long-press sheet when the swipe actions are not exposed. */
  const handleShareFromSheet = useCallback(() => {
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

  const moreMenuItems = React.useMemo((): AnchoredMenuItem[] => {
    const deleteLabel = isRecentlyDeleted ? 'Delete Forever' : 'Delete';
    const items: AnchoredMenuItem[] = [];

    if (isRecentlyDeleted) {
      if (onRename) {
        items.push({ label: 'Rename', onPress: promptRename });
      }
      if (onRestore) {
        items.push({ label: 'Recover', onPress: handleRecover });
      }
      items.push({ label: 'Share', onPress: openShareAnchored, disabled: shareBusy });
      items.push({ label: deleteLabel, onPress: handleDelete });
      return items;
    }

    items.push({
      label: recording.isFavorite ? 'Unfavorite' : 'Favorite',
      onPress: toggleFavorite,
    });
    items.push({ label: 'Share', onPress: openShareAnchored, disabled: shareBusy });
    if (onRename) {
      items.push({ label: 'Rename', onPress: promptRename });
    }
    items.push({
      label: recording.isArchived ? 'Unarchive' : 'Archive',
      onPress: recording.isArchived ? removeFromArchive : moveToArchive,
    });
    items.push({ label: 'Move to…', onPress: openMoveMenu });
    items.push({ label: deleteLabel, onPress: handleDelete });
    return items;
  }, [
    handleDelete,
    handleRecover,
    openShareAnchored,
    isRecentlyDeleted,
    moveToArchive,
    onRename,
    onRestore,
    promptRename,
    recording.isArchived,
    recording.isFavorite,
    removeFromArchive,
    shareBusy,
    openMoveMenu,
    toggleFavorite,
  ]);

  const showOptionsMenu = useCallback(() => {
    closeThisRow();
    const favoriteLabel = recording.isFavorite ? 'Unfavorite' : 'Favorite';
    const archiveLabel = recording.isArchived ? 'Unarchive' : 'Archive';
    const deleteLabel = isRecentlyDeleted ? 'Delete Forever' : 'Delete';

    if (isRecentlyDeleted) {
      if (Platform.OS === 'ios') {
        const options = ['Cancel'];
        const handlers: (() => void)[] = [];
        if (onRename) {
          options.push('Rename');
          handlers.push(promptRename);
        }
        if (onRestore) {
          options.push('Recover');
          handlers.push(handleRecover);
        }
        options.push('Share', deleteLabel);
        handlers.push(handleShareFromSheet, handleDelete);
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex: 0,
            destructiveButtonIndex: options.length - 1,
          },
          (index) => {
            if (index <= 0) return;
            handlers[index - 1]?.();
          }
        );
        return;
      }

      const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] =
        [];
      if (onRename) buttons.push({ text: 'Rename', onPress: promptRename });
      if (onRestore) buttons.push({ text: 'Recover', onPress: handleRecover });
      buttons.push({ text: 'Share', onPress: handleShareFromSheet });
      buttons.push({ text: deleteLabel, style: 'destructive', onPress: handleDelete });
      buttons.push({ text: 'Cancel', style: 'cancel' });
      Alert.alert(recording.title, undefined, buttons);
      return;
    }

    if (Platform.OS === 'ios') {
      const options = ['Cancel'];
      const handlers: (() => void)[] = [];
      options.push(favoriteLabel);
      handlers.push(toggleFavorite);
      options.push('Share');
      handlers.push(handleShareFromSheet);
      if (onRename) {
        options.push('Rename');
        handlers.push(promptRename);
      }
      options.push(archiveLabel, 'Move to…', deleteLabel);
      handlers.push(
        () => (recording.isArchived ? removeFromArchive() : moveToArchive()),
        openMoveMenu,
        handleDelete
      );
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: options.length - 1,
        },
        (index) => {
          if (index <= 0) return;
          handlers[index - 1]?.();
        }
      );
      return;
    }

    const androidButtons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] =
      [];
    androidButtons.push({ text: favoriteLabel, onPress: toggleFavorite });
    androidButtons.push({ text: 'Share', onPress: handleShareFromSheet });
    if (onRename) {
      androidButtons.push({ text: 'Rename', onPress: promptRename });
    }
    androidButtons.push(
      {
        text: archiveLabel,
        onPress: recording.isArchived ? removeFromArchive : moveToArchive,
      },
      { text: 'Move to…', onPress: openMoveMenu },
      { text: deleteLabel, style: 'destructive', onPress: handleDelete },
      { text: 'Cancel', style: 'cancel' }
    );
    Alert.alert(recording.title, undefined, androidButtons);
  }, [
    closeThisRow,
    handleDelete,
    handleRecover,
    handleShareFromSheet,
    isRecentlyDeleted,
    moveToArchive,
    onRename,
    onRestore,
    promptRename,
    recording.isArchived,
    recording.isFavorite,
    recording.title,
    removeFromArchive,
    openMoveMenu,
    toggleFavorite,
  ]);

  const handleRowPress = useCallback(() => {
    useActiveSwipeableStore.getState().closeActive();
    if (isRecordingProcessing(recording)) return;
    if (isValidElement<{ onPress?: () => void }>(children) && children.props.onPress) {
      children.props.onPress();
    } else {
      onPress();
    }
  }, [children, onPress, recording]);

  const handleRowLongPress = useCallback(() => {
    triggerHaptic();
    showOptionsMenu();
  }, [showOptionsMenu]);

  const renderRightActions = useCallback(
    (progress: SharedValue<number>, translation: SharedValue<number>) => {
      bindSwipeTranslation(translation);

      const actionCount = 3;

      return (
        <View style={styles.trailingActions}>
          <SwipeableAnimatedAction
            ref={moreAnchorRef}
            progress={progress}
            index={0}
            count={actionCount}
            side="trailing"
            backgroundColor="#636366"
            icon="ellipsis-horizontal"
            label="More"
            onPress={moreMenu.open}
          />
          <SwipeableAnimatedAction
            ref={shareMenu.anchorRef}
            progress={progress}
            index={1}
            count={actionCount}
            side="trailing"
            backgroundColor="#0A84FF"
            icon="share-outline"
            label="Share"
            onPress={openShareAnchored}
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
      isRecentlyDeleted,
      moreMenu.open,
      openShareAnchored,
      shareBusy,
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
          <Pressable
            style={styles.rowPressable}
            onPress={handleRowPress}
            onLongPress={handleRowLongPress}
            delayLongPress={450}
            accessibilityHint="Long press for more options. Swipe for actions."
          >
            {children}
          </Pressable>
        </SwipeableMotionCard>
      </Swipeable>

      <AnchoredMenuModal
        visible={shareMenu.visible}
        anchor={shareMenu.anchor}
        items={shareMenuItems}
        onClose={shareMenu.close}
        align="trailing"
      />
      <AnchoredMenuModal
        visible={moreMenu.visible}
        anchor={moreMenu.anchor}
        items={moreMenuItems}
        onClose={moreMenu.close}
        align="trailing"
      />
      <AnchoredMenuModal
        visible={moveMenu.visible}
        anchor={moveMenu.anchor}
        items={moveMenuItems}
        onClose={moveMenu.close}
        align="trailing"
      />

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
  rowPressable: {
    width: '100%',
  },
  trailingActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: SWIPE_ACTION_GAP,
    paddingLeft: SWIPE_ACTION_GAP,
    paddingRight: SWIPE_ACTION_GAP / 2,
  },
  });
}
