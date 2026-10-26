import './global.css';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from '@/navigation/RootNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useProfileStore } from '@/store/profileStore';
import { useSettingsStore } from '@/store/settingsStore';
import { disableDailyReminder } from '@/services/notifications';
import { trackAppOpened } from '@/services/appOpens';
import { db } from '@/services/db';
import { useGardenStore } from '@/store/gardenStore';
import { colors } from '@/constants/colors';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  // Bundled with the app (no network). If a font ever fails, the phone's font is used instead.
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Local-first: everything loads from this phone — no network, no sign-in.
        await Promise.all([
          useSettingsStore.getState().hydrate(),
          useProfileStore.getState().hydrate(),
        ]);
        await db.dropLegacy(); // the old session app's tables, if this phone has them
        const { profile } = useProfileStore.getState();
        if (profile) trackAppOpened(profile.created_at);
        // No permission prompt at launch. If the reminder is off, also clear any reminder
        // an older version scheduled, so nothing the user didn't choose keeps firing.
        if (!useSettingsStore.getState().notificationsEnabled) await disableDailyReminder();
      } catch (e) {
        console.warn('Bootstrapping error:', e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  // Count each return to the app (the tester-week measure: did people come back daily?).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const { profile } = useProfileStore.getState();
      if (state === 'active' && profile) trackAppOpened(profile.created_at);
      // Steps keep counting while the app is closed; pick up the new total on return.
      if (state === 'active') useGardenStore.getState().refreshSteps().catch(() => {});
    });
    return () => sub.remove();
  }, []);

  if (!isReady || (!fontsLoaded && !fontError)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <StatusBar style="dark" />
          <RootNavigator />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
