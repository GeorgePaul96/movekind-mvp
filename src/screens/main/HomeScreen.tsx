import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { SessionOverview } from '@/components/SessionOverview';
import { SessionPlayer } from '@/components/SessionPlayer';
import { SessionComplete } from '@/components/SessionComplete';
import { Paywall } from '@/components/Paywall';
import { BehavioralBanner } from '@/components/BehavioralBanner';
import { MoodPicker } from '@/components/home/MoodPicker';
import { LoggedPanel } from '@/components/home/LoggedPanel';
import { WeekView } from '@/components/home/WeekView';
import { useBehavioralProfile } from '@/hooks/useBehavioralProfile';
import { scheduleAdaptiveNudge } from '@/services/notifications';

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function partOfDay(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const name: string | null = user?.user_metadata?.name ?? null;

  const currentSession = useSessionStore((s) => s.currentSession);
  const currentCheckIn = useSessionStore((s) => s.currentCheckIn);
  const composedBlocks = useSessionStore((s) => s.composedBlocks);
  const activeIndex = useSessionStore((s) => s.activeBlockIndex);
  const paywallVisible = useSessionStore((s) => s.paywallVisible);
  const homeStep = useSessionStore((s) => s.homeStep);
  const loading = useSessionStore((s) => s.loading);
  const loadStatsAndHistory = useSessionStore((s) => s.loadStatsAndHistory);

  const { profile: behavioralProfile } = useBehavioralProfile();

  useEffect(() => {
    loadStatsAndHistory();
  }, [loadStatsAndHistory]);

  useEffect(() => {
    if (behavioralProfile) scheduleAdaptiveNudge(behavioralProfile.recovery.signal);
  }, [behavioralProfile]);

  // Order matters: an active session wins, then today's check-in step.
  const renderContent = () => {
    if (paywallVisible) return <Paywall />;

    if (loading && !currentSession && !currentCheckIn) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (currentSession?.status === 'generated') return <SessionOverview />;
    if (currentSession?.status === 'started') {
      return activeIndex < composedBlocks.length ? <SessionPlayer /> : <SessionComplete />;
    }

    if (!currentCheckIn || homeStep === 'pick') {
      return (
        <View style={{ gap: 12 }}>
          <BehavioralBanner profile={behavioralProfile} />
          <MoodPicker name={name} />
        </View>
      );
    }

    if (homeStep === 'logged') return <LoggedPanel />;
    return <WeekView name={name} />;
  };

  const now = new Date();
  return (
    <Screen>
      <Header tag={`${WEEKDAY[now.getDay()]} ${partOfDay(now)}`} title="MoveKind" />
      {renderContent()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { height: 300, alignItems: 'center', justifyContent: 'center' },
});
