import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { RecordButton } from '@/features/recording/components/RecordButton';
import { ImportFabButton } from '@/features/library/components/ImportFabButton';
import { useFolderRecordFab } from '@/features/library/hooks/useFolderRecordFab';
import { useTranscriptBackup } from '@/features/settings/hooks/useTranscriptBackup';
import { folderIdFromPathname, routeParamString } from './libraryFabRoutes';
/**
 * Record/import FAB for folder detail screens, mounted above the folder stack blur.
 */
export function FolderChromeOverlay() {
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ folderType?: string; id?: string }>();
  const folderId = useMemo(
    () => folderIdFromPathname(pathname) ?? routeParamString(params.id),
    [pathname, params.id],
  );
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
    zIndex: 20,
    elevation: 20,
  },
});
