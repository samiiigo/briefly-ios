import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  LibraryDatePreset,
  LibraryScopeRefinement,
  useLibraryFolderPreferencesStore,
} from '@/context/useLibraryFolderPreferencesStore';
import { useSheetLayoutStyles } from '@/components/navigation/layout/sheetLayout';
import { useThemedColors } from '@/theme';
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
function SheetOptionGroup<T extends string>({
  options,
  selectedId,
  onSelect,
}: {
  options: { id: T; label: string }[];
  selectedId: T;
  onSelect: (id: T) => void;
}) {
  const sh = useSheetLayoutStyles();
  const colors = useThemedColors();
  return (
    <View style={sh.optionGroup}>
      {options.map((opt, i) => {
        const selected = selectedId === opt.id;
        const isLast = i === options.length - 1;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[
              sh.optionRow,
              !isLast && sh.optionRowBorder,
              selected && sh.optionRowSelected,
            ]}
            onPress={() => onSelect(opt.id)}
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
  );
}
/** Date filter for a folder’s recording list. */
export function FolderDateFilterSection({ spaced }: { spaced?: boolean }) {
  const sh = useSheetLayoutStyles();
  const datePreset = useLibraryFolderPreferencesStore((s) => s.datePreset);
  const setDatePreset = useLibraryFolderPreferencesStore((s) => s.setDatePreset);
  return (
    <>
      <Text style={[sh.groupLabel, spaced && sh.groupLabelSpaced]}>Date</Text>
      <SheetOptionGroup
        options={DATE_OPTIONS}
        selectedId={datePreset}
        onSelect={setDatePreset}
      />
    </>
  );
}
/** Date + library scope filters (library hub sheet). */
export function LibraryDateScopeFilterSections() {
  const sh = useSheetLayoutStyles();
  const scopeRefinement = useLibraryFolderPreferencesStore((s) => s.scopeRefinement);
  const setScopeRefinement = useLibraryFolderPreferencesStore((s) => s.setScopeRefinement);
  return (
    <>
      <FolderDateFilterSection />
      <Text style={[sh.groupLabel, sh.groupLabelSpaced]}>Show</Text>
      <SheetOptionGroup
        options={SCOPE_OPTIONS}
        selectedId={scopeRefinement}
        onSelect={setScopeRefinement}
      />
    </>
  );
}
