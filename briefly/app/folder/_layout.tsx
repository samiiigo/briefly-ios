import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { NavigatorBottomBlur } from '@/components/navigation/chrome/NavigatorBottomBlur';
import { FolderChromeOverlay } from '@/components/navigation/overlays/FolderChromeOverlay';
import { useThemedStackShell } from '@/components/navigation/layout/themedStackLayout';
export default function FolderLayout() {
  const shell = useThemedStackShell();
  return (
    <View style={shell.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: shell.contentStyle,
          animation: 'slide_from_right',
          ...Platform.select({
            ios: {
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            },
            android: {
              gestureEnabled: false,
              animation: 'slide_from_right',
            },
          }),
        }}
      />
      <NavigatorBottomBlur scope="folder" />
      <FolderChromeOverlay />
    </View>
  );
}
