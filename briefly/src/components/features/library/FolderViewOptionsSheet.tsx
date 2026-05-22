import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  FolderSortDirection,
  FolderSortField,
  getFolderBrowsePreferences,
  useFolderBrowsePreferencesStore,
} from '@/context/useFolderBrowsePreferencesStore';
import { SheetModal } from '@/components/navigation/sheet/SheetModal';
import { useSheetLayoutStyles } from '@/components/navigation/layout/sheetLayout';
import { useThemedColors } from '@/theme';
const SHOW_OPTIONS: { favoritesOnly: boolean; label: string }[] = [
  { favoritesOnly: false, label: 'All items' },
  { favoritesOnly: true, label: 'Favs only' },
];
const SORT_FIELD_OPTIONS: { id: FolderSortField; label: string }[] = [
  { id: 'date', label: 'Date' },
  { id: 'name', label: 'Name' },
  { id: 'type', label: 'Type' },
  { id: 'size', label: 'Size' },
];
const DIRECTION_OPTIONS: { id: FolderSortDirection; label: string }[] = [
  { id: 'asc', label: 'Ascending' },
  { id: 'desc', label: 'Descending' },
];
interface Props {
  visible: boolean;
  folderKey: string;
  /** Built-in folder id; used to hide redundant show filters (e.g. favorites). */
  folderId?: string;
  folderType?: 'built-in' | 'user';
  onClose: () => void;
}
export function FolderViewOptionsSheet({
  visible,
  folderKey,
  folderId,
  folderType,
  onClose,
}: Props) {
  const sh = useSheetLayoutStyles();
  const colors = useThemedColors();
  const byFolder = useFolderBrowsePreferencesStore((s) => s.byFolder);
  const setForFolder = useFolderBrowsePreferencesStore((s) => s.setForFolder);
  const resetForFolder = useFolderBrowsePreferencesStore((s) => s.resetForFolder);
  const browse = useMemo(() => getFolderBrowsePreferences(byFolder, folderKey), [byFolder, folderKey]);
  const showShowFilter = folderType !== 'built-in' || folderId !== 'favorites';
  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Filters"
      onReset={() => resetForFolder(folderKey)}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={sh.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={sh.groupLabel}>Sort by</Text>
        <View style={sh.optionGroup}>
          {SORT_FIELD_OPTIONS.map((opt, i) => {
            const selected = browse.sortField === opt.id;
            const isLast = i === SORT_FIELD_OPTIONS.length - 1;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  sh.optionRow,
                  !isLast && sh.optionRowBorder,
                  selected && sh.optionRowSelected,
                ]}
                onPress={() => setForFolder(folderKey, { sortField: opt.id })}
                activeOpacity={0.7}
              >
                <Text style={[sh.optionLabel, selected && sh.optionLabelSelected]}>
                  {opt.label}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark" size={20} color={colors.textPrimary} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
        {showShowFilter ? (
          <>
            <Text style={[sh.groupLabel, sh.groupLabelSpaced]}>Show</Text>
            <View style={sh.optionGroup}>
              {SHOW_OPTIONS.map((opt, i) => {
                const selected = browse.favoritesOnly === opt.favoritesOnly;
                const isLast = i === SHOW_OPTIONS.length - 1;
                return (
                  <TouchableOpacity
                    key={String(opt.favoritesOnly)}
                    style={[
                      sh.optionRow,
                      !isLast && sh.optionRowBorder,
                      selected && sh.optionRowSelected,
                    ]}
                    onPress={() => setForFolder(folderKey, { favoritesOnly: opt.favoritesOnly })}
                    activeOpacity={0.7}
                  >
                    <Text style={[sh.optionLabel, selected && sh.optionLabelSelected]}>
                      {opt.label}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark" size={20} color={colors.textPrimary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : null}
        <Text style={[sh.groupLabel, sh.groupLabelSpaced]}>Order</Text>
        <View style={sh.optionGroup}>
          {DIRECTION_OPTIONS.map((opt, i) => {
            const selected = browse.sortDirection === opt.id;
            const isLast = i === DIRECTION_OPTIONS.length - 1;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  sh.optionRow,
                  !isLast && sh.optionRowBorder,
                  selected && sh.optionRowSelected,
                ]}
                onPress={() => setForFolder(folderKey, { sortDirection: opt.id })}
                activeOpacity={0.7}
              >
                <Text style={[sh.optionLabel, selected && sh.optionLabelSelected]}>
                  {opt.label}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark" size={20} color={colors.textPrimary} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SheetModal>
  );
}
const styles = StyleSheet.create({
  scroll: {
    maxHeight: 400,
  },
});
