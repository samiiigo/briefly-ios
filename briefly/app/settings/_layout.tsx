import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useThemedStackShell } from '@/components/navigation/themedStackLayout';

export default function SettingsLayout() {
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
    </View>
  );
}
