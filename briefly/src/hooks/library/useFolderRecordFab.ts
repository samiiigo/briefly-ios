import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { RecordingService } from '@/services/audio';
export function useFolderRecordFab(
  folderId: string | undefined,
  folderType: 'built-in' | 'user',
) {
  const router = useRouter();
  const isRecentlyDeleted = folderId === 'recently-deleted';
  const isImportsFolder = folderId === 'imports';
  const handleRecordIntoFolder = useCallback(async () => {
    if (!folderId || isRecentlyDeleted) return;
    const granted = await RecordingService.requestPermissions();
    if (!granted) return;
    if (folderType === 'user') {
      router.push({
        pathname: '/recording/new',
        params: { targetFolder: 'unlisted', targetUserFolderId: folderId },
      });
    } else if (folderId === 'archived') {
      router.push({ pathname: '/recording/new', params: { targetFolder: 'archived' } });
    } else {
      router.push({ pathname: '/recording/new', params: { targetFolder: 'unlisted' } });
    }
  }, [router, folderType, folderId, isRecentlyDeleted]);
  return { isRecentlyDeleted, isImportsFolder, handleRecordIntoFolder };
}
