import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  SectionList,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useUserFolderStore } from '@/context/useUserFolderStore';
import { useFolderListLayoutStore } from '@/context/useFolderListLayoutStore';
import { LibraryHeader } from './LibraryHeader';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { TextInputDialog } from '@/components/ui/TextInputDialog';
import { computeLibraryFolderCounts } from '@/utils/folders/folderCounts';
import { resolveRecordingFolder } from '@/utils/folders/recordingFolder';
import { showUserFolderActions } from '@/utils/folders/userFolderActions';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';
import {
  BUILT_IN_LIBRARY_FOLDERS,
  BUILT_IN_UTILITY_FOLDERS,
  type BuiltInFolderDef,
} from '@/constants/builtInFolders';
import {
  MAX_YOUR_FOLDERS_PREVIEW,
  type UserFolderListFilter,
} from '@/constants/userFolders';
import { FolderUserSwipeableRow } from './FolderUserSwipeableRow';

const LIST_BOTTOM_PADDING = 140;
/** Matches {@link styles.folderCard} width in the two-column grid. */
const FOLDER_GRID_CARD_WIDTH_RATIO = 0.485;

function useFolderGridCardWidth(): number {
  const { width: windowWidth } = useWindowDimensions();
  return (windowWidth - 2 * Spacing.md) * FOLDER_GRID_CARD_WIDTH_RATIO;
}

function folderItemCountLabel(count: number, variant: 'grid' | 'list'): string {
  if (variant === 'grid') {
    return `${count} ${count === 1 ? 'item' : 'items'}`;
  }
  return `${count} ${count === 1 ? 'recording' : 'recordings'}`;
}

function userFolderCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'folder' : 'folders'}`;
}

interface FolderTile {
  id: string;
  name: string;
  folderType: 'built-in' | 'user';
  icon: string;
  accent: string;
  count: number;
  /** User folders only; shown in the Pinned section when true. */
  pinned?: boolean;
}

const UTILITIES_SECTION_TITLE = 'Utilities';
/** Extra space between the pinned folder row and the Your folders header. */
const PINNED_TO_YOUR_FOLDERS_GAP = Spacing.md-4;

type Section = {
  title: string;
  data: FolderTile[];
  showSeeAll?: boolean;
  seeAllFilter?: UserFolderListFilter;
  variant?: 'default' | 'utility' | 'pinned-row' | 'empty-user-folders';
  emptyMessage?: string;
  /** Tiles for {@link variant} `pinned-row` (vertical list uses empty `data`). */
  pinnedRowData?: FolderTile[];
  hideHeader?: boolean;
  /** Your folders: no pin badge, border, or list pin icon (pin state unchanged for actions). */
  plainUserFolders?: boolean;
};

export interface LibraryFolderBrowserProps {
  /** When set (Library tab), only pinned folders are shown, up to this limit; "See all" opens all folders. */
  maxPinnedFolders?: number;
  /** User folders previewed under Your folders, alphabetical (defaults to {@link MAX_YOUR_FOLDERS_PREVIEW}). */
  maxYourFolders?: number;
  /** When true, back control and {@link stackTitle} for the full-folder stack screen. */
  showBack?: boolean;
  /** Large title when `showBack` (overrides filter default). */
  stackTitle?: string;
  /** Full-list mode when opened from a section’s See all. */
  folderListFilter?: UserFolderListFilter;
}

export function LibraryFolderBrowser({
  maxPinnedFolders,
  maxYourFolders = MAX_YOUR_FOLDERS_PREVIEW,
  showBack = false,
  stackTitle,
  folderListFilter,
}: LibraryFolderBrowserProps) {
  const folderGridCardWidth = useFolderGridCardWidth();
  const { scrollPaddingTop } = useTopChromeLayout();
  const router = useRouter();
  const recordings = useRecordingStore((s) => s.recordings);
  const updateRecording = useRecordingStore((s) => s.updateRecording);
  const {
    folders,
    loadFolders,
    addFolder,
    renameFolder,
    deleteFolder,
    toggleFolderPinned,
  } = useUserFolderStore();
  const layout = useFolderListLayoutStore((s) => s.layout);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [renameFolderTarget, setRenameFolderTarget] = useState<FolderTile | null>(null);
  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const folderCounts = useMemo(
    () => computeLibraryFolderCounts(recordings),
    [recordings],
  );

  const countForBuiltIn = useCallback(
    (id: string) => {
      switch (id) {
        case 'all':
          return folderCounts.all;
        case 'unlisted':
          return folderCounts.unlisted;
        case 'imports':
          return folderCounts.imports;
        case 'favorites':
          return folderCounts.favorites;
        case 'archived':
          return folderCounts.archived;
        case 'recently-deleted':
          return folderCounts.recentlyDeleted;
        default:
          return 0;
      }
    },
    [folderCounts],
  );

  const countForUserFolder = useCallback(
    (id: string) => folderCounts.byUserFolderId.get(id) ?? 0,
    [folderCounts],
  );

  const mapBuiltInTile = useCallback(
    (f: BuiltInFolderDef): FolderTile => ({
      id: f.id,
      name: f.name,
      folderType: 'built-in' as const,
      icon: f.icon,
      accent: f.accent,
      count: countForBuiltIn(f.id),
    }),
    [countForBuiltIn]
  );

  const { builtInTiles, utilityTiles, userTiles } = useMemo(() => {
    const builtIn = BUILT_IN_LIBRARY_FOLDERS.map(mapBuiltInTile);
    const utility = BUILT_IN_UTILITY_FOLDERS.map(mapBuiltInTile);
    const user: FolderTile[] = folders.map((f) => ({
      id: f.id,
      name: f.name,
      folderType: 'user' as const,
      icon: 'folder',
      accent: 'rgba(255,255,255,0.55)',
      count: countForUserFolder(f.id),
      pinned: !!f.pinned,
    }));
    return { builtInTiles: builtIn, utilityTiles: utility, userTiles: user };
  }, [folders, mapBuiltInTile, countForUserFolder]);

  const appendUtilitySection = useCallback(
    (s: Section[]) => {
      if (utilityTiles.length > 0) {
        s.push({
          title: UTILITIES_SECTION_TITLE,
          data: utilityTiles,
          variant: 'utility',
        });
      }
      return s;
    },
    [utilityTiles]
  );

  const allUserTilesByName = useMemo(
    () =>
      [...userTiles].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      ),
    [userTiles]
  );

  const sections = useMemo<Section[]>(() => {
    if (showBack && folderListFilter === 'pinned') {
      const pinned = userTiles.filter((t) => t.pinned);
      return pinned.length > 0
        ? [{ title: 'Pinned', data: pinned, hideHeader: true }]
        : [
            {
              title: 'Pinned',
              data: [],
              hideHeader: true,
              variant: 'empty-user-folders',
              emptyMessage: 'No pinned folders',
            },
          ];
    }

    if (showBack && folderListFilter === 'all-user') {
      return allUserTilesByName.length > 0
        ? [
            {
              title: 'Your folders',
              data: allUserTilesByName,
              hideHeader: true,
              plainUserFolders: true,
            },
          ]
        : [
            {
              title: 'Your folders',
              data: [],
              hideHeader: true,
              variant: 'empty-user-folders',
            },
          ];
    }

    const systemSection: Section = {
      title: userFolderCountLabel(userTiles.length),
      data: builtInTiles,
    };
    const s: Section[] = [systemSection];

    if (maxPinnedFolders != null) {
      const pinnedTiles = userTiles.filter((t) => t.pinned);
      const previewYourFolders = allUserTilesByName.slice(0, maxYourFolders);

      if (pinnedTiles.length > 0) {
        s.push({
          title: 'Pinned',
          data: [],
          pinnedRowData: pinnedTiles,
          variant: 'pinned-row',
          showSeeAll: pinnedTiles.length > maxPinnedFolders,
          seeAllFilter: 'pinned',
        });
      }

      if (userTiles.length > 0) {
        s.push({
          title: 'Your folders',
          data: previewYourFolders,
          showSeeAll: userTiles.length > maxYourFolders,
          seeAllFilter: 'all-user',
          plainUserFolders: true,
        });
      } else {
        s.push({
          title: 'Your folders',
          data: [],
          variant: 'empty-user-folders',
        });
      }

      return appendUtilitySection(s);
    }

    if (userTiles.length > 0) {
      s.push({ title: 'Folders', data: userTiles });
    } else {
      s.push({ title: 'Folders', data: [], variant: 'empty-user-folders' });
    }
    return appendUtilitySection(s);
  }, [
    builtInTiles,
    userTiles,
    allUserTilesByName,
    utilityTiles,
    maxPinnedFolders,
    maxYourFolders,
    showBack,
    folderListFilter,
    appendUtilitySection,
  ]);

  const openSeeAll = useCallback(
    (filter: UserFolderListFilter) => {
      router.push({ pathname: '/folder', params: { list: filter } });
    },
    [router]
  );

  const handleAddFolder = useCallback(() => {
    setAddModalVisible(true);
  }, []);

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

  const handleUserFolderLongPress = useCallback(
    (folder: FolderTile) => {
      const recordingCount = recordings.filter((r) => r.userFolderId === folder.id).length;

      showUserFolderActions(
        folder.name,
        !!folder.pinned,
        {
          onRename: (newName) =>
            renameFolder(folder.id, newName).catch((err: unknown) =>
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not rename folder')
            ),
          onTogglePin: () => handleToggleUserFolderPin(folder.id),
          onDelete: () => {
            Alert.alert(
              'Delete Folder',
              recordingCount > 0
                ? `Delete "${folder.name}"? ${recordingCount} recording${recordingCount === 1 ? '' : 's'} will move to Unlisted.`
                : `Delete "${folder.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    void (async () => {
                      try {
                        const inFolder = recordings.filter((r) => r.userFolderId === folder.id);
                        await Promise.all(
                          inFolder.map((r) => updateRecording(r.id, { userFolderId: undefined }))
                        );
                        await deleteFolder(folder.id);
                      } catch (err: unknown) {
                        Alert.alert(
                          'Error',
                          err instanceof Error ? err.message : 'Could not delete folder'
                        );
                      }
                    })();
                  },
                },
              ]
            );
          },
        },
        () => {
          // Store the active folder for rename in state to render the dialog
          setRenameFolderTarget(folder);
        }
      );
    },
    [recordings, renameFolder, deleteFolder, handleToggleUserFolderPin, updateRecording]
  );

  const renderGridFolderCard = useCallback(
    (f: FolderTile, showPinnedChrome = true) => {
      const showPinVisuals =
        showPinnedChrome && f.folderType === 'user' && !!f.pinned;
      const cardInner = (
        <View
          style={[
            styles.folderCardInner,
            f.folderType === 'user' && styles.folderCardUser,
            showPinVisuals && styles.folderCardPinned,
          ]}
        >
          <Text style={styles.folderCountBadge}>
            {folderItemCountLabel(f.count, 'grid')}
          </Text>
          {showPinVisuals ? (
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
          <Text style={styles.gridFolderName} numberOfLines={2}>
            {f.name}
          </Text>
        </View>
      );

      if (f.folderType === 'user') {
        return (
          <View key={f.id} style={styles.folderCard}>
            <FolderUserSwipeableRow
              pinned={!!f.pinned}
              onPress={() => openFolder(f.id, f.name, f.folderType)}
              onTogglePin={() => handleToggleUserFolderPin(f.id)}
              onLongPress={() => handleUserFolderLongPress(f)}
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
    [openFolder, handleToggleUserFolderPin, handleUserFolderLongPress]
  );

  const renderPinnedFolderCard = useCallback(
    (f: FolderTile) => (
      <View key={f.id} style={[styles.pinnedCard, { width: folderGridCardWidth }]}>
        <Pressable
          style={[
            styles.folderCardInner,
            styles.folderCardUser,
            f.pinned && styles.folderCardPinned,
          ]}
          onPress={() => openFolder(f.id, f.name, f.folderType)}
          onLongPress={() => handleUserFolderLongPress(f)}
          delayLongPress={450}
          accessibilityRole="button"
          accessibilityLabel={f.name}
          accessibilityHint="Long press for folder options"
        >
          <Text style={styles.folderCountBadge}>
            {folderItemCountLabel(f.count, 'grid')}
          </Text>
          <View style={styles.gridPinBadge} accessibilityLabel="Pinned folder">
            <Ionicons name="pin" size={14} color="#FFD60A" />
          </View>
          <View style={styles.folderTop}>
            <View
              style={[
                styles.folderIconBadge,
                {
                  backgroundColor: folderIconBadgeBackground(
                    f.accent,
                    true
                  ),
                },
              ]}
            >
              <Ionicons name={f.icon as any} size={22} color={f.accent} />
            </View>
          </View>
          <Text style={styles.gridFolderName} numberOfLines={2}>
            {f.name}
          </Text>
        </Pressable>
      </View>
    ),
    [folderGridCardWidth, openFolder, handleUserFolderLongPress]
  );

  const renderPinnedRow = useCallback(
    (tiles: FolderTile[]) => (
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pinnedRowScroll}
        style={styles.pinnedRow}
      >
        {tiles.map((f) => renderPinnedFolderCard(f))}
      </ScrollView>
    ),
    [renderPinnedFolderCard]
  );

  const listIconBackground = useCallback((f: FolderTile) => {
    if (f.folderType === 'user') return 'rgba(255,255,255,0.1)';
    if (f.accent.startsWith('rgba')) return 'rgba(255,255,255,0.12)';
    return `${f.accent}33`;
  }, []);

  const renderUtilityRow = useCallback(
    (f: FolderTile) => (
      <TouchableOpacity
        style={styles.utilityRow}
        activeOpacity={0.85}
        onPress={() => openFolder(f.id, f.name, f.folderType)}
        accessibilityRole="button"
        accessibilityLabel={f.name}
      >
        <Ionicons name={f.icon as any} size={22} color={Colors.subtext} />
        <Text style={styles.utilityLabel} numberOfLines={1}>
          {f.name}
        </Text>
      </TouchableOpacity>
    ),
    [openFolder]
  );

  const renderListItem = useCallback(
    ({ item: f, showPinnedChrome = true }: { item: FolderTile; showPinnedChrome?: boolean }) => {
      const showPinVisuals =
        showPinnedChrome && f.folderType === 'user' && !!f.pinned;
      const rowContent = (
        <View
          style={[
            styles.folderRow,
            showPinVisuals && styles.folderRowPinned,
          ]}
        >
          <Text style={[styles.folderCountBadge, styles.folderCountBadgeList]}>
            {folderItemCountLabel(f.count, 'list')}
          </Text>
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
              {showPinVisuals ? (
                <Ionicons
                  name="pin"
                  size={14}
                  color="#FFD60A"
                  style={styles.pinIconList}
                  accessibilityLabel="Pinned"
                />
              ) : null}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.subtext} />
        </View>
      );

      if (f.folderType === 'user') {
        return (
          <FolderUserSwipeableRow
            pinned={!!f.pinned}
            onPress={() => openFolder(f.id, f.name, f.folderType)}
            onTogglePin={() => handleToggleUserFolderPin(f.id)}
            onLongPress={() => handleUserFolderLongPress(f)}
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
    [openFolder, listIconBackground, handleToggleUserFolderPin, handleUserFolderLongPress]
  );

  const listKeyExtractor = useCallback((item: FolderTile) => item.id, []);

  const renderNoFoldersPlaceholder = useCallback(
    (message = 'No folders') => (
      <View style={styles.emptyFoldersCard} accessibilityRole="text">
        <Ionicons name="folder-open-outline" size={22} color={Colors.subtext} />
        <Text style={styles.emptyFoldersText}>{message}</Text>
      </View>
    ),
    []
  );

  const renderSectionItem = useCallback(
    ({ item, section }: { item: FolderTile; section: Section }) => {
      if (section.variant === 'pinned-row') {
        return null;
      }
      if (section.variant === 'utility') {
        return renderUtilityRow(item);
      }
      return renderListItem({
        item,
        showPinnedChrome: !section.plainUserFolders,
      });
    },
    [renderListItem, renderUtilityRow]
  );

  const renderSectionFooter = useCallback(
    ({ section }: { section: Section }) => {
      if (section.variant === 'empty-user-folders') {
        return renderNoFoldersPlaceholder(section.emptyMessage);
      }
      if (section.variant !== 'pinned-row' || !section.pinnedRowData?.length) {
        return null;
      }
      return renderPinnedRow(section.pinnedRowData);
    },
    [renderNoFoldersPlaceholder, renderPinnedRow]
  );

  const renderSectionHeaderContent = useCallback(
    (section: Section) => (
      <View style={[styles.sectionHeaderRow, styles.sectionHeaderRowList]}>
        <Text style={styles.sectionLabel}>{section.title}</Text>
        {section.showSeeAll && section.seeAllFilter ? (
          <TouchableOpacity
            onPress={() => openSeeAll(section.seeAllFilter!)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="See all folders"
            accessibilityHint={
              section.seeAllFilter === 'pinned'
                ? 'Opens all pinned folders'
                : 'Opens all your folders'
            }
          >
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    ),
    [openSeeAll],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => {
      if (section.hideHeader) return null;
      return renderSectionHeaderContent(section);
    },
    [renderSectionHeaderContent],
  );

  const pageTitle = useMemo(() => {
    if (!showBack) return 'Library';
    if (stackTitle) return stackTitle;
    if (folderListFilter === 'pinned') return 'Pinned';
    if (folderListFilter === 'all-user') return 'Your folders';
    return 'All folders';
  }, [showBack, stackTitle, folderListFilter]);

  return (
    <View style={styles.page}>
      {layout === 'list' ? (
        <SectionList
          sections={sections}
          keyExtractor={listKeyExtractor}
          renderItem={renderSectionItem}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          contentContainerStyle={[styles.listContent, { paddingTop: scrollPaddingTop }]}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={({ section }) => {
            if (section.variant === 'pinned-row') return null;
            if (section.variant === 'utility') {
              return <View style={styles.utilityItemGap} />;
            }
            return <View style={styles.itemGap} />;
          }}
          SectionSeparatorComponent={({ leadingSection }) => (
            <View
              style={
                leadingSection?.variant === 'pinned-row'
                  ? styles.pinnedToYourFoldersGap
                  : styles.sectionGap
              }
            />
          )}
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.gridContent, { paddingTop: scrollPaddingTop }]}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section) => (
            <View
              key={section.title}
              style={[
                styles.sectionBlock,
                section.variant === 'pinned-row' && styles.sectionBlockAfterPinned,
              ]}
            >
              {!section.hideHeader ? renderSectionHeaderContent(section) : null}
              {section.variant === 'pinned-row' && section.pinnedRowData ? (
                renderPinnedRow(section.pinnedRowData)
              ) : section.variant === 'empty-user-folders' ? (
                renderNoFoldersPlaceholder(section.emptyMessage)
              ) : section.variant === 'utility' ? (
                <View style={styles.utilityList}>
                  {section.data.map((f) => (
                    <React.Fragment key={f.id}>
                      {renderUtilityRow(f)}
                    </React.Fragment>
                  ))}
                </View>
              ) : (
                <View style={styles.folderGrid}>
                  {section.data.map((f) =>
                    renderGridFolderCard(f, !section.plainUserFolders)
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      <TextInputDialog
        visible={addModalVisible}
        title="New Folder"
        message="Enter a name for the folder"
        placeholder="Folder name"
        submitLabel="Create"
        onSubmit={(text) => {
          setAddModalVisible(false);
          addFolder(text).catch((err: unknown) =>
            Alert.alert('Error', err instanceof Error ? err.message : 'Could not create folder')
          );
        }}
        onCancel={() => setAddModalVisible(false)}
      />

      <LibraryHeader
        title={pageTitle}
        showBack={showBack}
        onBack={() => router.back()}
        onAddFolder={handleAddFolder}
      />

      <TextInputDialog
        visible={!!renameFolderTarget}
        title="Rename Folder"
        defaultValue={renameFolderTarget?.name ?? ''}
        placeholder="Folder name"
        submitLabel="Rename"
        onSubmit={(text) => {
          if (renameFolderTarget) {
            renameFolder(renameFolderTarget.id, text).catch((err: unknown) =>
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not rename folder')
            );
          }
          setRenameFolderTarget(null);
        }}
        onCancel={() => setRenameFolderTarget(null)}
      />
    </View>
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
  page: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: { flex: 1 },
  gridContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: LIST_BOTTOM_PADDING,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: LIST_BOTTOM_PADDING,
  },
  itemGap: {
    height: 12,
  },
  sectionGap: {
    height: Spacing.sm,
  },
  pinnedToYourFoldersGap: {
    height: PINNED_TO_YOUR_FOLDERS_GAP,
  },
  sectionBlock: {
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  sectionBlockAfterPinned: {
    marginBottom: PINNED_TO_YOUR_FOLDERS_GAP,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
  sectionHeaderRowList: {
    marginBottom: Spacing.xs,
  },
  sectionLabel: withAppFont({
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 16,
    color: Colors.subtext,
  }),
  seeAll: withAppFont({
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  }),
  emptyFoldersCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  emptyFoldersText: withAppFont({
    fontSize: 15,
    fontWeight: '500',
    color: Colors.subtext,
    textAlign: 'center',
  }),
  pinnedRow: {
    marginHorizontal: -Spacing.md,
  },
  pinnedRowScroll: {
    paddingHorizontal: Spacing.md,
  },
  pinnedCard: {
    marginRight: 12,
  },
  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  folderCard: {
    width: '48.5%',
    marginBottom: 12,
  },
  folderCardInner: {
    position: 'relative',
    borderRadius: BorderRadius.cardXL,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 98,
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
  },
  folderCardUser: {},
  folderCardPinned: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,214,10,0.42)',
  },
  folderCountBadge: withAppFont({
    position: 'absolute',
    top: 12,
    right: 12,
    fontSize: 14,
    color: Colors.subtext,
    zIndex: 1,
  }),
  folderCountBadgeList: {
    right: 36,
  },
  gridPinBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
    padding: 4,
  },
  folderTop: {
    marginBottom: 10,
  },
  folderIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridFolderName: withAppFont({
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
    paddingRight: 40,
  }),
  folderRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  folderRowPinned: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,214,10,0.42)',
  },
  folderIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  folderInfo: { flex: 1 },
  folderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  listFolderName: withAppFont({
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
  }),
  pinIconList: {
    marginTop: 1,
  },
  utilityList: {
    marginBottom: Spacing.md,
    gap: 4,
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  utilityLabel: withAppFont({
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: Colors.textPrimary,
  }),
  utilityItemGap: {
    height: 4,
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
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  addFolderModalTitle: withAppFont({
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  }),
  addFolderInput: withAppFont({
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  }),
  addFolderModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  addFolderModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
  },
  addFolderModalBtnCancel: withAppFont({
    fontSize: 16,
    color: Colors.subtext,
    fontWeight: '600',
  }),
  addFolderModalBtnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  addFolderModalBtnPrimaryText: withAppFont({
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  }),
});
