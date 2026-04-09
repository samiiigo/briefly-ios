import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  FolderGroupBy,
  FolderLayoutMode,
  FolderSortDirection,
  FolderSortField,
  getFolderBrowsePreferences,
  useFolderBrowsePreferencesStore,
} from '../store/useFolderBrowsePreferencesStore';
import { Spacing } from '../utils/theme';

const LAYOUT_OPTIONS: { id: FolderLayoutMode; label: string; hint?: string }[] = [
  { id: 'list', label: 'List' },
  { id: 'grid', label: 'Grid', hint: 'Single column when grouped' },
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

const GROUP_OPTIONS: { id: FolderGroupBy; label: string }[] = [
  { id: 'none', label: 'Chronological' },
  { id: 'date', label: 'By date' },
  { id: 'type', label: 'By type' },
  { id: 'size', label: 'By size' },
];

const FAVORITES_FILTER_OPTIONS: { favoritesOnly: boolean; label: string }[] = [
  { favoritesOnly: false, label: 'All recordings' },
  { favoritesOnly: true, label: 'Favs only' },
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

  const setLayout = (layout: FolderLayoutMode) => {
    if (layout === 'grid') {
      setForFolder(folderKey, { layout: 'grid', groupBy: 'none' });
    } else {
      setForFolder(folderKey, { layout: 'list' });
    }
  };

  const setGroupBy = (g: FolderGroupBy) => {
    if (g !== 'none') {
      setForFolder(folderKey, { groupBy: g, layout: 'list' });
    } else {
      setForFolder(folderKey, { groupBy: g });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>View options</Text>
            <TouchableOpacity onPress={() => resetForFolder(folderKey)} hitSlop={12}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.groupLabel}>SHOW</Text>
            <View style={styles.optionGroup}>
              {FAVORITES_FILTER_OPTIONS.map((opt, i) => {
                const selected = browse.favoritesOnly === opt.favoritesOnly;
                const isLast = i === FAVORITES_FILTER_OPTIONS.length - 1;
                return (
                  <TouchableOpacity
                    key={String(opt.favoritesOnly)}
                    style={[
                      styles.optionRow,
                      !isLast && styles.optionRowBorder,
                      selected && styles.optionRowSelected,
                    ]}
                    onPress={() => setForFolder(folderKey, { favoritesOnly: opt.favoritesOnly })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {opt.label}
                    </Text>
                    {selected && <Ionicons name="checkmark" size={20} color="rgba(255,255,255,0.85)" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.groupLabel, styles.groupLabelSpaced]}>LAYOUT</Text>
            <View style={styles.optionGroup}>
              {LAYOUT_OPTIONS.map((opt, i) => {
                const selected = browse.layout === opt.id;
                const isLast = i === LAYOUT_OPTIONS.length - 1;
                const disabled = opt.id === 'grid' && browse.groupBy !== 'none';
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionRow,
                      !isLast && styles.optionRowBorder,
                      selected && styles.optionRowSelected,
                      disabled && styles.optionRowDisabled,
                    ]}
                    onPress={() => !disabled && setLayout(opt.id)}
                    disabled={disabled}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLabelCol}>
                      <Text
                        style={[
                          styles.optionLabel,
                          selected && styles.optionLabelSelected,
                          disabled && styles.optionLabelDisabled,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {opt.hint && (
                        <Text style={styles.optionHint}>{opt.hint}</Text>
                      )}
                    </View>
                    {selected && !disabled && (
                      <Ionicons name="checkmark" size={20} color="rgba(255,255,255,0.85)" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.groupLabel, styles.groupLabelSpaced]}>SORT BY</Text>
            <View style={styles.optionGroup}>
              {SORT_FIELD_OPTIONS.map((opt, i) => {
                const selected = browse.sortField === opt.id;
                const isLast = i === SORT_FIELD_OPTIONS.length - 1;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionRow, !isLast && styles.optionRowBorder, selected && styles.optionRowSelected]}
                    onPress={() => setForFolder(folderKey, { sortField: opt.id })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{opt.label}</Text>
                    {selected && <Ionicons name="checkmark" size={20} color="rgba(255,255,255,0.85)" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.groupLabel, styles.groupLabelSpaced]}>ORDER</Text>
            <View style={styles.optionGroup}>
              {DIRECTION_OPTIONS.map((opt, i) => {
                const selected = browse.sortDirection === opt.id;
                const isLast = i === DIRECTION_OPTIONS.length - 1;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionRow, !isLast && styles.optionRowBorder, selected && styles.optionRowSelected]}
                    onPress={() => setForFolder(folderKey, { sortDirection: opt.id })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{opt.label}</Text>
                    {selected && <Ionicons name="checkmark" size={20} color="rgba(255,255,255,0.85)" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.groupLabel, styles.groupLabelSpaced]}>GROUP</Text>
            <View style={styles.optionGroup}>
              {GROUP_OPTIONS.map((opt, i) => {
                const selected = browse.groupBy === opt.id;
                const isLast = i === GROUP_OPTIONS.length - 1;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionRow, !isLast && styles.optionRowBorder, selected && styles.optionRowSelected]}
                    onPress={() => setGroupBy(opt.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{opt.label}</Text>
                    {selected && <Ionicons name="checkmark" size={20} color="rgba(255,255,255,0.85)" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '92%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 24 },
    }),
  },
  grabberWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.96)',
    letterSpacing: 0.2,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(10,132,255,0.95)',
  },
  scroll: {
    maxHeight: 520,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.42)',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  groupLabelSpaced: {
    marginTop: Spacing.lg,
  },
  optionGroup: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  optionRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  optionRowSelected: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  optionRowDisabled: {
    opacity: 0.45,
  },
  optionLabelCol: {
    flex: 1,
    paddingRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '400',
  },
  optionLabelSelected: {
    color: 'rgba(255,255,255,0.96)',
    fontWeight: '500',
  },
  optionLabelDisabled: {
    color: 'rgba(255,255,255,0.45)',
  },
  optionHint: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(255,255,255,0.38)',
  },
  doneBtn: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },
});
