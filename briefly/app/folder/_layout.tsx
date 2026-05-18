import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/theme';

export default function FolderLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
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
  );
}
