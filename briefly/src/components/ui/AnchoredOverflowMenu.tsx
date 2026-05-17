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
} from 'react-native';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';

export type AnchoredMenuItem = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

const MENU_MIN_WIDTH = 220;
const ANCHOR_GAP = 6;

interface AnchoredOverflowMenuProps {
  items: AnchoredMenuItem[];
  renderTrigger: (open: () => void) => React.ReactNode;
}

/** Context menu anchored below the trigger, trailing-aligned. */
export function AnchoredOverflowMenu({ items, renderTrigger }: AnchoredOverflowMenuProps) {
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
  const menuRight = anchor
    ? Math.max(Spacing.screenHorizontal, screenWidth - anchor.x - anchor.width)
    : Spacing.screenHorizontal;

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        {renderTrigger(open)}
      </View>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Dismiss menu" />
          {anchor ? (
            <View
              style={[styles.menu, { top: menuTop, right: menuRight }]}
              accessibilityViewIsModal
            >
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
                  disabled={item.disabled}
                  accessibilityRole="menuitem"
                  accessibilityState={{ disabled: item.disabled }}
                >
                  <Text style={[styles.label, item.disabled && styles.labelDisabled]}>{item.label}</Text>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
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
