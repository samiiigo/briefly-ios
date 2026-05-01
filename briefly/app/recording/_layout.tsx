import { Stack } from 'expo-router';
import { Colors } from '../../utils/theme';

export default function RecordingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
