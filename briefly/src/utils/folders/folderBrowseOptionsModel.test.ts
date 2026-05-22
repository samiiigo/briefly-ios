import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shouldShowFolderFavoritesFilter } from './folderBrowseOptionsModel';
describe('shouldShowFolderFavoritesFilter', () => {
  it('hides filter on built-in favorites folder', () => {
    assert.equal(shouldShowFolderFavoritesFilter('built-in', 'favorites'), false);
  });
  it('shows filter on other built-in folders', () => {
    assert.equal(shouldShowFolderFavoritesFilter('built-in', 'all'), true);
  });
  it('shows filter on user folders', () => {
    assert.equal(shouldShowFolderFavoritesFilter('user', 'uf1'), true);
  });
});
