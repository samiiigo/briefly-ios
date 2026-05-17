import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LibraryFolderBrowser } from '@/components/features/library/LibraryFolderBrowser';
import { MAX_PINNED_FOLDERS, MAX_YOUR_FOLDERS_PREVIEW } from '@/constants/userFolders';
import { Colors } from '@/theme';

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <LibraryFolderBrowser
        maxPinnedFolders={MAX_PINNED_FOLDERS}
        maxYourFolders={MAX_YOUR_FOLDERS_PREVIEW}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
