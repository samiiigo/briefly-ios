import { View, Platform, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { NavigatorBottomBlur } from '@/components/navigation/NavigatorBottomBlur';
import { Colors } from '@/theme';

export default function RecordingLayout() {
  return (
    <View style={styles.root}>
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
    <NavigatorBottomBlur scope="recording" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
