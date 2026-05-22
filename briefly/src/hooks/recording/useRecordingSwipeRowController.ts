import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { Alert, Platform, View, type GestureResponderEvent } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { triggerHaptic } from '@/utils/haptics';
import type { SharedValue } from 'react-native-reanimated';
import { useSharedValue } from 'react-native-reanimated';
import type { Recording } from '@/types';
import { useActiveSwipeableStore } from '@/context/useActiveSwipeableStore';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useUserFolderStore } from '@/context/useUserFolderStore';
import { useExport } from '@/hooks/recording/useExport';
import { useRecordingProcessingRetry } from '@/hooks/recording/useRecordingProcessingRetry';
import { folderFlagsFor } from '@/utils/folders/recordingFolder';
import { isRecordingProcessing } from '@/utils/recording/recordingContentEmoji';
import {
  isInitialProcessingFailure,
  isRecordingEntryNavigationLocked,
} from '@/utils/recording/recordingEntryAccess';
import { useAnchoredMenu } from '@/components/ui/AnchoredOverflowMenu';
import {
  buildRecordingMoveDestinations,
  type MoveDestination,
} from '@/utils/recording/recordingSwipeMoveDestinations';
import {
  buildRecordingRowMenuItems,
  moveDestinationLabel,
} from '@/utils/recording/recordingRowMenuItems';
export interface UseRecordingSwipeRowControllerOptions {
  recording: Recording;
  onPress: () => void;
  onDelete: () => void;
  onRename?: (newTitle: string) => void;
  onRestore?: () => void;
  isRecentlyDeleted?: boolean;
  children: React.ReactNode;
}
export function useRecordingSwipeRowController({
  recording,
  onPress,
  onDelete,
  onRename,
  onRestore,
  isRecentlyDeleted = false,
  children,
}: UseRecordingSwipeRowControllerOptions) {
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
  const { shareBusy, shareMenuItems } = useExport(recording);
  const { action: retryAction, runRetry } = useRecordingProcessingRetry(recording, {
    forListAvatar: true,
  });
  const pressAnchorRef = useRef<{ x: number; y: number } | null>(null);
  const moreAnchorRef = useRef<View | null>(null);
  const shareMenu = useAnchoredMenu();
  const shareRowMenu = useAnchoredMenu();
  const moreMenu = useAnchoredMenu(moreAnchorRef);
  const longPressMenu = useAnchoredMenu();
  const moveMenu = useAnchoredMenu(moreAnchorRef);
  const moveMenuFromRow = useAnchoredMenu();
  const [renameDialogVisible, setRenameDialogVisible] = React.useState(false);
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
    void updateRecording(recording.id, { isFavorite: !recording.isFavorite });
  }, [recording.id, recording.isFavorite, updateRecording]);
  const moveToArchive = useCallback(() => {
    swipeableRef.current?.close();
    void updateRecording(recording.id, {
      ...folderFlagsFor('archived', recording),
      userFolderId: undefined,
    });
  }, [recording, updateRecording]);
  const removeFromArchive = useCallback(() => {
    swipeableRef.current?.close();
    void updateRecording(recording.id, {
      ...folderFlagsFor('unlisted', recording),
      userFolderId: undefined,
    });
  }, [recording, updateRecording]);
  const handleMoveTo = useCallback(
    (dest: MoveDestination) => {
      swipeableRef.current?.close();
      if (dest.type === 'built-in') {
        void updateRecording(recording.id, {
          ...folderFlagsFor(dest.id, recording),
          userFolderId: undefined,
        });
      } else {
        void updateRecording(recording.id, {
          ...folderFlagsFor('unlisted', recording),
          userFolderId: dest.id,
        });
      }
    },
    [recording, updateRecording],
  );
  const moveMenuItems = useMemo(
    () =>
      buildRecordingMoveDestinations(folders).map((dest) => ({
        label: moveDestinationLabel(dest),
        onPress: () => handleMoveTo(dest),
      })),
    [folders, handleMoveTo],
  );
  const openMenuAtLastPress = useCallback(
    (menu: { open: () => void; openAtPoint: (x: number, y: number) => void }) => {
      const point = pressAnchorRef.current;
      if (point) {
        menu.openAtPoint(point.x, point.y);
      } else {
        menu.open();
      }
    },
    [],
  );
  const openMoveMenuFor = useCallback(
    async (menu: { open: () => void; openAtPoint: (x: number, y: number) => void }) => {
      await loadFolders();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => openMenuAtLastPress(menu));
      });
    },
    [loadFolders, openMenuAtLastPress],
  );
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
      ],
    );
  }, [isRecentlyDeleted, onDelete, recording.title]);
  const handleRecover = useCallback(() => {
    swipeableRef.current?.close();
    onRestore?.();
  }, [onRestore]);
  const openShareAnchored = useCallback(() => {
    if (shareBusy) return;
    shareMenu.open();
  }, [shareBusy, shareMenu]);
  const openShareAnchoredToRow = useCallback(() => {
    if (shareBusy) return;
    requestAnimationFrame(() => openMenuAtLastPress(shareRowMenu));
  }, [openMenuAtLastPress, shareBusy, shareRowMenu]);
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
        recording.title,
      );
    } else {
      setRenameDialogVisible(true);
    }
  }, [closeThisRow, onRename, recording.title]);
  const buildMenuItems = useCallback(
    (handlers: { onShare: () => void; onMove: () => void }) =>
      buildRecordingRowMenuItems({
        isRecentlyDeleted,
        isFavorite: !!recording.isFavorite,
        isArchived: !!recording.isArchived,
        shareBusy,
        hasRename: !!onRename,
        hasRestore: !!onRestore,
        onRename: promptRename,
        onRestore: handleRecover,
        onToggleFavorite: toggleFavorite,
        onShare: handlers.onShare,
        onArchive: moveToArchive,
        onUnarchive: removeFromArchive,
        onMove: handlers.onMove,
        onDelete: handleDelete,
      }),
    [
      handleDelete,
      handleRecover,
      isRecentlyDeleted,
      moveToArchive,
      onRename,
      onRestore,
      promptRename,
      recording.isArchived,
      recording.isFavorite,
      removeFromArchive,
      shareBusy,
      toggleFavorite,
    ],
  );
  const moreMenuItems = useMemo(
    () =>
      buildMenuItems({
        onShare: openShareAnchored,
        onMove: () => void openMoveMenuFor(moveMenu),
      }),
    [buildMenuItems, moveMenu, openMoveMenuFor, openShareAnchored],
  );
  const longPressMenuItems = useMemo(
    () =>
      buildMenuItems({
        onShare: openShareAnchoredToRow,
        onMove: () => void openMoveMenuFor(moveMenuFromRow),
      }),
    [buildMenuItems, moveMenuFromRow, openMoveMenuFor, openShareAnchoredToRow],
  );
  const handleRowPress = useCallback(() => {
    useActiveSwipeableStore.getState().closeActive();
    if (isRecordingProcessing(recording)) return;
    if (isInitialProcessingFailure(recording) && retryAction) {
      runRetry();
      return;
    }
    if (isRecordingEntryNavigationLocked(recording)) return;
    if (React.isValidElement<{ onPress?: () => void }>(children) && children.props.onPress) {
      children.props.onPress();
    } else {
      onPress();
    }
  }, [children, onPress, recording, retryAction, runRetry]);
  const handleRowLongPress = useCallback(
    (event: GestureResponderEvent) => {
      const { pageX, pageY } = event.nativeEvent;
      pressAnchorRef.current = { x: pageX, y: pageY };
      triggerHaptic();
      longPressMenu.openAtPoint(pageX, pageY);
    },
    [longPressMenu],
  );
  return {
    swipeableRef,
    moreAnchorRef,
    motionTranslation,
    bindSwipeTranslation,
    shareBusy,
    shareMenuItems,
    shareMenu,
    shareRowMenu,
    moreMenu,
    longPressMenu,
    moveMenu,
    moveMenuFromRow,
    moreMenuItems,
    longPressMenuItems,
    moveMenuItems,
    renameDialogVisible,
    setRenameDialogVisible,
    handleSwipeableOpen,
    handleSwipeableClose,
    handleSwipeableOpenStartDrag,
    handleRowPress,
    handleRowLongPress,
    toggleFavorite,
    handleDelete,
    openShareAnchored,
    isRecentlyDeleted,
    recording,
    onRename,
  };
}
