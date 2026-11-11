import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckInFlow } from '@/components/flow/CheckInFlow';
import { MonthView } from '@/components/home/MonthView';
import { TabBar, type HomeTab } from '@/components/home/parts';
import { colors } from '@/constants/colors';
import { HOME_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { localDayKey } from '@/domain/garden/days';
import { careToday } from '@/domain/home/care';
import ChangesView from '@/screens/main/ChangesView';
import InsightsView from '@/screens/main/InsightsView';
import MeView from '@/screens/main/MeView';
import TodayView from '@/screens/main/TodayView';
import { useGardenStore } from '@/store/gardenStore';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Home. Four plain tabs, and the paged check-in on top of them: it opens by itself once a
 * day when nothing has been noted yet, and one page at a time from the homepage's Edit
 * buttons. Maple's yard is kept aside as an optional home (see MeView).
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<HomeTab>('today');
  const [flow, setFlow] = useState<{ step: number; single: boolean } | null>(null);
  const loaded = useGardenStore((s) => s.loaded);
  const load = useGardenStore((s) => s.load);
  const refreshSteps = useGardenStore((s) => s.refreshSteps);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  useEffect(() => {
    refreshSteps().catch(() => {});
  }, [refreshSteps]);

  // Once a day, and only if the day is still empty: start with the first page.
  useEffect(() => {
    if (!loaded) return;
    const todayKey = localDayKey(new Date());
    const settings = useSettingsStore.getState();
    if (settings.flowSeenDay === todayKey) return;
    void settings.markFlowSeen(todayKey);
    const { checkIns, water, meals, workouts, sleep } = useGardenStore.getState();
    const done = careToday({ checkIns, water, meals, workouts, sleep }, new Date());
    if (!Object.values(done).some(Boolean)) setFlow({ step: 0, single: false });
  }, [loaded]);

  if (flow) {
    return <CheckInFlow initialStep={flow.step} single={flow.single} onClose={() => setFlow(null)} />;
  }

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
          {tab === 'today' ? <TodayView onOpenFlow={(step, single) => setFlow({ step, single })} /> : null}
          {tab === 'changes' ? (
            <>
              <MonthView />
              <ChangesView />
            </>
          ) : null}
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
