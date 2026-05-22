import type { FontSource } from 'expo-font';
/**
 * Ionicons font map for `useFonts` / `Font.loadAsync`.
 * Uses a direct asset require — `Ionicons.font` is not always available at module init in Metro.
 */
export const iconFonts: Record<string, FontSource> = {
  ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
};
