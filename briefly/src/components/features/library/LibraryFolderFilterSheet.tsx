import React from 'react';
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
  LibraryDatePreset,
  LibraryScopeRefinement,
  useLibraryFolderPreferencesStore,
} from '@/context/useLibraryFolderPreferencesStore';
import { sheetLayoutStyles as sh, SHEET_CHECKMARK_COLOR } from '@/components/navigation/sheetLayout';
import { Spacing } from '@/theme';

const DATE_OPTIONS: { id: LibraryDatePreset; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: 'last7', label: 'Last 7 days' },
  { id: 'last30', label: 'Last 30 days' },
];

const SCOPE_OPTIONS: { id: LibraryScopeRefinement; label: string }[] = [
  { id: 'none', label: 'All items' },
  { id: 'favorites', label: 'Favorites only' },
  { id: 'archived', label: 'Archives only' },
  { id: 'unlisted', label: 'Unlisted only' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function LibraryFolderFilterSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const datePreset = useLibraryFolderPreferencesStore((s) => s.datePreset);
  const scopeRefinement = useLibraryFolderPreferencesStore((s) => s.scopeRefinement);
  const setDatePreset = useLibraryFolderPreferencesStore((s) => s.setDatePreset);
  const setScopeRefinement = useLibraryFolderPreferencesStore((s) => s.setScopeRefinement);
  const resetFilters = useLibraryFolderPreferencesStore((s) => s.resetFilters);

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
            <TouchableOpacity onPress={resetFilters} hitSlop={12}>
              <Text style={sh.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={sh.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={sh.groupLabel}>Date</Text>
            <View style={sh.optionGroup}>
              {DATE_OPTIONS.map((opt, i) => {
                const selected = datePreset === opt.id;
                const isLast = i === DATE_OPTIONS.length - 1;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      sh.optionRow,
                      !isLast && sh.optionRowBorder,
                      selected && sh.optionRowSelected,
                    ]}
                    onPress={() => setDatePreset(opt.id)}
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

            <Text style={[sh.groupLabel, sh.groupLabelSpaced]}>Show</Text>
            <View style={sh.optionGroup}>
              {SCOPE_OPTIONS.map((opt, i) => {
                const selected = scopeRefinement === opt.id;
                const isLast = i === SCOPE_OPTIONS.length - 1;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      sh.optionRow,
                      !isLast && sh.optionRowBorder,
                      selected && sh.optionRowSelected,
                    ]}
                    onPress={() => setScopeRefinement(opt.id)}
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
    maxHeight: 420,
  },
});
