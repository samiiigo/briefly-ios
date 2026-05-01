import { UserFolder } from '../../types';

/** Pinned first (newest pin first), then unpinned (name A–Z). */
export function sortUserFolders(folders: UserFolder[]): UserFolder[] {
  return [...folders].sort((a, b) => {
    const aP = !!a.pinned;
    const bP = !!b.pinned;
    if (aP !== bP) return aP ? -1 : 1;
    if (aP && bP) return (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0);
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}
