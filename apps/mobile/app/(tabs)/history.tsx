import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LibraryFolderBrowser } from '@/features/library/components/LibraryFolderBrowser';
import { MAX_PINNED_FOLDERS, MAX_YOUR_FOLDERS_PREVIEW } from '@briefly/config';
import { useCreateStyles } from '@briefly/theme/native';
import type { ColorPalette } from '@briefly/theme';
export default function HistoryScreen() {
  const styles = useCreateStyles(createHistoryScreenStyles);
  return (
    <View style={styles.container}>
      <LibraryFolderBrowser
        maxPinnedFolders={MAX_PINNED_FOLDERS}
        maxYourFolders={MAX_YOUR_FOLDERS_PREVIEW}
      />
    </View>
  );
}
function createHistoryScreenStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
  });
}
