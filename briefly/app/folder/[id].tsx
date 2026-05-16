import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList, FlatList, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { RecordingService } from '@/services/audio';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useLibraryFolderPreferencesStore } from '@/context/useLibraryFolderPreferencesStore';
import { getFolderBrowsePreferences, useFolderBrowsePreferencesStore } from '@/context/useFolderBrowsePreferencesStore';
import { applyFolderRecordingPreferences } from '@/utils/folders/folderRecordingPreferences';
import { buildFolderSections } from '@/utils/folders/folderBrowse';
import { RecordingCard } from '@/components/features/recording/RecordingCard';
import { RecordingSwipeableRow } from '@/components/features/recording/RecordingSwipeableRow';
import { RecordButton } from '@/components/features/recording/RecordButton';
import { GlassCircleIconButton } from '@/components/features/library/GlassAddFolderButton';
import { FolderViewOptionsSheet } from '@/components/features/library/FolderViewOptionsSheet';
import { Recording } from '@/types';
import { resolveRecordingFolder } from '@/utils/folders/recordingFolder';
import { Spacing, Typography } from '@/theme';

export default function FolderRecordingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; folderName?: string; folderType?: string }>();
  const folderId = params.id!;
  const folderName = params.folderName ?? folderId;
  const folderType = (params.folderType ?? 'built-in') as 'built-in' | 'user';
  const recordings = useRecordingStore((s) => s.recordings);
  const deleteRecording = useRecordingStore((s) => s.deleteRecording);
  const restoreRecording = useRecordingStore((s) => s.restoreRecording);
  const permanentDelete = useRecordingStore((s) => s.permanentDelete);
  const prefs = useLibraryFolderPreferencesStore(useShallow((s) => ({ datePreset: s.datePreset, scopeRefinement: s.scopeRefinement })));
  const folderKey = useMemo(() => `${folderType}:${folderId}`, [folderType, folderId]);
  const byFolder = useFolderBrowsePreferencesStore((s) => s.byFolder);
  const browse = useMemo(() => getFolderBrowsePreferences(byFolder, folderKey), [byFolder, folderKey]);
  const [now, setNow] = useState(() => Date.now());
  const [viewSheetVisible, setViewSheetVisible] = useState(false);

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(id); }, []);

  const isRecentlyDeleted = folderId === 'recently-deleted';
  const filtered = useMemo(() => {
    if (folderType === 'built-in') {
      if (folderId === 'all') return recordings;
      if (folderId === 'unlisted') return recordings.filter(r => r.deletedAt == null && resolveRecordingFolder(r) === 'unlisted');
      if (folderId === 'favorites') return recordings.filter(r => r.deletedAt == null && r.isFavorite);
      if (folderId === 'imports') return recordings.filter(r => r.deletedAt == null && !!r.isImported);
      return recordings.filter(r => resolveRecordingFolder(r) === folderId);
    }
    return recordings.filter(r => r.userFolderId === folderId);
  }, [recordings, folderId, folderType]);

  const afterLibraryFilters = useMemo(() => applyFolderRecordingPreferences(filtered, prefs, now), [filtered, prefs, now]);
  const afterBrowseFilter = useMemo(() => browse.favoritesOnly ? afterLibraryFilters.filter(r => r.deletedAt == null && !!r.isFavorite) : afterLibraryFilters, [afterLibraryFilters, browse.favoritesOnly]);
  const sections = useMemo(() => buildFolderSections(afterBrowseFilter, browse), [afterBrowseFilter, browse]);
  const effectiveLayout = browse.groupBy !== 'none' ? 'list' : browse.layout;
  const flatData = useMemo(() => sections.flatMap(s => s.data), [sections]);
  const listEmpty = afterBrowseFilter.length === 0;

  const handleRecordIntoFolder = useCallback(async () => {
    if (isRecentlyDeleted) return;
    const granted = await RecordingService.requestPermissions();
    if (!granted) return;
    if (folderType === 'user') router.push({ pathname: '/recording/new', params: { targetFolder: 'unlisted', targetUserFolderId: folderId } });
    else if (folderId === 'archived') router.push({ pathname: '/recording/new', params: { targetFolder: 'archived' } });
    else if (folderId === 'imports') router.push({ pathname: '/recording/new', params: { targetFolder: 'unlisted', markImported: 'true' } });
    else router.push({ pathname: '/recording/new', params: { targetFolder: 'unlisted' } });
  }, [router, folderType, folderId, isRecentlyDeleted]);

  const renderCard = useCallback((item: Recording, compact: boolean) => (
    <RecordingSwipeableRow recording={item} onPress={() => router.push(`/recording/${item.id}`)} onDelete={isRecentlyDeleted ? () => permanentDelete(item.id) : () => deleteRecording(item.id)} onRestore={isRecentlyDeleted ? () => restoreRecording(item.id) : undefined} isRecentlyDeleted={isRecentlyDeleted}>
      <RecordingCard recording={item} compact={compact} onPress={() => router.push(`/recording/${item.id}`)} onDelete={isRecentlyDeleted ? () => permanentDelete(item.id) : () => deleteRecording(item.id)} onRestore={isRecentlyDeleted ? () => restoreRecording(item.id) : undefined} />
    </RecordingSwipeableRow>
  ), [router, isRecentlyDeleted, permanentDelete, deleteRecording, restoreRecording]);

  const renderGridItem: ListRenderItem<Recording> = useCallback(({ item }) => <View style={styles.gridCell}>{renderCard(item, true)}</View>, [renderCard]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}><Ionicons name="arrow-back" size={24} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.pageTitle} numberOfLines={1}>{folderName}</Text>
        <View style={styles.headerRight}><GlassCircleIconButton ionIcon="ellipsis-horizontal" iconSize={22} onPress={() => setViewSheetVisible(true)} accessibilityLabel="View options" /></View>
      </View>
      {listEmpty ? <View style={styles.emptyWrap}><Text style={styles.emptyText}>No recordings match this view.</Text></View> : effectiveLayout === 'grid' ? <FlatList key={`grid-${folderKey}`} data={flatData} numColumns={2} keyExtractor={item => item.id} columnWrapperStyle={styles.gridRow} contentContainerStyle={styles.contentGrid} renderItem={renderGridItem} /> : <SectionList sections={sections} keyExtractor={item => item.id} contentContainerStyle={styles.content} stickySectionHeadersEnabled renderSectionHeader={({ section }) => section.title ? <View style={styles.sectionHeaderWrap}><Text style={styles.sectionHeader}>{section.title}</Text></View> : null} renderItem={({ item }) => <View>{renderCard(item, false)}</View>} />}
      {!isRecentlyDeleted && <RecordButton onPress={handleRecordIntoFolder} />}
      <FolderViewOptionsSheet visible={viewSheetVisible} folderKey={folderKey} onClose={() => setViewSheetVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenHorizontal, paddingTop: Spacing.lg, paddingBottom: Spacing.md, gap: 12 },
  headerIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { flex: 1, minWidth: 0, ...Typography.largeTitle, color: '#FFFFFF', textAlign: 'left' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  content: { flexGrow: 1, paddingTop: Spacing.xs, paddingHorizontal: Spacing.screenHorizontal, paddingBottom: 100 },
  contentGrid: { flexGrow: 1, paddingTop: Spacing.xs, paddingHorizontal: Spacing.screenHorizontal, paddingBottom: 100 },
  gridRow: { gap: 10, marginBottom: 10, justifyContent: 'space-between' },
  gridCell: { flex: 1, maxWidth: '50%', paddingHorizontal: 4 },
  sectionHeaderWrap: { backgroundColor: '#000000', paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  sectionHeader: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.2, textTransform: 'uppercase' },
  emptyWrap: { flex: 1, paddingHorizontal: Spacing.screenHorizontal, paddingTop: Spacing.md },
  emptyText: { color: 'rgba(255,255,255,0.42)', fontSize: 15, textAlign: 'center', marginTop: 40, fontWeight: '500' },
});
