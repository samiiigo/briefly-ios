import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LibraryFolderBrowser } from '@/features/library/components/LibraryFolderBrowser';
import { UserFolderListFilter } from '@briefly/config';
import { useThemedStackShell } from '@/navigation/layout/themedStackLayout';
function parseFolderListFilter(
  value: string | string[] | undefined,
): UserFolderListFilter | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'pinned' || raw === 'all-user') return raw;
  return undefined;
}
/** Full user-folder list opened from Library “See all”. */
export default function FolderListScreen() {
  const { list } = useLocalSearchParams<{ list?: string }>();
  const folderListFilter = parseFolderListFilter(list);
  const shell = useThemedStackShell();
  return (
    <View style={shell.root}>
      <LibraryFolderBrowser showBack folderListFilter={folderListFilter} />
    </View>
  );
}
