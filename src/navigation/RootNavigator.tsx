import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettingsStore } from '@/store/settingsStore';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen';
import { rootRoute } from './rootRoute';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** No accounts: onboarding → the app (see rootRoute). */
export default function RootNavigator() {
  const onboarded = useSettingsStore((s) => s.onboarded);
  const route = rootRoute({ onboarded });

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {route === 'Onboarding' && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
        {route === 'Main' && <Stack.Screen name="Main" component={TabNavigator} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
