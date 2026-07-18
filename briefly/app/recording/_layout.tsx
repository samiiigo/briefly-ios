import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { NavigatorBottomBlur } from '@/navigation/chrome/NavigatorBottomBlur';
import { useThemedStackShell } from '@/navigation/layout/themedStackLayout';
export default function RecordingLayout() {
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
      <NavigatorBottomBlur scope="recording" />
    </View>
  );
}
