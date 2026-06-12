import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import HomeScreen from '@/screens/main/HomeScreen';
import JourneyScreen from '@/screens/main/JourneyScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';
import { colors } from '@/constants/colors';
import { TabIcon } from './TabIcon';
import type { TabParamList } from './types';
import { useBootstrapData } from '@/hooks/useBootstrapData';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  useBootstrapData();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.sage,
        tabBarInactiveTintColor: colors.hint,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: (p) => <TabIcon focused={p.focused} emoji="🏡" />,
        }}
      />
      <Tab.Screen
        name="Journey"
        component={JourneyScreen}
        options={{
          tabBarIcon: (p) => <TabIcon focused={p.focused} emoji="🌱" />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: (p) => <TabIcon focused={p.focused} emoji="🌿" />,
        }}
      />
    </Tab.Navigator>
  );
}
