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
import {
  Spacing,
  BorderRadius,
  withAppFont,
  useCreateStyles,
  useThemedColors,
  useResolvedColorScheme,
  shadowElevated,
} from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

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
}: AnchoredOverflowMenuProps) {
  const styles = useCreateStyles(createAnchoredOverflowMenuStyles);
  const colors = useThemedColors();
  const resolvedScheme = useResolvedColorScheme();
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

  const rowRippleColor =
    resolvedScheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';

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
          <Pressable
            style={styles.backdrop}
            onPress={close}
            accessibilityLabel="Dismiss menu"
          />
          {anchor ? (
            <View style={[styles.menu, menuPosition]} accessibilityViewIsModal>
              {items.map((item, index) => {
                const inactive = item.disabled || item.loading;
                return (
                  <Pressable
                    key={item.label}
                    style={({ pressed }) => [
                      styles.row,
                      index > 0 && styles.rowBorder,
                      pressed && !inactive && Platform.OS === 'ios' && styles.rowPressed,
                    ]}
                    onPress={() => {
                      close();
                      if (!inactive) {
                        item.onPress();
                      }
                    }}
                    disabled={inactive}
                    accessibilityRole="menuitem"
                    accessibilityState={{ disabled: inactive, busy: item.loading }}
                    android_ripple={{ color: rowRippleColor }}
                  >
                    {item.loading ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.primary}
                        style={styles.rowSpinner}
                      />
                    ) : null}
                    <Text style={[styles.label, inactive && styles.labelDisabled]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

function createAnchoredOverflowMenuStyles(c: ColorPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    menu: {
      position: 'absolute',
      minWidth: MENU_MIN_WIDTH,
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      overflow: 'hidden',
      ...shadowElevated,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: 14,
    },
    rowPressed: {
      opacity: 0.72,
    },
    rowSpinner: {
      width: 20,
    },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    label: withAppFont({
      fontSize: 17,
      fontWeight: '400',
      color: c.textPrimary,
    }),
    labelDisabled: {
      color: c.subtext,
    },
  });
}
