import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LibraryFolderBrowser } from '@/components/features/library/LibraryFolderBrowser';
import { UserFolderListFilter } from '@/constants/userFolders';
import { Colors } from '@/theme';

function parseFolderListFilter(
  value: string | string[] | undefined
): UserFolderListFilter | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'pinned' || raw === 'all-user') return raw;
  return undefined;
}

/** Full user-folder list opened from Library “See all”. */
export default function FolderListScreen() {
  const { list } = useLocalSearchParams<{ list?: string }>();
  const folderListFilter = parseFolderListFilter(list);

  return (
    <View style={styles.container}>
      <LibraryFolderBrowser showBack folderListFilter={folderListFilter} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
