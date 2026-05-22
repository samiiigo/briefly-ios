import React from 'react';
import { View, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';
import { RecordButton } from '@/components/features/recording/RecordButton';
import { useLibraryDefaultRecord } from '@/hooks/useLibraryDefaultRecord';
import { pathnameShowsLibraryFab } from './libraryFabRoutes';

/**
 * Library record FAB above navigator bottom blurs (root stack).
 * Covers the Library tab and folder list; folder detail uses {@link FolderChromeOverlay}.
 */
export function LibraryFabChromeOverlay() {
  const pathname = usePathname();
  const handleDefaultRecord = useLibraryDefaultRecord();

  if (!pathnameShowsLibraryFab(pathname)) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <RecordButton onPress={handleDefaultRecord} />
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
