import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GardenScreen from '@/screens/main/GardenScreen';
import ChangesScreen from '@/screens/main/ChangesScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';
import { colors, elevation } from '@/constants/colors';
import { TabIcon } from './TabIcon';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

/** Height the floating bar covers; screens pad their bottom by this much (see Screen). */
export const TAB_BAR_SPACE = 104;

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // Tabs stay mounted; freezing the hidden ones stops the garden animating off screen.
        freezeOnBlur: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 18,
          height: 72,
          paddingTop: 12,
          paddingBottom: 12,
          borderRadius: 999,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.ring,
          backgroundColor: colors.surface,
          ...elevation.raised,
        },
      }}
    >
      <Tab.Screen
        name="Garden"
        component={GardenScreen}
        options={{
          tabBarAccessibilityLabel: 'Garden',
          tabBarIcon: (p) => <TabIcon focused={p.focused} icon="sprout" label="Garden" />,
        }}
      />
      <Tab.Screen
        name="Changes"
        component={ChangesScreen}
        options={{
          tabBarAccessibilityLabel: 'Changes',
          tabBarIcon: (p) => <TabIcon focused={p.focused} icon="creation" label="Changes" />,
        }}
      />
      <Tab.Screen
        name="Me"
        component={ProfileScreen}
        options={{
          tabBarAccessibilityLabel: 'Me',
          tabBarIcon: (p) => <TabIcon focused={p.focused} icon="account-circle-outline" label="Me" />,
        }}
      />
    </Tab.Navigator>
  );
}
