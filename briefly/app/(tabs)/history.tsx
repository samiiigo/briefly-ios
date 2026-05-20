import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LibraryFolderBrowser } from '@/components/features/library/LibraryFolderBrowser';
import { MAX_PINNED_FOLDERS, MAX_YOUR_FOLDERS_PREVIEW } from '@/constants/userFolders';
import { useCreateStyles } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

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
