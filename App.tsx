import './global.css';
import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from '@/navigation/RootNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { initNotifications } from '@/services/notifications';
import { colors } from '@/constants/colors';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([
          restoreSession(),
          useSettingsStore.getState().hydrate(),
        ]);
        await initNotifications();
      } catch (e) {
        console.warn('Bootstrapping error:', e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, [restoreSession]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sage} />
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
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
