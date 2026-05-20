import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { RecordButton } from '@/components/features/recording/RecordButton';
import { ImportFabButton } from '@/components/features/library/ImportFabButton';
import { useFolderRecordFab } from '@/hooks/useFolderRecordFab';
import { useTranscriptBackup } from '@/hooks/useTranscriptBackup';

function folderIdFromPathname(pathname: string): string | undefined {
  const match = pathname.match(/^\/folder\/([^/]+)$/);
  return match?.[1];
}

export function FolderChromeOverlay() {
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ folderType?: string }>();
  const folderId = useMemo(() => folderIdFromPathname(pathname), [pathname]);
  const folderType = (params.folderType ?? 'built-in') as 'built-in' | 'user';
  const { isRecentlyDeleted, isImportsFolder, handleRecordIntoFolder } =
    useFolderRecordFab(folderId, folderType);
  const { busy: importBusy, importTranscripts } = useTranscriptBackup();

  if (!folderId || isRecentlyDeleted) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {isImportsFolder ? (
        <ImportFabButton onPress={importTranscripts} disabled={importBusy} />
      ) : (
        <RecordButton onPress={handleRecordIntoFolder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});
