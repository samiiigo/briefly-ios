import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AudioService } from '../services/AudioService';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useRecordingStore } from '../store/useRecordingStore';
import { RecordingCard } from '../components/RecordingCard';
import { Colors, Spacing } from '../utils/theme';
import { RootStackParamList, RecordingFolder } from '../types';
import { folderFlagsFor } from '../utils/recordingFolder';
import { countByLibraryTab, filterByLibraryTab, LibraryTabId } from '../utils/libraryFilters';

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
  { id: 'processing', label: 'Processing' },
  { id: 'errors', label: 'Errors' },
];

export function LibraryScreen() {
  const navigation = useNavigation<Nav>();
  const recordings = useRecordingStore((s) => s.recordings);
  const deleteRecording = useRecordingStore((s) => s.deleteRecording);
  const updateRecording = useRecordingStore((s) => s.updateRecording);
  const [activeTab, setActiveTab] = useState<LibraryTabId>('all');
  const [selectedFolder, setSelectedFolder] = useState<RecordingFolder | null>(null);

  const tabCounts = useMemo(() => countByLibraryTab(recordings), [recordings]);

  const filtered = useMemo(() => filterByLibraryTab(recordings, activeTab), [activeTab, recordings]);

  const addToFavorites = useCallback(async (recordingId: string) => {
    const target = recordings.find((r) => r.id === recordingId);
    if (!target || target.isFavorite) return;
    await updateRecording(recordingId, folderFlagsFor('favorites'));
  }, [recordings, updateRecording]);

  const moveToArchive = useCallback(async (recordingId: string) => {
    await updateRecording(recordingId, folderFlagsFor('archived'));
  }, [updateRecording]);

  const removeFromArchive = useCallback(async (recordingId: string) => {
    await updateRecording(recordingId, folderFlagsFor('unlisted'));
  }, [updateRecording]);

  const handleStartRecording = useCallback(async () => {
    const granted = await AudioService.requestPermissions();
    if (!granted) return;
    navigation.navigate('Recording', { targetFolder: selectedFolder ?? 'unlisted' });
  }, [navigation, selectedFolder]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Library</Text>
        <TouchableOpacity style={styles.searchIcon}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
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
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.folderGrid}>
          <TouchableOpacity
            style={styles.folderCard}
            activeOpacity={0.8}
            onPress={() => setSelectedFolder((prev) => (prev === 'favorites' ? null : 'favorites'))}
          >
            <View
              style={[
                styles.folderCardInner,
                styles.folderFavorites,
                selectedFolder === 'favorites' && styles.folderSelected,
              ]}
            >
              <View style={styles.folderIconRow}>
                <Ionicons name="star" size={24} color="#FF9F0A" />
              </View>
              <View style={styles.folderTextRow}>
                <Text style={styles.folderCount}>{tabCounts.favorites} items</Text>
                <Text style={styles.folderName}>Favorites</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.folderCard}
            activeOpacity={0.8}
            onPress={() => setSelectedFolder((prev) => (prev === 'unlisted' ? null : 'unlisted'))}
          >
            <View
              style={[
                styles.folderCardInner,
                styles.folderWork,
                selectedFolder === 'unlisted' && styles.folderSelected,
              ]}
            >
              <View style={styles.folderIconRow}>
                <Ionicons name="albums" size={24} color="#0A84FF" />
              </View>
              <View style={styles.folderTextRow}>
                <Text style={styles.folderCount}>{tabCounts.active} items</Text>
                <Text style={styles.folderName}>Unlisted</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.folderCard}
            activeOpacity={0.8}
            onPress={() => setSelectedFolder((prev) => (prev === 'archived' ? null : 'archived'))}
          >
            <View
              style={[
                styles.folderCardInner,
                styles.folderPersonal,
                selectedFolder === 'archived' && styles.folderSelected,
              ]}
            >
              <View style={styles.folderIconRow}>
                <Ionicons name="archive" size={24} color="#BF5AF2" />
              </View>
              <View style={styles.folderTextRow}>
                <Text style={styles.folderCount}>{tabCounts.archived} items</Text>
                <Text style={styles.folderName}>Archived</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.folderCard}>
            <View style={[styles.folderCardInner, styles.folderArchive]}>
              <View style={styles.folderIconRow}>
                <Ionicons name="sync" size={24} color="rgba(255,255,255,0.7)" />
              </View>
              <View style={styles.folderTextRow}>
                <Text style={styles.folderCount}>{tabCounts.processing} items</Text>
                <Text style={styles.folderName}>Processing</Text>
              </View>
            </View>
          </View>
        </View>
        {selectedFolder && (
          <View style={styles.selectedFolderHint}>
            <Ionicons name="folder-open" size={14} color={Colors.primary} />
            <Text style={styles.selectedFolderHintText}>
              New recordings will be saved to{' '}
              {selectedFolder === 'favorites'
                ? 'Favorites'
                : selectedFolder === 'archived'
                  ? 'Archived'
                  : 'Unlisted'}
              .
            </Text>
          </View>
        )}

        {/* Recent Recordings */}
        <Text style={styles.sectionLabel}>RECENT RECORDINGS</Text>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No recordings in this category.</Text>
        ) : (
          filtered.map((recording) => (
            <Swipeable
              key={recording.id}
              overshootLeft={false}
              overshootRight={false}
              rightThreshold={40}
              leftThreshold={40}
              renderRightActions={() => (
                <View style={styles.favoriteAction}>
                  <Ionicons
                    name={recording.isFavorite ? 'star' : 'star-outline'}
                    size={22}
                    color="#FFFFFF"
                  />
                  <Text style={styles.favoriteActionText}>
                    {recording.isFavorite ? 'Favorited' : 'Favorite'}
                  </Text>
                </View>
              )}
              renderLeftActions={() => (
                <View style={styles.leftActionsWrap}>
                  <TouchableOpacity
                    style={[styles.quickActionButton, styles.archiveAction]}
                    onPress={() =>
                      recording.isArchived
                        ? removeFromArchive(recording.id)
                        : moveToArchive(recording.id)
                    }
                  >
                    <Ionicons
                      name={recording.isArchived ? 'arrow-undo' : 'archive'}
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.quickActionText}>
                      {recording.isArchived ? 'Unarchive' : 'Archive'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quickActionButton, styles.deleteAction]}
                    onPress={() =>
                      Alert.alert('Delete Recording', `Delete "${recording.title}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => deleteRecording(recording.id),
                        },
                      ])
                    }
                  >
                    <Ionicons name="trash" size={20} color="#FFFFFF" />
                    <Text style={styles.quickActionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
              onSwipeableOpen={(direction) => {
                if (direction === 'left') {
                  addToFavorites(recording.id);
                }
              }}
            >
              <RecordingCard
                recording={recording}
                onPress={() => navigation.navigate('Transcript', { recordingId: recording.id })}
                onDelete={() => deleteRecording(recording.id)}
              />
            </Swipeable>
          ))
        )}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={handleStartRecording}>
        <Ionicons name="mic" size={28} color="#fff" />
      </TouchableOpacity>
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
  searchIcon: {
    padding: 4,
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
  folderSelected: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
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
  folderArchive: {
    backgroundColor: 'rgba(28,28,30,0.6)',
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
  favoriteAction: {
    width: 120,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FF9F0A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  favoriteActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  leftActionsWrap: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickActionButton: {
    width: 104,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  archiveAction: {
    backgroundColor: '#5E5CE6',
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  selectedFolderHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  selectedFolderHintText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.md,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.recordButton,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.recordButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
