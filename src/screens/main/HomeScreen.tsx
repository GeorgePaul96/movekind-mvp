import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBar, type HomeTab } from '@/components/home/parts';
import { colors } from '@/constants/colors';
import { HOME_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import ChangesView from '@/screens/main/ChangesView';
import InsightsView from '@/screens/main/InsightsView';
import MeView from '@/screens/main/MeView';
import TodayView from '@/screens/main/TodayView';
import { useGardenStore } from '@/store/gardenStore';

/**
 * The simple home: four plain tabs, one page each. Everything the app does is reachable
 * here with ordinary controls. Maple's yard is kept aside as an optional home (see MeView).
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<HomeTab>('today');
  const loaded = useGardenStore((s) => s.loaded);
  const load = useGardenStore((s) => s.load);
  const refreshSteps = useGardenStore((s) => s.refreshSteps);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  useEffect(() => {
    refreshSteps().catch(() => {});
  }, [refreshSteps]);

  return (
    <View style={styles.screen}>
      <ScrollView
        // A fresh scroll view per tab, so each page opens at its top.
        key={tab}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.column}>
          {tab !== 'today' ? (
            <Text style={styles.title} accessibilityRole="header">
              {HOME_COPY.tabs[tab]}
            </Text>
          ) : null}
          {tab === 'today' ? <TodayView /> : null}
          {tab === 'changes' ? <ChangesView /> : null}
          {tab === 'insights' ? <InsightsView /> : null}
          {tab === 'you' ? <MeView /> : null}
        </View>
      </ScrollView>
      <TabBar tab={tab} onChange={setTab} bottomInset={insets.bottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 18, paddingBottom: 32 },
  // Keeps lines readable on tablets and the web.
  column: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  title: { ...font.extrabold, fontSize: 30, color: colors.textPrimary, marginBottom: 16 },
});
