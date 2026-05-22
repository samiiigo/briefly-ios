import React, { useCallback, useRef, useState, type RefObject } from 'react';
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
  ScrollView,
  type StyleProp,
  type ViewStyle,
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
const MENU_MAX_HEIGHT = 320;
const ANCHOR_GAP = 6;
const defaultTriggerWrapperStyle: ViewStyle = {
  flexShrink: 0,
  alignSelf: 'stretch',
};
export type MenuAlign = 'leading' | 'trailing' | 'center';
function computeMenuPosition(
  anchor: LayoutRectangle,
  align: MenuAlign,
  screenWidth: number,
): { top: number; left?: number; right?: number } {
  const menuTop = anchor.y + anchor.height + ANCHOR_GAP;
  if (align === 'leading') {
    return { top: menuTop, left: Math.max(Spacing.screenHorizontal, anchor.x) };
  }
  if (align === 'center') {
    const centerX = anchor.x + anchor.width / 2;
    const left = Math.max(
      Spacing.screenHorizontal,
      Math.min(
        centerX - MENU_MIN_WIDTH / 2,
        screenWidth - MENU_MIN_WIDTH - Spacing.screenHorizontal,
      ),
    );
    return { top: menuTop, left };
  }
  return {
    top: menuTop,
    right: Math.max(Spacing.screenHorizontal, screenWidth - anchor.x - anchor.width),
  };
}
/** @param externalAnchorRef Share one ref when multiple menus anchor to the same control. */
export function useAnchoredMenu(externalAnchorRef?: RefObject<View | null>) {
  const internalAnchorRef = useRef<View>(null);
  const anchorRef = externalAnchorRef ?? internalAnchorRef;
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  const open = useCallback(() => {
    const measure = () => {
      anchorRef.current?.measureInWindow((x, y, width, height) => {
        if (width <= 0 || height <= 0) {
          return;
        }
        setAnchor({ x, y, width, height });
        setVisible(true);
      });
    };
    requestAnimationFrame(measure);
  }, [anchorRef]);
  /** Anchor below a screen coordinate (e.g. long-press `pageX` / `pageY`). */
  const openAtPoint = useCallback((pageX: number, pageY: number) => {
    setAnchor({ x: pageX, y: pageY, width: 0, height: 0 });
    setVisible(true);
  }, []);
  const close = useCallback(() => {
    setVisible(false);
    setAnchor(null);
  }, []);
  return { anchorRef, visible, anchor, open, openAtPoint, close };
}
interface AnchoredMenuModalProps {
  visible: boolean;
  anchor: LayoutRectangle | null;
  items: AnchoredMenuItem[];
  onClose: () => void;
  align?: MenuAlign;
}
/** Anchored menu panel; pair with {@link useAnchoredMenu} when the trigger lives outside this tree. */
export function AnchoredMenuModal({
  visible,
  anchor,
  items,
  onClose,
  align = 'trailing',
}: AnchoredMenuModalProps) {
  const styles = useCreateStyles(createAnchoredOverflowMenuStyles);
  const colors = useThemedColors();
  const resolvedScheme = useResolvedColorScheme();
  const rowRippleColor =
    resolvedScheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';
  const screenWidth = Dimensions.get('window').width;
  const menuPosition = anchor ? computeMenuPosition(anchor, align, screenWidth) : null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Dismiss menu"
        />
        {anchor ? (
          <View style={[styles.menu, menuPosition]} accessibilityViewIsModal>
            <ScrollView
              style={styles.menuScroll}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={items.length > 6}
            >
            {items.map((item, index) => {
              const inactive = item.disabled || item.loading;
              return (
                <Pressable
                  key={`${item.label}-${index}`}
                  style={({ pressed }) => [
                    styles.row,
                    index > 0 && styles.rowBorder,
                    pressed && !inactive && Platform.OS === 'ios' && styles.rowPressed,
                  ]}
                  onPress={() => {
                    onClose();
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
            </ScrollView>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
interface AnchoredOverflowMenuProps {
  items: AnchoredMenuItem[];
  renderTrigger: (open: () => void) => React.ReactNode;
  /** Menu horizontal alignment relative to the trigger. */
  align?: MenuAlign;
  /** Shows a spinner on the trigger (e.g. while a menu action runs). */
  triggerLoading?: boolean;
  /** Layout for the trigger wrapper (e.g. swipe actions need `alignSelf: 'stretch'`). */
  triggerWrapperStyle?: StyleProp<ViewStyle>;
}
/** Context menu anchored below the trigger. */
export function AnchoredOverflowMenu({
  items,
  renderTrigger,
  align = 'trailing',
  triggerWrapperStyle,
}: AnchoredOverflowMenuProps) {
  const menu = useAnchoredMenu();
  return (
    <>
      <View
        ref={menu.anchorRef}
        collapsable={false}
        style={[defaultTriggerWrapperStyle, triggerWrapperStyle]}
      >
        {renderTrigger(menu.open)}
      </View>
      <AnchoredMenuModal
        visible={menu.visible}
        anchor={menu.anchor}
        items={items}
        onClose={menu.close}
        align={align}
      />
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
      maxHeight: MENU_MAX_HEIGHT,
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      overflow: 'hidden',
      ...shadowElevated,
    },
    menuScroll: {
      flexGrow: 0,
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
