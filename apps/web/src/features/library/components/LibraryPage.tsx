'use client';

import { useSearchParams } from 'next/navigation';
import { BUILT_IN_FOLDERS } from '@briefly/config';
import { Stack, Text } from '@briefly/ui';
import { FolderTileGrid } from '@/features/library/components/FolderTileGrid';
import { RecordingList } from '@/features/library/components/RecordingList';
import { useLibrary } from '@/features/library/hooks/useLibrary';

function resolveFolderType(folderId: string): 'built-in' | 'user' {
  return BUILT_IN_FOLDERS.some((f) => f.id === folderId) ? 'built-in' : 'user';
}

function folderTitle(folderId: string, folders: ReturnType<typeof useLibrary>['folders']): string {
  const builtIn = BUILT_IN_FOLDERS.find((f) => f.id === folderId);
  if (builtIn) return builtIn.name;
  return folders.find((f) => f.id === folderId)?.name ?? 'Folder';
}

export function LibraryPage() {
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folder');
  const { folders, getFolderRecordings } = useLibrary();

  return (
    <Stack gap="lg">
      <header className="page-header">
        <Text as="h1" variant="title">
          Library
        </Text>
        <Text as="p" variant="body">
          Browse recordings synced from your Briefly account.
        </Text>
      </header>

      {folderId ? (
        <section>
          <Text as="h2" variant="label">
            {folderTitle(folderId, folders)}
          </Text>
          <RecordingList
            recordings={getFolderRecordings(folderId, resolveFolderType(folderId))}
            showRestore={folderId === 'recently-deleted'}
          />
        </section>
      ) : (
        <FolderTileGrid />
      )}
    </Stack>
  );
}
