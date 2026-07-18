'use client';

import Link from 'next/link';
import { BUILT_IN_FOLDERS } from '@briefly/config';
import { Stack, Text } from '@briefly/ui';
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

export function FolderDetailPage({ folderId }: { folderId: string }) {
  const { folders, getFolderRecordings } = useLibrary();
  const folderType = resolveFolderType(folderId);
  const recordings = getFolderRecordings(folderId, folderType);

  return (
    <Stack gap="lg">
      <header className="page-header">
        <Link href="/library" className="recording-detail__back">
          <Text as="span" variant="caption">
            ← Library
          </Text>
        </Link>
        <Text as="h1" variant="title">
          {folderTitle(folderId, folders)}
        </Text>
        <Text as="p" variant="body">
          {recordings.length} recording{recordings.length === 1 ? '' : 's'}
        </Text>
      </header>

      <RecordingList recordings={recordings} showRestore={folderId === 'recently-deleted'} />
    </Stack>
  );
}
