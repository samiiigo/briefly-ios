import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LibraryFolderBrowser } from '@/components/features/library/LibraryFolderBrowser';

/** Full folder list (all user folders); opened from Library "See all". */
export default function FolderListScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LibraryFolderBrowser showBack />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
