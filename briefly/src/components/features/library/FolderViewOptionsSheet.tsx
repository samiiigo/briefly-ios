import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  FolderSortDirection,
  FolderSortField,
  getFolderBrowsePreferences,
  useFolderBrowsePreferencesStore,
} from '@/context/useFolderBrowsePreferencesStore';
import { sheetLayoutStyles as sh, SHEET_CHECKMARK_COLOR } from '@/components/navigation/sheetLayout';
import { Spacing } from '@/theme';

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

const FAVORITES_FILTER_OPTIONS: { favoritesOnly: boolean; label: string }[] = [
  { favoritesOnly: false, label: 'All recordings' },
  { favoritesOnly: true, label: 'Favorites only' },
];

interface Props {
  visible: boolean;
  folderKey: string;
  onClose: () => void;
}

export function FolderViewOptionsSheet({ visible, folderKey, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const byFolder = useFolderBrowsePreferencesStore((s) => s.byFolder);
  const setForFolder = useFolderBrowsePreferencesStore((s) => s.setForFolder);
  const resetForFolder = useFolderBrowsePreferencesStore((s) => s.resetForFolder);

  const browse = useMemo(() => getFolderBrowsePreferences(byFolder, folderKey), [byFolder, folderKey]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={sh.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[sh.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <View style={sh.grabberWrap}>
            <View style={sh.grabber} />
          </View>
          <View style={sh.sheetHeader}>
            <Text style={sh.sheetTitle}>Filters</Text>
            <TouchableOpacity onPress={() => resetForFolder(folderKey)} hitSlop={12}>
              <Text style={sh.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={sh.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={sh.groupLabel}>Show</Text>
            <View style={sh.optionGroup}>
              {FAVORITES_FILTER_OPTIONS.map((opt, i) => {
                const selected = browse.favoritesOnly === opt.favoritesOnly;
                const isLast = i === FAVORITES_FILTER_OPTIONS.length - 1;
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
                      <Ionicons name="checkmark" size={20} color={SHEET_CHECKMARK_COLOR} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[sh.groupLabel, sh.groupLabelSpaced]}>Sort by</Text>
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
                      <Ionicons name="checkmark" size={20} color={SHEET_CHECKMARK_COLOR} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

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
                      <Ionicons name="checkmark" size={20} color={SHEET_CHECKMARK_COLOR} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity style={sh.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={sh.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 520,
  },
});
