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
  FolderListLayoutMode,
  useFolderListLayoutStore,
} from '@/context/useFolderListLayoutStore';
import { sheetLayoutStyles as sh, SHEET_CHECKMARK_COLOR } from '@/components/navigation/sheetLayout';
import { Spacing } from '@/theme';

const LAYOUT_OPTIONS: { id: FolderListLayoutMode; label: string; hint?: string }[] = [
  { id: 'list', label: 'List' },
  { id: 'grid', label: 'Grid', hint: 'Two columns' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function FolderListViewOptionsSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const layout = useFolderListLayoutStore((s) => s.layout);
  const setLayout = useFolderListLayoutStore((s) => s.setLayout);
  const resetToDefaults = useFolderListLayoutStore((s) => s.resetToDefaults);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={sh.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[sh.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <View style={sh.grabberWrap}>
            <View style={sh.grabber} />
          </View>
          <View style={sh.sheetHeader}>
            <Text style={sh.sheetTitle}>View options</Text>
            <TouchableOpacity onPress={() => resetToDefaults()} hitSlop={12}>
              <Text style={sh.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={sh.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={sh.groupLabel}>Layout</Text>
            <View style={sh.optionGroup}>
              {LAYOUT_OPTIONS.map((opt, i) => {
                const selected = layout === opt.id;
                const isLast = i === LAYOUT_OPTIONS.length - 1;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      sh.optionRow,
                      !isLast && sh.optionRowBorder,
                      selected && sh.optionRowSelected,
                    ]}
                    onPress={() => setLayout(opt.id)}
                    activeOpacity={0.7}
                  >
                    <View style={sh.optionLabelCol}>
                      <Text style={[sh.optionLabel, selected && sh.optionLabelSelected]}>
                        {opt.label}
                      </Text>
                      {opt.hint ? <Text style={sh.optionHint}>{opt.hint}</Text> : null}
                    </View>
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
    maxHeight: 320,
  },
});
