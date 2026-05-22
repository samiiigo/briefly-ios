import {
  type FolderTile,
  type LibraryFolderSection,
  UTILITIES_SECTION_TITLE,
  userFolderCountLabel,
} from './libraryFolderModel';
import type { UserFolderListFilter } from '@/constants/userFolders';
export interface BuildLibraryFolderSectionsInput {
  builtInTiles: FolderTile[];
  utilityTiles: FolderTile[];
  userTiles: FolderTile[];
  allUserTilesByName: FolderTile[];
  maxPinnedFolders?: number;
  maxYourFolders: number;
  showBack: boolean;
  folderListFilter?: UserFolderListFilter;
}
function appendUtilitySection(
  sections: LibraryFolderSection[],
  utilityTiles: FolderTile[],
): LibraryFolderSection[] {
  if (utilityTiles.length > 0) {
    sections.push({
      title: UTILITIES_SECTION_TITLE,
      data: utilityTiles,
      variant: 'utility',
    });
  }
  return sections;
}
export function buildLibraryFolderSections(
  input: BuildLibraryFolderSectionsInput,
): LibraryFolderSection[] {
  const {
    builtInTiles,
    utilityTiles,
    userTiles,
    allUserTilesByName,
    maxPinnedFolders,
    maxYourFolders,
    showBack,
    folderListFilter,
  } = input;
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
  const systemSection: LibraryFolderSection = {
    title: userFolderCountLabel(userTiles.length),
    data: builtInTiles,
  };
  const sections: LibraryFolderSection[] = [systemSection];
  if (maxPinnedFolders != null) {
    const pinnedTiles = userTiles.filter((t) => t.pinned);
    const previewYourFolders = allUserTilesByName.slice(0, maxYourFolders);
    if (pinnedTiles.length > 0) {
      sections.push({
        title: 'Pinned',
        data: [],
        pinnedRowData: pinnedTiles,
        variant: 'pinned-row',
        showSeeAll: pinnedTiles.length > maxPinnedFolders,
        seeAllFilter: 'pinned',
      });
    }
    if (userTiles.length > 0) {
      sections.push({
        title: 'Your folders',
        data: previewYourFolders,
        showSeeAll: userTiles.length > maxYourFolders,
        seeAllFilter: 'all-user',
        plainUserFolders: true,
      });
    } else {
      sections.push({
        title: 'Your folders',
        data: [],
        variant: 'empty-user-folders',
      });
    }
    return appendUtilitySection(sections, utilityTiles);
  }
  if (userTiles.length > 0) {
    sections.push({ title: 'Folders', data: userTiles });
  } else {
    sections.push({ title: 'Folders', data: [], variant: 'empty-user-folders' });
  }
  return appendUtilitySection(sections, utilityTiles);
}
