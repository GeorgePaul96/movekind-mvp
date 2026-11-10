import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettingsStore } from '@/store/settingsStore';
import HomeScreen from '@/screens/main/HomeScreen';
import YardScreen from '@/screens/main/YardScreen';
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen';
import { rootRoute } from './rootRoute';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Home is the simple screen. Maple's yard is kept aside while its art is unfinished:
 * it becomes home only when switched on in You (`settingsStore.yardHome`).
 */
function Main() {
  const yardHome = useSettingsStore((s) => s.yardHome);
  return yardHome ? <YardScreen /> : <HomeScreen />;
}

/** No accounts: onboarding → home (see rootRoute). */
export default function RootNavigator() {
  const onboarded = useSettingsStore((s) => s.onboarded);
  const route = rootRoute({ onboarded });

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {route === 'Onboarding' && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
        {route === 'Main' && <Stack.Screen name="Main" component={Main} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
