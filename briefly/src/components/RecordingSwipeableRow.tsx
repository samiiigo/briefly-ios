import React, { useCallback, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { Recording } from '../types';
import { useRecordingStore } from '../store/useRecordingStore';
import { useUserFolderStore } from '../store/useUserFolderStore';
import { folderFlagsFor } from '../utils/recordingFolder';
import { RecordingFolder } from '../types';

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
  const swipeableRef = useRef<Swipeable>(null);
  const updateRecording = useRecordingStore((s) => s.updateRecording);
  const { folders, loadFolders } = useUserFolderStore();

  const toggleFavorite = useCallback(() => {
    swipeableRef.current?.close();
    updateRecording(recording.id, { isFavorite: !recording.isFavorite });
  }, [recording.id, recording.isFavorite, updateRecording]);

  const moveToArchive = useCallback(() => {
    swipeableRef.current?.close();
    updateRecording(recording.id, folderFlagsFor('archived'));
  }, [recording.id, updateRecording]);

  const removeFromArchive = useCallback(() => {
    swipeableRef.current?.close();
    updateRecording(recording.id, folderFlagsFor('unlisted'));
  }, [recording.id, updateRecording]);

  const handleMoveTo = useCallback(
    (dest: MoveDestination) => {
      swipeableRef.current?.close();
      if (dest.type === 'built-in') {
        updateRecording(recording.id, folderFlagsFor(dest.id));
      } else {
        updateRecording(recording.id, { ...folderFlagsFor('unlisted'), userFolderId: dest.id });
      }
    },
    [recording.id, updateRecording]
  );

  const moveDestinations = useCallback((): MoveDestination[] => {
    const builtIn: MoveDestination[] = [
      { type: 'built-in', id: 'unlisted' },
      { type: 'built-in', id: 'archived' },
    ];
    const user = folders.map((f) => ({ type: 'user' as const, id: f.id, name: f.name }));
    return [...builtIn, ...user];
  }, [folders]);

  const showMoveSheet = useCallback(() => {
    loadFolders();
    const dests = moveDestinations();
    const names = ['Favorites', 'Unlisted', 'Archived', ...folders.map((f) => f.name)];
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
  }, [moveDestinations, folders, handleMoveTo]);

  const [moveModalVisible, setMoveModalVisible] = React.useState(false);
  const destsForModal = moveDestinations();
  const moveModalOptions = [
    { label: 'Unlisted', dest: destsForModal.find((d) => d.type === 'built-in' && d.id === 'unlisted')! },
    { label: 'Archived', dest: destsForModal.find((d) => d.type === 'built-in' && d.id === 'archived')! },
    ...folders.map((f) => ({ label: f.name, dest: { type: 'user' as const, id: f.id, name: f.name } as MoveDestination })),
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

  const renderRightActions = () => (
    <View style={styles.trailingActions}>
      {isRecentlyDeleted ? (
        <TouchableOpacity
          style={[styles.trailingButton, styles.trailingButtonWide, styles.deleteButton]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={22} color="#FFFFFF" />
          <Text style={styles.trailingButtonLabel}>Delete Forever</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.trailingButton, styles.archiveButton]}
            onPress={recording.isArchived ? removeFromArchive : moveToArchive}
            activeOpacity={0.8}
          >
            <Ionicons
              name={recording.isArchived ? 'arrow-undo' : 'archive'}
              size={22}
              color="#FFFFFF"
            />
            <Text style={styles.trailingButtonLabel}>
              {recording.isArchived ? 'Unarchive' : 'Archive'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.trailingButton, styles.moveButton]}
            onPress={showMoveSheet}
            activeOpacity={0.8}
          >
            <Ionicons name="folder-open" size={22} color="#FFFFFF" />
            <Text style={styles.trailingButtonLabel}>Move</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.trailingButton, styles.deleteButton]}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Ionicons name="trash" size={22} color="#FFFFFF" />
            <Text style={styles.trailingButtonLabel}>Delete</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderLeftActions = () =>
    isRecentlyDeleted && onRestore ? (
      <TouchableOpacity
        style={[styles.leadingAction, styles.leadingActionRecover]}
        onPress={handleRecover}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-undo" size={24} color="#FFFFFF" />
        <Text style={styles.leadingActionLabel}>Recover</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        style={styles.leadingAction}
        onPress={toggleFavorite}
        activeOpacity={0.8}
      >
        <Ionicons
          name={recording.isFavorite ? 'star' : 'star-outline'}
          size={24}
          color="#FFFFFF"
        />
        <Text style={styles.leadingActionLabel}>
          {recording.isFavorite ? 'Unfavorite' : 'Favorite'}
        </Text>
      </TouchableOpacity>
    );

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        overshootLeft={false}
        overshootRight={false}
        rightThreshold={40}
        leftThreshold={40}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
      >
        {children}
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

const ACTION_WIDTH = 80;
const LEADING_WIDTH = 100;

const styles = StyleSheet.create({
  leadingAction: {
    width: LEADING_WIDTH,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FF9F0A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  leadingActionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  leadingActionRecover: {
    backgroundColor: '#0A84FF',
  },
  trailingActions: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 0,
  },
  trailingButton: {
    width: ACTION_WIDTH,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  trailingButtonWide: {
    width: 120,
  },
  trailingButtonLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  archiveButton: {
    backgroundColor: '#5E5CE6',
  },
  moveButton: {
    backgroundColor: '#34C759',
  },
  restoreButton: {
    backgroundColor: '#0A84FF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
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
