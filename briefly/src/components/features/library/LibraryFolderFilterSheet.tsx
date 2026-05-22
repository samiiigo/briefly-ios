import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useLibraryFolderPreferencesStore } from '@/context/useLibraryFolderPreferencesStore';
import { SheetModal } from '@/components/navigation/sheet/SheetModal';
import { useSheetLayoutStyles } from '@/components/navigation/layout/sheetLayout';
import { LibraryDateScopeFilterSections } from './LibraryDateScopeFilterSections';
interface Props {
  visible: boolean;
  onClose: () => void;
}
export function LibraryFolderFilterSheet({ visible, onClose }: Props) {
  const sh = useSheetLayoutStyles();
  const resetFilters = useLibraryFolderPreferencesStore((s) => s.resetFilters);
  return (
    <SheetModal visible={visible} onClose={onClose} title="Filters" onReset={resetFilters}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={sh.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LibraryDateScopeFilterSections />
      </ScrollView>
    </SheetModal>
  );
}
const styles = StyleSheet.create({
  scroll: {
    maxHeight: 420,
  },
});
