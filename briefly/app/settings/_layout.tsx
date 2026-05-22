import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useThemedStackShell } from '@/components/navigation/layout/themedStackLayout';
export default function SettingsLayout() {
  const shell = useThemedStackShell();
  return (
    <View style={shell.root}>
      <Stack
        initialRouteName="index"
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
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="transcription-mode" />
        <Stack.Screen name="processing-mode" />
        <Stack.Screen name="folder-layout" />
        <Stack.Screen name="appearance" />
      </Stack>
    </View>
  );
}
