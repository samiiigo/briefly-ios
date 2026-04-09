import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useShallow } from 'zustand/react/shallow';
import { RecordingService } from '../services/audio';
import { useRecordingStore } from '../store/useRecordingStore';
import { useLibraryFolderPreferencesStore } from '../store/useLibraryFolderPreferencesStore';
import {
  getFolderBrowsePreferences,
  useFolderBrowsePreferencesStore,
} from '../store/useFolderBrowsePreferencesStore';
import { applyFolderRecordingPreferences } from '../utils/folderRecordingPreferences';
import { buildFolderSections } from '../utils/folderBrowse';
import { RecordingCard } from '../components/RecordingCard';
import { RecordingSwipeableRow } from '../components/RecordingSwipeableRow';
import { RecordButton } from '../components/RecordButton';
import { GlassCircleIconButton } from '../components/GlassAddFolderButton';
import { FolderViewOptionsSheet } from '../components/FolderViewOptionsSheet';
import { RootStackParamList, Recording } from '../types';
import { resolveRecordingFolder } from '../utils/recordingFolder';
import { Spacing, Typography } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'FolderRecordings'>;

export function FolderRecordingsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { folderId, folderName, folderType } = route.params;
  const recordings = useRecordingStore((s) => s.recordings);
  const deleteRecording = useRecordingStore((s) => s.deleteRecording);
  const restoreRecording = useRecordingStore((s) => s.restoreRecording);
  const permanentDelete = useRecordingStore((s) => s.permanentDelete);

  const prefs = useLibraryFolderPreferencesStore(
    useShallow((s) => ({
      datePreset: s.datePreset,
      scopeRefinement: s.scopeRefinement,
    }))
  );

  const folderKey = useMemo(() => `${folderType}:${folderId}`, [folderType, folderId]);
  const byFolder = useFolderBrowsePreferencesStore((s) => s.byFolder);
  const browse = useMemo(() => getFolderBrowsePreferences(byFolder, folderKey), [byFolder, folderKey]);

  const [now, setNow] = useState(() => Date.now());
  const [viewSheetVisible, setViewSheetVisible] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(intervalId);
  }, []);

  const isRecentlyDeleted = folderId === 'recently-deleted';
  const filtered = useMemo(() => {
    if (folderType === 'built-in') {
      if (folderId === 'all') {
        return recordings;
      }
      if (folderId === 'unlisted') {
        return recordings.filter(
          (recording) =>
            recording.deletedAt == null && resolveRecordingFolder(recording) === 'unlisted'
        );
      }
      if (folderId === 'favorites') {
        return recordings.filter((recording) => recording.deletedAt == null && recording.isFavorite);
      }
      if (folderId === 'imports') {
        return recordings.filter((recording) => recording.deletedAt == null && !!recording.isImported);
      }
      return recordings.filter((recording) => resolveRecordingFolder(recording) === folderId);
    }
    return recordings.filter((recording) => recording.userFolderId === folderId);
  }, [recordings, folderId, folderType]);

  const afterLibraryFilters = useMemo(
    () => applyFolderRecordingPreferences(filtered, prefs, now),
    [filtered, prefs, now]
  );

  const afterBrowseFilter = useMemo(() => {
    if (!browse.favoritesOnly) return afterLibraryFilters;
    return afterLibraryFilters.filter(
      (r) => r.deletedAt == null && !!r.isFavorite
    );
  }, [afterLibraryFilters, browse.favoritesOnly]);

  const sections = useMemo(
    () => buildFolderSections(afterBrowseFilter, browse),
    [afterBrowseFilter, browse, now]
  );

  const effectiveLayout = browse.groupBy !== 'none' ? 'list' : browse.layout;
  const flatData = useMemo(() => sections.flatMap((s) => s.data), [sections]);
  const listEmpty = afterBrowseFilter.length === 0;

  const handleRecordIntoFolder = useCallback(async () => {
    if (isRecentlyDeleted) return;
    const granted = await RecordingService.requestPermissions();
    if (!granted) return;
    if (folderType === 'user') {
      navigation.navigate('Recording', { targetFolder: 'unlisted', targetUserFolderId: folderId });
    } else if (folderId === 'archived') {
      navigation.navigate('Recording', {
        targetFolder: 'archived',
      });
    } else if (folderId === 'imports') {
      navigation.navigate('Recording', { targetFolder: 'unlisted', markImported: true });
    } else {
      navigation.navigate('Recording', { targetFolder: 'unlisted' });
    }
  }, [navigation, folderType, folderId, isRecentlyDeleted]);

  const renderRecordingCard = useCallback(
    (item: Recording, compact: boolean) => (
      <RecordingSwipeableRow
        recording={item}
        onPress={() => navigation.navigate('Transcript', { recordingId: item.id })}
        onDelete={isRecentlyDeleted ? () => permanentDelete(item.id) : () => deleteRecording(item.id)}
        onRestore={isRecentlyDeleted ? () => restoreRecording(item.id) : undefined}
        isRecentlyDeleted={isRecentlyDeleted}
      >
        <RecordingCard
          recording={item}
          compact={compact}
          onPress={() => navigation.navigate('Transcript', { recordingId: item.id })}
          onDelete={isRecentlyDeleted ? () => permanentDelete(item.id) : () => deleteRecording(item.id)}
          onRestore={isRecentlyDeleted ? () => restoreRecording(item.id) : undefined}
        />
      </RecordingSwipeableRow>
    ),
    [navigation, isRecentlyDeleted, permanentDelete, deleteRecording, restoreRecording]
  );

  const renderGridItem: ListRenderItem<Recording> = useCallback(
    ({ item }) => (
      <View style={styles.gridCell}>
        {renderRecordingCard(item, true)}
      </View>
    ),
    [renderRecordingCard]
  );

  const sectionList = (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled
      renderSectionHeader={({ section }) =>
        section.title ? (
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.listItemWrap}>
          {renderRecordingCard(item, false)}
        </View>
      )}
    />
  );

  const gridFlat = (
    <FlatList
      key={`grid-${folderKey}`}
      data={flatData}
      numColumns={2}
      keyExtractor={(item) => item.id}
      columnWrapperStyle={styles.gridRow}
      contentContainerStyle={styles.contentGrid}
      renderItem={renderGridItem}
    />
  );

  let mainList: React.ReactNode;
  if (listEmpty) {
    mainList = null;
  } else if (effectiveLayout === 'grid') {
    mainList = gridFlat;
  } else {
    mainList = sectionList;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityHint="Returns to the previous screen"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.pageTitle} numberOfLines={1}>
          {folderName}
        </Text>
        <View style={styles.headerRight}>
          <GlassCircleIconButton
            ionIcon="ellipsis-horizontal"
            iconSize={22}
            onPress={() => setViewSheetVisible(true)}
            accessibilityLabel="View options"
            accessibilityHint="Opens sort, layout, and filter options for this folder"
          />
        </View>
      </View>

      {listEmpty ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No recordings match this view.</Text>
        </View>
      ) : (
        mainList
      )}

      {!isRecentlyDeleted && <RecordButton onPress={handleRecordIntoFolder} />}

      <FolderViewOptionsSheet
        visible={viewSheetVisible}
        folderKey={folderKey}
        onClose={() => setViewSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: 12,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    flex: 1,
    minWidth: 0,
    ...Typography.largeTitle,
    color: '#FFFFFF',
    textAlign: 'left',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    flexGrow: 1,
    paddingTop: Spacing.xs,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: 100,
  },
  contentGrid: {
    flexGrow: 1,
    paddingTop: Spacing.xs,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: 100,
  },
  listItemWrap: {
    marginBottom: 0,
  },
  gridRow: {
    gap: 10,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  gridCell: {
    flex: 1,
    maxWidth: '50%',
    paddingHorizontal: 4,
  },
  sectionHeaderWrap: {
    backgroundColor: '#000000',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.md,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
    fontWeight: '500',
  },
});
