import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { HomeScreen } from '../screens/HomeScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RecordingScreen } from '../screens/RecordingScreen';
import { SaveRecordingScreen } from '../screens/SaveRecordingScreen';
import { SummarizingScreen } from '../screens/SummarizingScreen';
import { TranscriptScreen } from '../screens/TranscriptScreen';

import { RootStackParamList, MainTabParamList } from '../types';
import { Colors, BorderRadius } from '../utils/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              tint="dark"
              intensity={80}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, { default: any; focused: any }> = {
            Home: { default: 'home-outline', focused: 'home' },
            Library: { default: 'library-outline', focused: 'library' },
            Settings: { default: 'settings-outline', focused: 'settings' },
          };
          const name = icons[route.name];
          return (
            <Ionicons
              name={focused ? name.focused : name.default}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_bottom',
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'none' }} />
        <Stack.Screen name="Recording" component={RecordingScreen} />
        <Stack.Screen name="SaveRecording" component={SaveRecordingScreen} />
        <Stack.Screen name="Summarizing" component={SummarizingScreen} />
        <Stack.Screen
          name="Transcript"
          component={TranscriptScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
