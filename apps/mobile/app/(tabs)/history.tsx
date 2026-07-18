import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LibraryFolderBrowser } from '@/features/library/components/LibraryFolderBrowser';
import { MAX_PINNED_FOLDERS, MAX_YOUR_FOLDERS_PREVIEW } from '@/shared/constants/userFolders';
import { useCreateStyles } from '@/shared/theme';
import type { ColorPalette } from '@/shared/theme/colorPalettes';
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
