import React, { useEffect, type ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSheetLayoutStyles } from '@/components/navigation/sheetLayout';
import { useCreateStyles, Spacing } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

const SHEET_SLIDE_DISTANCE = 480;
const SHEET_OPEN_MS = 280;

interface SheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  onReset?: () => void;
  resetLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Bottom sheet: backdrop fades in; panel slides up (avoids tint riding the slide transition). */
export function SheetModal({
  visible,
  onClose,
  title,
  onReset,
  resetLabel = 'Reset',
  children,
  footer,
}: SheetModalProps) {
  const sh = useSheetLayoutStyles();
  const styles = useCreateStyles(createSheetModalStyles);
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_SLIDE_DISTANCE);

  useEffect(() => {
    if (visible) {
      translateY.value = SHEET_SLIDE_DISTANCE;
      translateY.value = withTiming(0, {
        duration: SHEET_OPEN_MS,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      translateY.value = SHEET_SLIDE_DISTANCE;
    }
  }, [visible, translateY]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
        />
        <Animated.View style={[sh.sheetShell, sheetAnimatedStyle]}>
          <View style={[sh.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <View style={sh.grabberWrap}>
            <View style={sh.grabber} />
          </View>
          <View style={sh.sheetHeader}>
            <Text style={sh.sheetTitle}>{title}</Text>
            {onReset ? (
              <TouchableOpacity onPress={onReset} hitSlop={12}>
                <Text style={sh.resetText}>{resetLabel}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {children}
          {footer ?? (
            <TouchableOpacity style={sh.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={sh.doneBtnText}>Done</Text>
            </TouchableOpacity>
          )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createSheetModalStyles(_c: ColorPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.65)',
    },
  });
}
