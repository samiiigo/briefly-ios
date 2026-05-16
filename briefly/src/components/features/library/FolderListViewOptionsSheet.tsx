import React from 'react';
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
  FolderListLayoutMode,
  useFolderListLayoutStore,
} from '@/context/useFolderListLayoutStore';
import { Spacing } from '@/theme';

const LAYOUT_OPTIONS: { id: FolderListLayoutMode; label: string; hint?: string }[] = [
  { id: 'list', label: 'List' },
  { id: 'grid', label: 'Grid', hint: 'Two columns' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * Folder browser (Library) layout options — same sheet chrome and layout rows as
 * {@link FolderViewOptionsSheet} for recordings.
 */
export function FolderListViewOptionsSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const layout = useFolderListLayoutStore((s) => s.layout);
  const setLayout = useFolderListLayoutStore((s) => s.setLayout);
  const resetToDefaults = useFolderListLayoutStore((s) => s.resetToDefaults);

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
            <TouchableOpacity
              onPress={() => resetToDefaults()}
              hitSlop={12}
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.groupLabel}>LAYOUT</Text>
            <View style={styles.optionGroup}>
              {LAYOUT_OPTIONS.map((opt, i) => {
                const selected = layout === opt.id;
                const isLast = i === LAYOUT_OPTIONS.length - 1;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionRow,
                      !isLast && styles.optionRowBorder,
                      selected && styles.optionRowSelected,
                    ]}
                    onPress={() => setLayout(opt.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLabelCol}>
                      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                        {opt.label}
                      </Text>
                      {opt.hint ? <Text style={styles.optionHint}>{opt.hint}</Text> : null}
                    </View>
                    {selected && (
                      <Ionicons name="checkmark" size={20} color="rgba(255,255,255,0.85)" />
                    )}
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
    maxHeight: 320,
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
