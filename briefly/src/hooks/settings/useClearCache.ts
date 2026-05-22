import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { clearAppCache } from '@/utils/fileSystem/clearAppCache';
import { formatFileSize } from '@/utils/formatting/formatting';
export function useClearCache() {
  const [busy, setBusy] = useState(false);
  const confirmAndClearCache = useCallback(() => {
    if (busy) return;
    Alert.alert(
      'Clear cache',
      'Remove temporary files from exports, uploads, and processing? Your recordings and transcripts will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setBusy(true);
            try {
              const { deletedCount, freedBytes } = clearAppCache();
              if (deletedCount === 0) {
                Alert.alert('Cache empty', 'There is nothing to clear in the cache.');
                return;
              }
              const sizeLabel =
                freedBytes > 0 ? ` (${formatFileSize(freedBytes)})` : '';
              Alert.alert(
                'Cache cleared',
                `Removed ${deletedCount} item${deletedCount === 1 ? '' : 's'}${sizeLabel}.`,
              );
            } catch (error: unknown) {
              const message =
                error instanceof Error ? error.message : 'Could not clear the cache.';
              Alert.alert('Clear cache failed', message);
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }, [busy]);
  return { busy, confirmAndClearCache };
}
