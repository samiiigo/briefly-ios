import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { RecordButton } from '@/components/features/recording/RecordButton';
import { ImportFabButton } from '@/components/features/library/ImportFabButton';
import { useFolderRecordFab } from '@/hooks/useFolderRecordFab';
import { useLibraryDefaultRecord } from '@/hooks/useLibraryDefaultRecord';
import { useTranscriptBackup } from '@/hooks/useTranscriptBackup';
import {
  folderIdFromPathname,
  pathnameShowsLibraryFab,
} from './libraryFabRoutes';

/**
 * Library record/import FAB above all navigator bottom blurs (root stack).
 * Covers the Library tab, folder list, and folder detail screens.
 */
export function LibraryFabChromeOverlay() {
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ folderType?: string }>();
  const folderId = useMemo(() => folderIdFromPathname(pathname), [pathname]);
  const isFolderList = pathname === '/folder';
  const folderType = (params.folderType ?? 'built-in') as 'built-in' | 'user';
  const handleDefaultRecord = useLibraryDefaultRecord();
  const { isImportsFolder, handleRecordIntoFolder } = useFolderRecordFab(folderId, folderType);
  const { busy: importBusy, importTranscripts } = useTranscriptBackup();

  if (!pathnameShowsLibraryFab(pathname)) {
    return null;
  }

  if (folderId === 'recently-deleted') {
    return null;
  }

  const onRecord =
    folderId != null && !isFolderList ? handleRecordIntoFolder : handleDefaultRecord;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {isImportsFolder ? (
        <ImportFabButton onPress={importTranscripts} disabled={importBusy} />
      ) : (
        <RecordButton onPress={onRecord} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 20,
  },
});
