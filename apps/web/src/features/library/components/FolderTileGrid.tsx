'use client';

import Link from 'next/link';
import { BUILT_IN_LIBRARY_FOLDERS, BUILT_IN_UTILITY_FOLDERS } from '@briefly/config';
import { Text } from '@briefly/ui';
import { useLibrary } from '@/features/library/hooks/useLibrary';

function folderCount(folderId: string, counts: ReturnType<typeof useLibrary>['counts']): number {
  switch (folderId) {
    case 'all':
      return counts.all;
    case 'unlisted':
      return counts.unlisted;
    case 'favorites':
      return counts.favorites;
    case 'archived':
      return counts.archived;
    case 'imports':
      return counts.imports;
    case 'recently-deleted':
      return counts.recentlyDeleted;
    default:
      return counts.byUserFolderId.get(folderId) ?? 0;
  }
}

export function FolderTileGrid() {
  const { folders, counts, loading } = useLibrary();

  if (loading) {
    return (
      <Text as="p" variant="caption">
        Loading library…
      </Text>
    );
  }

  return (
    <div className="folder-grid">
      <section className="folder-grid__section">
        <Text as="h2" variant="label">
          Library
        </Text>
        <div className="folder-grid__tiles">
          {BUILT_IN_LIBRARY_FOLDERS.map((folder) => (
            <Link
              key={folder.id}
              href={`/library/${folder.id}`}
              className="folder-tile"
              style={{ '--folder-accent': folder.accent } as React.CSSProperties}
            >
              <span className="folder-tile__swatch" />
              <span className="folder-tile__name">{folder.name}</span>
              <span className="folder-tile__count">{folderCount(folder.id, counts)}</span>
            </Link>
          ))}
        </div>
      </section>

      {folders.length > 0 ? (
        <section className="folder-grid__section">
          <Text as="h2" variant="label">
            Your folders
          </Text>
          <div className="folder-grid__tiles">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`/library/${folder.id}`}
                className="folder-tile folder-tile--user"
              >
                <span className="folder-tile__swatch" />
                <span className="folder-tile__name">{folder.name}</span>
                <span className="folder-tile__count">{folderCount(folder.id, counts)}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="folder-grid__section">
        <Text as="h2" variant="label">
          Utilities
        </Text>
        <div className="folder-grid__tiles">
          {BUILT_IN_UTILITY_FOLDERS.map((folder) => (
            <Link
              key={folder.id}
              href={`/library/${folder.id}`}
              className="folder-tile"
              style={{ '--folder-accent': folder.accent } as React.CSSProperties}
            >
              <span className="folder-tile__swatch" />
              <span className="folder-tile__name">{folder.name}</span>
              <span className="folder-tile__count">{folderCount(folder.id, counts)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
