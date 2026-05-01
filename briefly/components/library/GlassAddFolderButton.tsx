import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

/** Matches header chrome on Library; glass recipe aligns with `RecordButton` (blur, border, shadow). */
const SIZE = 44;

type IonName = React.ComponentProps<typeof Ionicons>['name'];

interface GlassCircleIconButtonProps {
  ionIcon: IonName;
  iconSize?: number;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

/**
 * Circular liquid-glass control for a single Ionicons glyph (blur on iOS,
 * frosted fallback on Android). Use accessibilityLabel + accessibilityHint
 * for VoiceOver / TalkBack (maps to aria-label on web).
 */
export function GlassCircleIconButton({
  ionIcon,
  iconSize = 24,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: GlassCircleIconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={styles.touch}
    >
      <View style={styles.glassWrap}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFill, styles.blur]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidGlass]} />
        )}
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'transparent']}
          style={styles.highlight}
          pointerEvents="none"
        />
        <Ionicons name={ionIcon} size={iconSize} color="rgba(255,255,255,0.96)" />
      </View>
    </TouchableOpacity>
  );
}

interface Props {
  onPress: () => void;
}

/** Icon-only (+) for creating folders. */
export function GlassAddFolderButton({ onPress }: Props) {
  return (
    <GlassCircleIconButton
      ionIcon="add"
      iconSize={26}
      onPress={onPress}
      accessibilityLabel="New folder"
      accessibilityHint="Creates a new folder to organize your recordings"
    />
  );
}

const styles = StyleSheet.create({
  touch: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  glassWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  blur: {
    borderRadius: SIZE / 2,
  },
  androidGlass: {
    backgroundColor: 'rgba(40,40,45,0.75)',
    borderRadius: SIZE / 2,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SIZE / 3,
    borderTopLeftRadius: SIZE / 2,
    borderTopRightRadius: SIZE / 2,
  },
});
