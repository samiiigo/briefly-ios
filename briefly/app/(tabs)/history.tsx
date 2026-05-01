import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LibraryFolderBrowser, MAX_USER_FOLDERS_PREVIEW } from '../../components/LibraryFolderBrowser';
import { Colors } from '../../utils/theme';

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LibraryFolderBrowser maxUserFolders={MAX_USER_FOLDERS_PREVIEW} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
