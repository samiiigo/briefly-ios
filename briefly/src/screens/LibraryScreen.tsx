import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AudioService } from '../services/AudioService';
import { useRecordingStore } from '../store/useRecordingStore';
import { useUserFolderStore } from '../store/useUserFolderStore';
import { RecordingCard } from '../components/RecordingCard';
import { RecordingSwipeableRow } from '../components/RecordingSwipeableRow';
import { RecordButton } from '../components/RecordButton';
import { SearchIconButton } from '../components/SearchIconButton';
import { Colors, Spacing } from '../utils/theme';
import { RootStackParamList } from '../types';
import { resolveRecordingFolder } from '../utils/recordingFolder';
import { countByLibraryTab, filterByLibraryTab, LibraryTabId } from '../utils/libraryFilters';
import { groupRecordingsByTime } from '../utils';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface LibraryTab {
  id: LibraryTabId;
  label: string;
}

const LIBRARY_TABS: LibraryTab[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Unlisted' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'archived', label: 'Archived' },
  { id: 'errors', label: 'Errors' },
];

const BUILT_IN_FOLDERS = [
  // Only Archived and Recently Deleted are exposed as built-in folders.
  { id: 'archived', name: 'Archived', icon: 'archive' as const, color: '#BF5AF2', styleKey: 'folderPersonal' },
  { id: 'recently-deleted', name: 'Recently Deleted', icon: 'trash' as const, color: 'rgba(255,255,255,0.6)', styleKey: 'folderRecentlyDeleted' },
] as const;

const MAX_FOLDER_TILES = 6;

interface FolderTile {
  id: string;
  name: string;
  folderType: 'built-in' | 'user';
  styleKey?: string;
  icon: string;
  color: string;
  count: number;
}

export function LibraryScreen() {
  const navigation = useNavigation<Nav>();
  const recordings = useRecordingStore((s) => s.recordings);
  const deleteRecording = useRecordingStore((s) => s.deleteRecording);
  const { folders, loadFolders, addFolder } = useUserFolderStore();

  const [activeTab, setActiveTab] = useState<LibraryTabId>('all');
  const [addFolderModalVisible, setAddFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(intervalId);
  }, []);

  const tabCounts = useMemo(() => countByLibraryTab(recordings), [recordings]);
  const filtered = useMemo(() => filterByLibraryTab(recordings, activeTab), [activeTab, recordings]);


  const countForBuiltIn = useCallback(
    (id: string) => {
      if (id === 'archived') {
        return recordings.filter((r) => r.deletedAt == null && r.isArchived).length;
      }
      if (id === 'recently-deleted') {
        return recordings.filter((r) => r.deletedAt != null).length;
      }
      return 0;
    },
    [recordings]
  );

  const countForUserFolder = useCallback(
    (id: string) => recordings.filter((r) => r.userFolderId === id).length,
    [recordings]
  );

  const folderTiles = useMemo<FolderTile[]>(() => {
    const builtInTiles: FolderTile[] = BUILT_IN_FOLDERS.map((f) => ({
      id: f.id,
      name: f.name,
      folderType: 'built-in',
      styleKey: f.styleKey,
      icon: f.icon,
      color: f.color,
      count: countForBuiltIn(f.id),
    }));

    const userTiles: FolderTile[] = folders.map((f) => ({
      id: f.id,
      name: f.name,
      folderType: 'user',
      icon: 'folder',
      color: 'rgba(255,255,255,0.7)',
      count: countForUserFolder(f.id),
    }));

    // Built-in folders first in fixed order, then user folders.
    return [...builtInTiles, ...userTiles];
  }, [folders, countForBuiltIn, countForUserFolder]);

  const handleStartRecording = useCallback(async () => {
    const granted = await AudioService.requestPermissions();
    if (!granted) return;
    navigation.navigate('Recording', { targetFolder: 'unlisted' });
  }, [navigation]);

  const openFolder = useCallback(
    (folderId: string, folderName: string, folderType: 'built-in' | 'user') => {
      navigation.navigate('FolderRecordings', { folderId, folderName, folderType });
    },
    [navigation]
  );

  const handleAddFolder = useCallback(() => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'New Folder',
        'Enter a name for the folder',
        (name) => {
          const trimmed = name?.trim();
          if (!trimmed) return;
          addFolder(trimmed).catch((err) => Alert.alert('Error', err.message || 'Could not create folder'));
        },
        'plain-text',
        ''
      );
    } else {
      setNewFolderName('');
      setAddFolderModalVisible(true);
    }
  }, [addFolder]);

  const confirmAddFolder = useCallback(() => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    addFolder(trimmed)
      .then(() => {
        setAddFolderModalVisible(false);
        setNewFolderName('');
      })
      .catch((err) => Alert.alert('Error', err.message || 'Could not create folder'));
  }, [addFolder, newFolderName]);

  const { visibleFolders, showAddFolderTile, hasMoreFolders } = useMemo(() => {
    const totalFolders = folderTiles.length;
    const canShowAdd = totalFolders < MAX_FOLDER_TILES;
    const maxFolderSlots = MAX_FOLDER_TILES - (canShowAdd ? 1 : 0);
    const visible = folderTiles.slice(0, maxFolderSlots);
    const more = totalFolders > maxFolderSlots;

    return {
      visibleFolders: visible,
      showAddFolderTile: canShowAdd,
      hasMoreFolders: more,
    };
  }, [folderTiles]);

  const recentSections = useMemo(
    () => groupRecordingsByTime(filtered),
    [filtered, now]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Library</Text>
        <SearchIconButton />
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={styles.tabsScrollView}
      >
        {LIBRARY_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label} ({tabCounts[tab.id]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Folders section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>FOLDERS</Text>
          {hasMoreFolders && (
            <TouchableOpacity onPress={() => navigation.navigate('FolderList')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.folderGrid}>
          {visibleFolders.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={styles.folderCard}
              activeOpacity={0.8}
              onPress={() => openFolder(f.id, f.name, f.folderType)}
            >
              <View
                style={[
                  styles.folderCardInner,
                  f.folderType === 'built-in' && f.styleKey ? styles[f.styleKey] : styles.folderUser,
                ]}
              >
                <View style={styles.folderIconRow}>
                  <Ionicons name={f.icon as any} size={24} color={f.color} />
                </View>
                <View style={styles.folderTextRow}>
                  <Text style={styles.folderCount}>{f.count} items</Text>
                  <Text style={styles.folderName}>{f.name}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {showAddFolderTile && (
            <TouchableOpacity
              style={styles.folderCard}
              activeOpacity={0.8}
              onPress={handleAddFolder}
            >
              <View style={[styles.folderCardInner, styles.folderAdd]}>
                <View style={styles.folderIconRow}>
                  <Ionicons name="add-circle-outline" size={28} color="rgba(255,255,255,0.5)" />
                </View>
                <View style={styles.folderTextRow}>
                  <Text style={styles.folderAddLabel}>Add folder</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Recordings grouped by time */}
        <Text style={styles.sectionLabel}>RECENT RECORDINGS</Text>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No recordings in this category.</Text>
        ) : (
          recentSections.map((section) => (
            <View key={section.title}>
              <Text style={[styles.sectionLabel, { marginTop: Spacing.sm }]}>{section.title}</Text>
              {section.data.map((recording) => (
                <RecordingSwipeableRow
                  key={recording.id}
                  recording={recording}
                  onPress={() => navigation.navigate('Transcript', { recordingId: recording.id })}
                  onDelete={() => deleteRecording(recording.id)}
                >
                  <RecordingCard
                    recording={recording}
                    onPress={() => navigation.navigate('Transcript', { recordingId: recording.id })}
                    onDelete={() => deleteRecording(recording.id)}
                  />
                </RecordingSwipeableRow>
              ))}
            </View>
          ))
        )}
      </ScrollView>
      <RecordButton onPress={handleStartRecording} />

      {/* Add folder modal (Android) */}
      <Modal
        visible={addFolderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddFolderModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddFolderModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContentWrap}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.addFolderModal}>
                <Text style={styles.addFolderModalTitle}>New Folder</Text>
                <TextInput
                  style={styles.addFolderInput}
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder="Folder name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoFocus
                  onSubmitEditing={confirmAddFolder}
                />
                <View style={styles.addFolderModalActions}>
                  <TouchableOpacity
                    style={styles.addFolderModalBtn}
                    onPress={() => setAddFolderModalVisible(false)}
                  >
                    <Text style={styles.addFolderModalBtnCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addFolderModalBtn, styles.addFolderModalBtnPrimary]}
                    onPress={confirmAddFolder}
                    disabled={!newFolderName.trim()}
                  >
                    <Text style={styles.addFolderModalBtnPrimaryText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  tabsScrollView: {
    flexGrow: 0,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 18,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: Spacing.contentTop,
    paddingHorizontal: 20,
    paddingBottom: 100,
    justifyContent: 'flex-start',
  },
  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  folderCard: {
    width: '48.5%',
    marginBottom: 12,
  },
  folderCardInner: {
    borderRadius: 16,
    padding: 16,
    height: 90,
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  folderFavorites: {
    backgroundColor: 'rgba(255,159,10,0.08)',
  },
  folderWork: {
    backgroundColor: 'rgba(10,132,255,0.08)',
  },
  folderPersonal: {
    backgroundColor: 'rgba(191,90,242,0.08)',
  },
  folderRecentlyDeleted: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  folderUser: {
    backgroundColor: 'rgba(28,28,30,0.6)',
  },
  folderAdd: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  folderIconRow: {
    marginBottom: 8,
  },
  folderTextRow: {
    gap: 2,
  },
  folderCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  folderAddLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0A84FF',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContentWrap: {
    width: '100%',
    maxWidth: 340,
  },
  addFolderModal: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  addFolderModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  addFolderInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  addFolderModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  addFolderModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  addFolderModalBtnCancel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  addFolderModalBtnPrimary: {
    backgroundColor: '#0A84FF',
    borderRadius: 10,
  },
  addFolderModalBtnPrimaryText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
