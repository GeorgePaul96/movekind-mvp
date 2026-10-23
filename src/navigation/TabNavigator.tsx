import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import GardenScreen from '@/screens/main/GardenScreen';
import ChangesScreen from '@/screens/main/ChangesScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';
import { colors } from '@/constants/colors';
import { TabIcon } from './TabIcon';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '500' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="Garden"
        component={GardenScreen}
        options={{
          tabBarIcon: (p) => <TabIcon focused={p.focused} emoji="🌳" />,
        }}
      />
      <Tab.Screen
        name="Changes"
        component={ChangesScreen}
        options={{
          tabBarIcon: (p) => <TabIcon focused={p.focused} emoji="🌱" />,
        }}
      />
      <Tab.Screen
        name="Me"
        component={ProfileScreen}
        options={{
          tabBarIcon: (p) => <TabIcon focused={p.focused} emoji="🙂" />,
        }}
      />
    </Tab.Navigator>
  );
}
