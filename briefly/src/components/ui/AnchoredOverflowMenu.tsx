import React, { useCallback, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  LayoutRectangle,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';

export type AnchoredMenuItem = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

const MENU_MIN_WIDTH = 220;
const ANCHOR_GAP = 6;

interface AnchoredOverflowMenuProps {
  items: AnchoredMenuItem[];
  renderTrigger: (open: () => void) => React.ReactNode;
  /** Menu horizontal alignment relative to the trigger. */
  align?: 'leading' | 'trailing';
  /** Shows a spinner on the trigger (e.g. while a menu action runs). */
  triggerLoading?: boolean;
}

/** Context menu anchored below the trigger. */
export function AnchoredOverflowMenu({
  items,
  renderTrigger,
  align = 'trailing',
  triggerLoading = false,
}: AnchoredOverflowMenuProps) {
  const anchorRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);

  const open = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setVisible(true);
    });
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setAnchor(null);
  }, []);

  const screenWidth = Dimensions.get('window').width;
  const menuTop = anchor ? anchor.y + anchor.height + ANCHOR_GAP : 0;
  const menuPosition = !anchor
    ? null
    : align === 'leading'
      ? { top: menuTop, left: Math.max(Spacing.screenHorizontal, anchor.x) }
      : {
          top: menuTop,
          right: Math.max(Spacing.screenHorizontal, screenWidth - anchor.x - anchor.width),
        };

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        {renderTrigger(open)}
      </View>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Dismiss menu" />
          {anchor ? (
            <View style={[styles.menu, menuPosition]} accessibilityViewIsModal>
              {items.map((item, index) => (
                <Pressable
                  key={item.label}
                  style={[styles.row, index > 0 && styles.rowBorder]}
                  onPress={() => {
                    close();
                    if (!item.disabled) {
                      item.onPress();
                    }
                  }}
                  disabled={item.disabled || item.loading}
                  accessibilityRole="menuitem"
                  accessibilityState={{ disabled: item.disabled || item.loading, busy: item.loading }}
                  android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                >
                  {item.loading ? (
                    <ActivityIndicator size="small" color={Colors.primary} style={styles.rowSpinner} />
                  ) : null}
                  <Text
                    style={[
                      styles.label,
                      (item.disabled || item.loading) && styles.labelDisabled,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    minWidth: MENU_MIN_WIDTH,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  rowSpinner: {
    width: 20,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  label: withAppFont({
    fontSize: 17,
    color: Colors.textPrimary,
  }),
  labelDisabled: {
    color: Colors.textSecondary,
  },
});
