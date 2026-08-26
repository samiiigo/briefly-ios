import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  SectionList,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LibraryHeader } from './LibraryHeader';
import { useTopChromeLayout } from '@/navigation/layout/useTopChromeLayout';
import { TextInputDialog, AnchoredMenuModal } from '@briefly/ui/native';
import {
  folderIconBadgeBackground,
  folderIconColor,
  folderListIconBackground,
} from '@/features/library/utils/folderIconTheme';
import {
  useCreateStyles,
  useThemedColors,
  Spacing,
  BorderRadius,
  withAppFont,
} from '@briefly/theme/native';
import type { ColorPalette } from '@briefly/theme';
import { MAX_YOUR_FOLDERS_PREVIEW, type UserFolderListFilter } from '@briefly/config';
import {
  folderItemCountLabel,
  type FolderTile,
  type LibraryFolderSection,
} from '@/features/library/utils/libraryFolderModel';
import { useLibraryFolderBrowser } from '@/features/library/hooks/useLibraryFolderBrowser';

const LIST_BOTTOM_PADDING = 140;
/** Matches {@link styles.folderCard} width in the two-column grid. */
const FOLDER_GRID_CARD_WIDTH_RATIO = 0.485;
/** Extra space between the pinned folder row and the Your folders header. */
const PINNED_TO_YOUR_FOLDERS_GAP = Spacing.md - 4;

function useFolderGridCardWidth(): number {
  const { width: windowWidth } = useWindowDimensions();
  return (windowWidth - 2 * Spacing.md) * FOLDER_GRID_CARD_WIDTH_RATIO;
}

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
  const styles = useCreateStyles(createLibraryFolderBrowserStyles);
  const colors = useThemedColors();
  const folderGridCardWidth = useFolderGridCardWidth();
  const { scrollPaddingTop } = useTopChromeLayout();
  const router = useRouter();

  const {
    layout,
    sections,
    openSeeAll,
    handleAddFolder,
    openFolder,
    folderMenuItems,
    folderMenu,
    handleUserFolderLongPress,
    closeFolderMenu,
    addModalVisible,
    setAddModalVisible,
    renameFolderTarget,
    setRenameFolderTarget,
    submitNewFolderName,
    submitRenameFolder,
  } = useLibraryFolderBrowser({
    maxPinnedFolders,
    maxYourFolders,
    showBack,
    folderListFilter,
  });

  const renderGridFolderCard = useCallback(
    (f: FolderTile, showPinnedChrome = true) => {
      const showPinVisuals = showPinnedChrome && f.folderType === 'user' && !!f.pinned;
      const cardInner = (
        <View
          style={[
            styles.folderCardInner,
            f.folderType === 'user' && styles.folderCardUser,
            showPinVisuals && styles.folderCardPinned,
          ]}
        >
          <Text style={styles.folderCountBadge}>{folderItemCountLabel(f.count, 'grid')}</Text>
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
                    f.folderType === 'user',
                    colors,
                  ),
                },
              ]}
            >
              <Ionicons
                name={f.icon as any}
                size={22}
                color={folderIconColor(f.folderType, f.accent, colors)}
              />
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
            <Pressable
              onPress={() => openFolder(f.id, f.name, f.folderType)}
              onLongPress={(e) => handleUserFolderLongPress(f, e)}
              delayLongPress={450}
              accessibilityRole="button"
              accessibilityLabel={f.name}
              accessibilityHint="Long press for folder options"
            >
              {cardInner}
            </Pressable>
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
    [colors, openFolder, handleUserFolderLongPress, styles],
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
          onLongPress={(e) => handleUserFolderLongPress(f, e)}
          delayLongPress={450}
          accessibilityRole="button"
          accessibilityLabel={f.name}
          accessibilityHint="Long press for folder options"
        >
          <Text style={styles.folderCountBadge}>{folderItemCountLabel(f.count, 'grid')}</Text>
          <View style={styles.gridPinBadge} accessibilityLabel="Pinned folder">
            <Ionicons name="pin" size={14} color="#FFD60A" />
          </View>
          <View style={styles.folderTop}>
            <View
              style={[
                styles.folderIconBadge,
                {
                  backgroundColor: folderIconBadgeBackground(f.accent, true, colors),
                },
              ]}
            >
              <Ionicons
                name={f.icon as any}
                size={22}
                color={folderIconColor(f.folderType, f.accent, colors)}
              />
            </View>
          </View>
          <Text style={styles.gridFolderName} numberOfLines={2}>
            {f.name}
          </Text>
        </Pressable>
      </View>
    ),
    [colors, folderGridCardWidth, openFolder, handleUserFolderLongPress, styles],
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
    [renderPinnedFolderCard, styles],
  );

  const listIconBackground = useCallback(
    (f: FolderTile) => folderListIconBackground(f.accent, f.folderType === 'user', colors),
    [colors],
  );

  const renderUtilityRow = useCallback(
    (f: FolderTile) => (
      <TouchableOpacity
        style={styles.utilityRow}
        activeOpacity={0.85}
        onPress={() => openFolder(f.id, f.name, f.folderType)}
        accessibilityRole="button"
        accessibilityLabel={f.name}
      >
        <Ionicons name={f.icon as any} size={22} color={colors.subtext} />
        <Text style={styles.utilityLabel} numberOfLines={1}>
          {f.name}
        </Text>
      </TouchableOpacity>
    ),
    [openFolder, colors.subtext, styles],
  );

  const renderListItem = useCallback(
    ({ item: f, showPinnedChrome = true }: { item: FolderTile; showPinnedChrome?: boolean }) => {
      const showPinVisuals = showPinnedChrome && f.folderType === 'user' && !!f.pinned;
      const rowContent = (
        <View style={[styles.folderRow, showPinVisuals && styles.folderRowPinned]}>
          <Text style={[styles.folderCountBadge, styles.folderCountBadgeList]}>
            {folderItemCountLabel(f.count, 'list')}
          </Text>
          <View style={[styles.folderIconWrap, { backgroundColor: listIconBackground(f) }]}>
            <Ionicons
              name={f.icon as any}
              size={22}
              color={folderIconColor(f.folderType, f.accent, colors)}
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
          <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
        </View>
      );
      if (f.folderType === 'user') {
        return (
          <Pressable
            onPress={() => openFolder(f.id, f.name, f.folderType)}
            onLongPress={(e) => handleUserFolderLongPress(f, e)}
            delayLongPress={450}
            accessibilityRole="button"
            accessibilityLabel={f.name}
            accessibilityHint="Long press for folder options"
          >
            {rowContent}
          </Pressable>
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
    [colors, openFolder, listIconBackground, handleUserFolderLongPress, styles],
  );

  const listKeyExtractor = useCallback((item: FolderTile) => item.id, []);

  const renderNoFoldersPlaceholder = useCallback(
    (message = 'No folders') => (
      <View style={styles.emptyFoldersCard} accessibilityRole="text">
        <Ionicons name="folder-open-outline" size={22} color={colors.subtext} />
        <Text style={styles.emptyFoldersText}>{message}</Text>
      </View>
    ),
    [colors.subtext, styles],
  );

  const renderSectionItem = useCallback(
    ({ item, section }: { item: FolderTile; section: LibraryFolderSection }) => {
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
    [renderListItem, renderUtilityRow],
  );

  const renderSectionFooter = useCallback(
    ({ section }: { section: LibraryFolderSection }) => {
      if (section.variant === 'empty-user-folders') {
        return renderNoFoldersPlaceholder(section.emptyMessage);
      }
      if (section.variant !== 'pinned-row' || !section.pinnedRowData?.length) {
        return null;
      }
      return renderPinnedRow(section.pinnedRowData);
    },
    [renderNoFoldersPlaceholder, renderPinnedRow],
  );

  const renderSectionHeaderContent = useCallback(
    (section: LibraryFolderSection) => (
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
    [openSeeAll, styles],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: LibraryFolderSection }) => {
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
                    <React.Fragment key={f.id}>{renderUtilityRow(f)}</React.Fragment>
                  ))}
                </View>
              ) : (
                <View style={styles.folderGrid}>
                  {section.data.map((f) => renderGridFolderCard(f, !section.plainUserFolders))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
      {Platform.OS !== 'ios' ? (
        <TextInputDialog
          visible={addModalVisible}
          title="New Folder"
          placeholder="Folder name"
          submitLabel="Create"
          onSubmit={submitNewFolderName}
          onCancel={() => setAddModalVisible(false)}
        />
      ) : null}
      <LibraryHeader
        title={pageTitle}
        showBack={showBack}
        onBack={() => router.back()}
        onAddFolder={handleAddFolder}
        onSearch={() => router.push('/search')}
      />
      <AnchoredMenuModal
        visible={folderMenu.visible}
        anchor={folderMenu.anchor}
        items={folderMenuItems}
        onClose={closeFolderMenu}
        align="center"
      />
      {Platform.OS !== 'ios' ? (
        <TextInputDialog
          visible={!!renameFolderTarget}
          title="Rename Folder"
          defaultValue={renameFolderTarget?.name ?? ''}
          placeholder="Folder name"
          submitLabel="Rename"
          onSubmit={submitRenameFolder}
          onCancel={() => setRenameFolderTarget(null)}
        />
      ) : null}
    </View>
  );
}

function createLibraryFolderBrowserStyles(c: ColorPalette) {
  return StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: c.background,
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
      color: c.subtext,
    }),
    seeAll: withAppFont({
      fontSize: 15,
      fontWeight: '500',
      color: c.primary,
    }),
    emptyFoldersCard: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: c.card,
      borderRadius: BorderRadius.cardXL,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    emptyFoldersText: withAppFont({
      fontSize: 15,
      fontWeight: '500',
      color: c.subtext,
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
      backgroundColor: c.card,
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
      color: c.subtext,
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
      color: c.textPrimary,
      lineHeight: 22,
      paddingRight: 40,
    }),
    folderRow: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
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
      color: c.textPrimary,
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
      backgroundColor: c.card,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
    },
    utilityLabel: withAppFont({
      flex: 1,
      fontSize: 17,
      fontWeight: '400',
      color: c.textPrimary,
    }),
    utilityItemGap: {
      height: 4,
    },
  });
}
