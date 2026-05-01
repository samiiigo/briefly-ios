import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SectionList,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRecordingStore } from '../../store/useRecordingStore';
import { useUserFolderStore } from '../../store/useUserFolderStore';
import { useFolderListLayoutStore } from '../../store/useFolderListLayoutStore';
import { GlassAddFolderButton, GlassCircleIconButton } from './GlassAddFolderButton';
import { FolderListViewOptionsSheet } from './FolderListViewOptionsSheet';

import { resolveRecordingFolder } from '../../lib/folders/recordingFolder';
import { Spacing, Typography } from '../../lib/theme';
import { BUILT_IN_FOLDERS } from '../../constants/builtInFolders';
import { FolderUserSwipeableRow } from './FolderUserSwipeableRow';



export const MAX_USER_FOLDERS_PREVIEW = 6;

interface FolderTile {
  id: string;
  name: string;
  folderType: 'built-in' | 'user';
  icon: string;
  accent: string;
  count: number;
  /** User folders only; pinned items sort to the top of Your folders. */
  pinned?: boolean;
}

type Section = { title: string; data: FolderTile[]; showSeeAll?: boolean };

export interface LibraryFolderBrowserProps {
  /** When set, only this many user folders are shown; "See all" appears if there are more. */
  maxUserFolders?: number;
  /** When true, back control and {@link stackTitle} for the full-folder stack screen. */
  showBack?: boolean;
  /** Large title when `showBack` (default "All folders"). */
  stackTitle?: string;
}

export function LibraryFolderBrowser({
  maxUserFolders,
  showBack = false,
  stackTitle = 'All folders',
}: LibraryFolderBrowserProps) {
  const router = useRouter();
  const recordings = useRecordingStore((s) => s.recordings);
  const { folders, loadFolders, addFolder, toggleFolderPinned } = useUserFolderStore();
  const layout = useFolderListLayoutStore((s) => s.layout);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [viewSheetVisible, setViewSheetVisible] = useState(false);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const countForBuiltIn = useCallback(
    (id: string) => {
      if (id === 'all') return recordings.length;
      if (id === 'unlisted') {
        return recordings.filter(
          (r) => r.deletedAt == null && resolveRecordingFolder(r) === 'unlisted'
        ).length;
      }
      if (id === 'imports') {
        return recordings.filter((r) => r.deletedAt == null && !!r.isImported).length;
      }
      if (id === 'favorites') {
        return recordings.filter((r) => r.deletedAt == null && r.isFavorite).length;
      }
      if (id === 'archived') {
        return recordings.filter((r) => resolveRecordingFolder(r) === 'archived').length;
      }
      if (id === 'recently-deleted') {
        return recordings.filter((r) => resolveRecordingFolder(r) === 'recently-deleted').length;
      }
      return 0;
    },
    [recordings]
  );

  const countForUserFolder = useCallback(
    (id: string) => recordings.filter((r) => r.userFolderId === id).length,
    [recordings]
  );

  const { builtInTiles, userTiles } = useMemo(() => {
    const builtIn: FolderTile[] = BUILT_IN_FOLDERS.map((f) => ({
      id: f.id,
      name: f.name,
      folderType: 'built-in' as const,
      icon: f.icon,
      accent: f.accent,
      count: countForBuiltIn(f.id),
    }));
    const user: FolderTile[] = folders.map((f) => ({
      id: f.id,
      name: f.name,
      folderType: 'user' as const,
      icon: 'folder',
      accent: 'rgba(255,255,255,0.55)',
      count: countForUserFolder(f.id),
      pinned: !!f.pinned,
    }));
    return { builtInTiles: builtIn, userTiles: user };
  }, [folders, countForBuiltIn, countForUserFolder]);

  const sections = useMemo<Section[]>(() => {
    const limit = maxUserFolders ?? Infinity;
    const previewUser =
      Number.isFinite(limit) && userTiles.length > limit
        ? userTiles.slice(0, limit)
        : userTiles;
    const showSeeAll =
      Number.isFinite(limit) && userTiles.length > limit;

    const s: Section[] = [{ title: 'Built-in', data: builtInTiles }];
    if (userTiles.length > 0) {
      s.push({
        title: 'Your folders',
        data: previewUser,
        showSeeAll,
      });
    }
    return s;
  }, [builtInTiles, userTiles, maxUserFolders]);

  const openFullFolders = useCallback(() => {
    router.push('/folder');
  }, [router]);

  const handleAddFolder = useCallback(() => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'New Folder',
        'Enter a name for the folder',
        (name) => {
          const trimmed = name?.trim();
          if (!trimmed) return;
          addFolder(trimmed).catch((err: unknown) =>
            Alert.alert('Error', err instanceof Error ? err.message : 'Could not create folder')
          );
        },
        'plain-text',
        ''
      );
    } else {
      setNewFolderName('');
      setAddModalVisible(true);
    }
  }, [addFolder]);

  const confirmAddFolder = useCallback(() => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    addFolder(trimmed)
      .then(() => {
        setAddModalVisible(false);
        setNewFolderName('');
      })
      .catch((err: unknown) =>
        Alert.alert('Error', err instanceof Error ? err.message : 'Could not create folder')
      );
  }, [addFolder, newFolderName]);

  const openFolder = useCallback(
    (folderId: string, folderName: string, folderType: 'built-in' | 'user') => {
      router.push({ pathname: `/folder/${folderId}` as any, params: { folderName, folderType } });
    },
    [router]
  );

  const handleToggleUserFolderPin = useCallback(
    (id: string) => {
      void toggleFolderPinned(id).catch((err: unknown) =>
        Alert.alert('Error', err instanceof Error ? err.message : 'Could not update folder')
      );
    },
    [toggleFolderPinned]
  );

  const renderGridFolderCard = useCallback(
    (f: FolderTile) => {
      const cardInner = (
        <View
          style={[
            styles.folderCardInner,
            f.folderType === 'user' && styles.folderCardUser,
            f.folderType === 'user' && f.pinned && styles.folderCardPinned,
          ]}
        >
          {f.folderType === 'user' && f.pinned ? (
            <View style={styles.gridPinBadge} accessibilityLabel="Pinned folder">
              <Ionicons name="pin" size={14} color="#FFD60A" />
            </View>
          ) : null}
          <View style={styles.folderTop}>
            <View
              style={[
                styles.folderIconBadge,
                {
                  backgroundColor: folderIconBadgeBackground(
                    f.accent,
                    f.folderType === 'user'
                  ),
                },
              ]}
            >
              <Ionicons name={f.icon as any} size={22} color={f.accent} />
            </View>
          </View>
          <View style={styles.folderTextRow}>
            <Text style={styles.gridFolderName} numberOfLines={2}>
              {f.name}
            </Text>
            <Text style={styles.gridFolderCount}>
              {f.count} {f.count === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>
      );

      if (f.folderType === 'user') {
        return (
          <View key={f.id} style={styles.folderCard}>
            <FolderUserSwipeableRow
              pinned={!!f.pinned}
              onPress={() => openFolder(f.id, f.name, f.folderType)}
              onTogglePin={() => handleToggleUserFolderPin(f.id)}
              pinInteractionEnabled
              layout="grid"
            >
              {cardInner}
            </FolderUserSwipeableRow>
          </View>
        );
      }

      return (
        <TouchableOpacity
          key={f.id}
          style={styles.folderCard}
          activeOpacity={0.85}
          onPress={() => openFolder(f.id, f.name, f.folderType)}
        >
          {cardInner}
        </TouchableOpacity>
      );
    },
    [openFolder, handleToggleUserFolderPin]
  );

  const listIconBackground = useCallback((f: FolderTile) => {
    if (f.folderType === 'user') return 'rgba(255,255,255,0.1)';
    if (f.accent.startsWith('rgba')) return 'rgba(255,255,255,0.12)';
    return `${f.accent}33`;
  }, []);

  const renderListItem = useCallback(
    ({ item: f }: { item: FolderTile }) => {
      const rowContent = (
        <View
          style={[
            styles.folderRow,
            f.folderType === 'user' && f.pinned && styles.folderRowPinned,
          ]}
        >
          <View style={[styles.folderIconWrap, { backgroundColor: listIconBackground(f) }]}>
            <Ionicons
              name={f.icon as any}
              size={22}
              color={f.folderType === 'user' ? 'rgba(255,255,255,0.7)' : f.accent}
            />
          </View>
          <View style={styles.folderInfo}>
            <View style={styles.folderTitleRow}>
              <Text style={styles.listFolderName} numberOfLines={1}>
                {f.name}
              </Text>
              {f.folderType === 'user' && f.pinned ? (
                <Ionicons
                  name="pin"
                  size={14}
                  color="#FFD60A"
                  style={styles.pinIconList}
                  accessibilityLabel="Pinned"
                />
              ) : null}
            </View>
            <Text style={styles.folderCount}>
              {f.count} {f.count === 1 ? 'recording' : 'recordings'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
        </View>
      );

      if (f.folderType === 'user') {
        return (
          <FolderUserSwipeableRow
            pinned={!!f.pinned}
            onPress={() => openFolder(f.id, f.name, f.folderType)}
            onTogglePin={() => handleToggleUserFolderPin(f.id)}
            pinInteractionEnabled
            layout="list"
          >
            {rowContent}
          </FolderUserSwipeableRow>
        );
      }

      return (
        <TouchableOpacity
          onPress={() => openFolder(f.id, f.name, f.folderType)}
          activeOpacity={0.85}
        >
          {rowContent}
        </TouchableOpacity>
      );
    },
    [openFolder, listIconBackground, handleToggleUserFolderPin]
  );

  const listKeyExtractor = useCallback((item: FolderTile) => item.id, []);

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => {
      const isFirst = section.title === 'Built-in';
      return (
        <View style={[styles.sectionHeaderRow, isFirst && styles.sectionHeaderRowFirst]}>
          <Text style={styles.sectionLabel}>{section.title}</Text>
          {section.showSeeAll ? (
            <TouchableOpacity
              onPress={openFullFolders}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="See all folders"
              accessibilityHint="Opens the full list of your folders"
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
        </View>
      );
    },
    [openFullFolders]
  );

  const pageTitle = showBack ? stackTitle : 'Library';

  return (
    <>
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerIconBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityHint="Returns to the previous screen"
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.pageTitle, showBack && styles.pageTitleWithBack]} numberOfLines={1}>
          {pageTitle}
        </Text>
        <View style={styles.headerRight}>
          <GlassAddFolderButton onPress={handleAddFolder} />
          <GlassCircleIconButton
            ionIcon="ellipsis-horizontal"
            iconSize={22}
            onPress={() => setViewSheetVisible(true)}
            accessibilityLabel="View options"
            accessibilityHint="Choose list or grid layout for folders"
          />
        </View>
      </View>

      {layout === 'list' ? (
        <SectionList
          sections={sections}
          keyExtractor={listKeyExtractor}
          renderItem={renderListItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section, idx) => (
            <View key={section.title}>
              <View style={[styles.sectionHeaderRow, idx === 0 && styles.sectionHeaderRowFirst]}>
                <Text style={styles.sectionLabel}>{section.title}</Text>
                {section.showSeeAll ? (
                  <TouchableOpacity
                    onPress={openFullFolders}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="See all folders"
                    accessibilityHint="Opens the full list of your folders"
                  >
                    <Text style={styles.seeAll}>See all</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}
              </View>
              <View style={styles.folderGrid}>
                {section.data.map((f) => renderGridFolderCard(f))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <FolderListViewOptionsSheet
        visible={viewSheetVisible}
        onClose={() => setViewSheetVisible(false)}
      />

      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddModalVisible(false)}
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
                    onPress={() => setAddModalVisible(false)}
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
    </>
  );
}

function folderIconBadgeBackground(accent: string, isUser: boolean): string {
  if (accent.startsWith('rgba')) {
    return 'rgba(255,255,255,0.08)';
  }
  const h = accent.replace('#', '');
  if (h.length !== 6) return 'rgba(255,255,255,0.08)';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${isUser ? 0.1 : 0.14})`;
}

const styles = StyleSheet.create({
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
  pageTitleWithBack: {
    marginLeft: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollView: { flex: 1 },
  gridContent: {
    flexGrow: 1,
    paddingTop: Spacing.xs,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: 100,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: Spacing.xs,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: 100,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionHeaderRowFirst: {
    marginTop: Spacing.xs,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  seeAll: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(10,132,255,0.92)',
  },
  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  folderCard: {
    width: '48.5%',
    marginBottom: 12,
  },
  folderCardInner: {
    position: 'relative',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 108,
    justifyContent: 'space-between',
    backgroundColor: '#0C0C0C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  folderCardUser: {
    backgroundColor: '#080808',
  },
  folderCardPinned: {
    borderColor: 'rgba(255,214,10,0.42)',
    backgroundColor: 'rgba(255,214,10,0.04)',
  },
  gridPinBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 4,
  },
  folderTop: {
    marginBottom: 10,
  },
  folderIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderTextRow: {
    gap: 4,
  },
  gridFolderName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.94)',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  gridFolderCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.42)',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  folderRowPinned: {
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255,214,10,0.85)',
    paddingLeft: 9,
    marginLeft: -1,
  },
  folderIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderInfo: { flex: 1 },
  folderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  listFolderName: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.94)',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  pinIconList: {
    marginTop: 1,
  },
  folderCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.42)',
    fontWeight: '500',
    letterSpacing: 0.1,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContentWrap: {
    width: '100%',
    maxWidth: 340,
  },
  addFolderModal: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  addFolderModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  addFolderInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  addFolderModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  addFolderModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.screenHorizontal,
  },
  addFolderModalBtnCancel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
  },
  addFolderModalBtnPrimary: {
    backgroundColor: 'rgba(10,132,255,0.95)',
    borderRadius: 10,
  },
  addFolderModalBtnPrimaryText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
