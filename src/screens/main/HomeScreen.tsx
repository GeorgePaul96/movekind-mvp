import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';

// Components
import { CheckInFlow } from '@/components/CheckInFlow';
import { SessionOverview } from '@/components/SessionOverview';
import { SessionPlayer } from '@/components/SessionPlayer';
import { SessionComplete } from '@/components/SessionComplete';
import { Paywall } from '@/components/Paywall';
import { BehavioralBanner } from '@/components/BehavioralBanner';
import { useBehavioralProfile } from '@/hooks/useBehavioralProfile';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  
  const currentSession = useSessionStore((s) => s.currentSession);
  const currentCheckIn = useSessionStore((s) => s.currentCheckIn);
  const composedBlocks = useSessionStore((s) => s.composedBlocks);
  const activeIndex = useSessionStore((s) => s.activeBlockIndex);
  const paywallVisible = useSessionStore((s) => s.paywallVisible);
  
  const loadStatsAndHistory = useSessionStore((s) => s.loadStatsAndHistory);
  const loading = useSessionStore((s) => s.loading);

  const { profile: behavioralProfile } = useBehavioralProfile();

  useEffect(() => {
    loadStatsAndHistory();
  }, [loadStatsAndHistory]);

  const renderContent = () => {
    if (paywallVisible) {
      return <Paywall />;
    }

    if (loading && !currentSession) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.sage} />
        </View>
      );
    }

    // 1. Check if there's an active session
    if (currentSession) {
      if (currentSession.status === 'generated') {
        return <SessionOverview />;
      }
      
      if (currentSession.status === 'started') {
        // If there are still blocks left to play
        if (activeIndex < composedBlocks.length) {
          return <SessionPlayer />;
        }
        // If all blocks are completed/played, show the completion/rating view
        return <SessionComplete />;
      }
    }

    // 2. If no active session, check if checked in today
    if (!currentCheckIn) {
      return (
        <View style={{ gap: 12 }}>
          <BehavioralBanner profile={behavioralProfile} />
          <CheckInFlow />
        </View>
      );
    }

    // 3. Already checked in and no active session (i.e. completed or bypassed for today)
    return (
      <View style={{ gap: 12 }}>
        <Card style={styles.doneCard}>
          <Text style={{ fontSize: 32 }}>🌿</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.doneTitle}>All Set for Today</Text>
            <Text style={styles.doneDesc}>
              You completed your daily attunement. Your capacity rating was successfully logged.
            </Text>
          </View>
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Today's Capacity Win</Text>
          <View style={styles.winRow}>
            <Text style={{ fontSize: 22 }}>🌱</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.winTitle}>Body Attunement</Text>
              <Text style={styles.winSub}>
                You listened to your nervous system capacity and completed today's composed routine.
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  return (
    <Screen>
      <Header 
        tag="Daily attunement" 
        title={user?.user_metadata?.name ? `Hello, ${user.user_metadata.name}` : 'MoveKind'} 
      />
      {renderContent()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCard: {
    backgroundColor: colors.sageLight,
    borderColor: colors.sage,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.sageDark,
  },
  doneDesc: {
    fontSize: 12,
    color: colors.sageDark,
    opacity: 0.8,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 12,
    color: colors.muted,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  winRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  winTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  winSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
});
