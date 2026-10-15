import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettingsStore } from '@/store/settingsStore';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** No accounts: first launch shows onboarding, every launch after goes straight Home. */
export default function RootNavigator() {
  const onboarded = useSettingsStore((s) => s.onboarded);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {onboarded ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
