import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildLibraryFolderSections } from './buildLibraryFolderSections';
import type { FolderTile } from './libraryFolderModel';
const builtIn: FolderTile = {
  id: 'all',
  name: 'All',
  folderType: 'built-in',
  icon: 'albums',
  accent: '#000',
  count: 3,
};
const userA: FolderTile = {
  id: 'u1',
  name: 'Alpha',
  folderType: 'user',
  icon: 'folder',
  accent: '#111',
  count: 1,
  pinned: true,
};
const userB: FolderTile = {
  id: 'u2',
  name: 'Beta',
  folderType: 'user',
  icon: 'folder',
  accent: '#222',
  count: 0,
};
describe('buildLibraryFolderSections', () => {
  it('builds pinned stack list when showBack and filter is pinned', () => {
    const sections = buildLibraryFolderSections({
      builtInTiles: [builtIn],
      utilityTiles: [],
      userTiles: [userA, userB],
      allUserTilesByName: [userA, userB],
      maxYourFolders: 5,
      showBack: true,
      folderListFilter: 'pinned',
    });
    assert.equal(sections.length, 1);
    assert.equal(sections[0].title, 'Pinned');
    assert.equal(sections[0].data.length, 1);
    assert.equal(sections[0].data[0].id, 'u1');
  });
  it('includes pinned row and your folders preview on library tab', () => {
    const sections = buildLibraryFolderSections({
      builtInTiles: [builtIn],
      utilityTiles: [],
      userTiles: [userA, userB],
      allUserTilesByName: [userA, userB],
      maxPinnedFolders: 2,
      maxYourFolders: 1,
      showBack: false,
    });
    const pinned = sections.find((s) => s.variant === 'pinned-row');
    const yours = sections.find((s) => s.title === 'Your folders');
    assert.ok(pinned);
    assert.equal(pinned?.pinnedRowData?.length, 1);
    assert.ok(yours);
    assert.equal(yours?.data.length, 1);
    assert.equal(yours?.showSeeAll, true);
  });
});
