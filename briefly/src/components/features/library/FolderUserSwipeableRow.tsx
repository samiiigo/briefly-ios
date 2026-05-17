import React, { useCallback, useRef } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Colors, BorderRadius, withAppFont } from '@/theme';

const LEADING_WIDTH = 96;

interface FolderUserSwipeableRowProps {
  pinned: boolean;
  onPress: () => void;
  onTogglePin: () => void;
  onLongPress: () => void;
  /** Swipe + long-press apply when true (user-created folders). */
  pinInteractionEnabled: boolean;
  layout: 'list' | 'grid';
  children: React.ReactNode;
}

/**
 * Swipe right (reveal leading actions) to pin/unpin; long-press opens folder options.
 */
export function FolderUserSwipeableRow({
  pinned,
  onPress,
  onTogglePin,
  onLongPress,
  pinInteractionEnabled,
  layout,
  children,
}: FolderUserSwipeableRowProps) {
  const swipeableRef = useRef<React.ElementRef<typeof Swipeable> | null>(null);

  const handlePinAction = useCallback(() => {
    swipeableRef.current?.close();
    onTogglePin();
  }, [onTogglePin]);

  const renderLeftActions = useCallback(() => {
    return (
      <Pressable
        style={[styles.leadingAction, layout === 'grid' && styles.leadingActionGrid]}
        onPress={handlePinAction}
        accessibilityRole="button"
        accessibilityLabel={pinned ? 'Unpin folder' : 'Pin folder'}
      >
        <Ionicons name={pinned ? 'pin' : 'pin-outline'} size={24} color={Colors.textPrimary} />
        <Text style={styles.leadingActionLabel}>{pinned ? 'Unpin' : 'Pin'}</Text>
      </Pressable>
    );
  }, [handlePinAction, pinned, layout]);

  if (!pinInteractionEnabled) {
    return <>{children}</>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      overshootLeft={false}
      overshootRight={false}
      rightThreshold={40}
      leftThreshold={40}
      renderLeftActions={renderLeftActions}
    >
      <Pressable
        style={layout === 'grid' ? styles.pressableGrid : styles.pressableList}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={450}
        accessibilityHint="Long press for folder options. Swipe right to pin or unpin."
      >
        {children}
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  pressableList: {
    width: '100%',
  },
  pressableGrid: {
    width: '100%',
  },
  leadingAction: {
    width: LEADING_WIDTH,
    marginBottom: 0,
    borderRadius: BorderRadius.cardXL,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  leadingActionGrid: {
    alignSelf: 'stretch',
    minHeight: 94,
    marginRight: 8,
    marginBottom: 12,
  },
  leadingActionLabel: withAppFont({
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  }),
});
