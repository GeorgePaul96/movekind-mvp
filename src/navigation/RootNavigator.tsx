import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettingsStore } from '@/store/settingsStore';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen';
import SafetyNoticeScreen from '@/screens/onboarding/SafetyNoticeScreen';
import { rootRoute } from './rootRoute';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** No accounts: onboarding → one-time safety notice → the app (see rootRoute). */
export default function RootNavigator() {
  const onboarded = useSettingsStore((s) => s.onboarded);
  const safetyAcknowledged = useSettingsStore((s) => s.safetyAcknowledged);
  const route = rootRoute({ onboarded, safetyAcknowledged });

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {route === 'Onboarding' && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
        {route === 'SafetyNotice' && <Stack.Screen name="SafetyNotice" component={SafetyNoticeScreen} />}
        {route === 'Main' && <Stack.Screen name="Main" component={TabNavigator} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
