import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { colors, stateColors } from '@/constants/colors';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import type { UserState } from '@/types';
import { BarChart } from '@/components/BarChart';
import { useBehavioralProfile } from '@/hooks/useBehavioralProfile';
import { BEHAVIORAL_FALLBACK, RE_ENTRY_READINESS } from '@/constants/copy';

interface StateStats {
  label: string;
  percentage: number;
  count: number;
  color: string;
}

interface PlaybookItem {
  name: string;
  category: string;
  average_energy_delta: number;
  times_completed: number;
}

export default function JourneyScreen() {
  const user = useAuthStore((s) => s.user);
  const { profile } = useBehavioralProfile();

  const [loading, setLoading] = useState(true);
  const [stateStats, setStateStats] = useState<StateStats[]>([]);
  const [playbook, setPlaybook] = useState<PlaybookItem[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [avgDelta, setAvgDelta] = useState(0.0);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    let cancelled = false;

    const loadJourneyData = async () => {
      // 1. Fetch check-ins to calculate state distribution
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('energy_score')
        .eq('user_id', user.id);

      // 2. Fetch user exercise stats for Personal Playbook
      const { data: statsData } = await supabase
        .from('user_exercise_stats')
        .select('times_completed, average_energy_delta, exercise:exercises(name, category)')
        .eq('user_id', user.id)
        .order('average_energy_delta', { ascending: false })
        .limit(3);

      // 3. Fetch total completed sessions count
      const { count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');

      // 3b. Premium entitlement (gates the extended history/trend cards)
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .maybeSingle();

      // 4. Fetch average rating delta
      const { data: ratings } = await supabase
        .from('post_ratings')
        .select('rating_delta')
        .eq('session_id IN (select id from sessions where user_id = ?)', user.id); 
      // Wait, let's write a clean query for post_ratings delta:
      const { data: ratingData } = await supabase
        .from('post_ratings')
        .select('rating_delta, sessions!inner(user_id)')
        .eq('sessions.user_id', user.id);

      if (cancelled) return;

      // Process check-ins
      const counts: Record<UserState, number> = {
        overloaded: 0,
        recovering: 0,
        regulated: 0,
        activated: 0,
      };

      (checkIns || []).forEach((c) => {
        let state: UserState = 'recovering';
        if (c.energy_score === 1) state = 'overloaded';
        else if (c.energy_score <= 3) state = 'recovering';
        else if (c.energy_score === 4) state = 'regulated';
        else state = 'activated';
        counts[state]++;
      });

      const totalCheckins = (checkIns || []).length || 1;
      
      const statsList: StateStats[] = [
        { label: 'Overloaded', count: counts.overloaded, percentage: Math.round((counts.overloaded / totalCheckins) * 100), color: stateColors.overloaded.accent },
        { label: 'Recovering', count: counts.recovering, percentage: Math.round((counts.recovering / totalCheckins) * 100), color: stateColors.recovering.accent },
        { label: 'Regulated', count: counts.regulated, percentage: Math.round((counts.regulated / totalCheckins) * 100), color: stateColors.regulated.accent },
        { label: 'Activated', count: counts.activated, percentage: Math.round((counts.activated / totalCheckins) * 100), color: stateColors.activated.accent },
      ];

      // Process playbook items
      const mappedPlaybook: PlaybookItem[] = (statsData || []).map((s: any) => ({
        name: s.exercise.name,
        category: s.exercise.category,
        average_energy_delta: Number(s.average_energy_delta),
        times_completed: s.times_completed,
      }));

      // Process average delta
      let meanDelta = 0;
      if (ratingData && ratingData.length > 0) {
        const sum = ratingData.reduce((acc, curr) => acc + curr.rating_delta, 0);
        meanDelta = sum / ratingData.length;
      }

      setStateStats(statsList);
      setPlaybook(mappedPlaybook);
      setTotalSessions(count || 0);
      setAvgDelta(meanDelta);
      setIsPremium(Boolean(profileRow?.is_premium));
      setLoading(false);
    };

    loadJourneyData().catch((err) => {
      console.warn('Could not load journey data:', err);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const isPlaybookUnlocked = totalSessions >= 10;

  if (loading) {
    return (
      <Screen>
        <Header tag="Capacity Journey" title="Your State Journey" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.sage} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <Header tag="Capacity Journey" title="Your State Journey" />

        <View style={styles.gardenCard}>
          <Text style={{ fontSize: 32 }} importantForAccessibility="no" accessibilityElementsHidden>🌿</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.gardenTitle} accessibilityRole="header">Momentum Garden</Text>
            <Text style={styles.gardenDesc}>
              {totalSessions === 0 
                ? 'Check in and complete your first session to plant your garden.' 
                : 'Your garden is stable. Your physical momentum is preserved and rest is honored.'}
            </Text>
          </View>
        </View>

        <Card style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Nervous System States Distribution</Text>
          <Text style={styles.sectionDesc}>Percentage of days spent in each readiness capacity state:</Text>
          
          <View style={styles.barContainer}>
            {stateStats.map((stat) => (
              <View
                key={stat.label}
                style={styles.barRow}
                accessible
                accessibilityLabel={`${stat.label}: ${stat.percentage} percent, ${stat.count} ${stat.count === 1 ? 'day' : 'days'}`}
              >
                <Text style={styles.barLabel}>{stat.label}</Text>
                <View style={styles.barTrackBg} importantForAccessibility="no-hide-descendants">
                  <View style={[styles.barTrack, { width: `${stat.percentage}%`, backgroundColor: stat.color }]} />
                </View>
                <Text style={styles.barValue}>{stat.percentage}%</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Personal Playbook</Text>
          {isPlaybookUnlocked ? (
            <View>
              <View style={styles.statsSummaryRow}>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>Total Sessions</Text>
                  <Text style={styles.summaryValue}>{totalSessions}</Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>Avg. Energy Delta</Text>
                  <Text style={[styles.summaryValue, { color: colors.sage }]}>
                    +{avgDelta.toFixed(1)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.sectionDesc, { marginTop: 12 }]}>Your Top Recovery Tools:</Text>
              {playbook.length === 0 ? (
                <Text style={styles.playbookNotice}>No exercise statistics aggregated yet.</Text>
              ) : (
                playbook.map((item, idx) => (
                  <View key={idx} style={styles.playbookRow}>
                    <Text style={styles.playbookRank}>{idx + 1}.</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playbookName}>{item.name}</Text>
                      <Text style={styles.playbookCat}>{item.category}</Text>
                    </View>
                    <Text style={styles.playbookDelta}>+{item.average_energy_delta.toFixed(1)} delta</Text>
                  </View>
                ))
              )}
            </View>
          ) : (
            <View>
              <Text style={styles.playbookNotice}>
                Complete {10 - totalSessions} more sessions to unlock your Personal Playbook and see which exercises and times of day optimize your energy delta.
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBar, { width: `${(totalSessions / 10) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{totalSessions} / 10 sessions completed</Text>
            </View>
          )}
        </Card>
        {/* --- Behavioral Insights (Spec B) — extended history is premium --- */}
        {isPremium ? (
          <>
            <Card style={{ marginBottom: 12 }}>
              <Text style={styles.sectionTitle} accessibilityRole="header">Rhythm Over Time</Text>
              {profile && profile.rhythm.weeklyCounts.length > 0 ? (
                <View>
                  <Text style={styles.sectionDesc}>Sessions per week as you return:</Text>
                  <BarChart
                    data={profile.rhythm.weeklyCounts.map((v, i) => ({ label: `W${i + 1}`, value: v }))}
                    color={colors.sageMid}
                    highlightColor={colors.sage}
                    unit="sessions / week"
                  />
                  {profile.rhythm.observation ? (
                    <Text style={styles.insightLine}>{profile.rhythm.observation}</Text>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.sectionDesc}>Your weekly rhythm will appear here as you return.</Text>
              )}
            </Card>

            <Card style={{ marginBottom: 12 }}>
              <Text style={styles.sectionTitle} accessibilityRole="header">Return Rhythm</Text>
              {profile && profile.gaps.gapHistory.length > 0 ? (
                <View>
                  <Text style={styles.sectionDesc}>Days between your recent sessions:</Text>
                  <BarChart
                    data={profile.gaps.gapHistory.map((v, i) => ({ label: `${i + 1}`, value: v }))}
                    color={colors.sky}
                    unit="days between sessions"
                  />
                  {profile.gaps.observation ? (
                    <Text style={styles.insightLine}>{profile.gaps.observation}</Text>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.sectionDesc}>We'll show the rhythm of your returns here.</Text>
              )}
            </Card>
          </>
        ) : (
          <Card style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Your Full Journey</Text>
            <Text style={styles.sectionDesc}>
              Rhythm-over-time and return-rhythm trends are part of Premium's
              extended history. Your check-ins, sessions, and recovery insights
              stay free — this just adds the long-term view whenever you're ready.
            </Text>
          </Card>
        )}

        {profile ? (
          <Card style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Where You Are Now</Text>
            <Text style={styles.recoveryMessage}>{BEHAVIORAL_FALLBACK[profile.recovery.signal].message}</Text>
            <Text style={styles.insightLine}>{RE_ENTRY_READINESS[profile.recovery.reEntryReadiness]}</Text>
          </Card>
        ) : null}

        {profile && profile.wins.length > 0 ? (
          <Card style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Recent Wins</Text>
            {profile.wins.map((w, i) => (
              <View key={i} style={styles.winRow}>
                <Text style={{ fontSize: 16 }} importantForAccessibility="no" accessibilityElementsHidden>🌱</Text>
                <Text style={styles.winText}>{w.observation}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {/* --- Self-Trust (3A-4) --- */}
        <Card style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Self-Trust</Text>
          {profile && profile.followThrough.hasHistory ? (
            <View>
              <View style={styles.statsSummaryRow}>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>Follow-Through</Text>
                  <Text style={[styles.summaryValue, { color: colors.sageDark }]}>
                    {Math.round(profile.followThrough.completionRate * 100)}%
                  </Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>Sessions Finished</Text>
                  <Text style={styles.summaryValue}>
                    {profile.followThrough.completed} / {profile.followThrough.total}
                  </Text>
                </View>
              </View>
              {profile.followThrough.observation ? (
                <Text style={styles.insightLine}>{profile.followThrough.observation}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.sectionDesc}>Your follow-through shows here once you've finished a few sessions.</Text>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gardenCard: {
    backgroundColor: colors.warmLight,
    borderColor: colors.warm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  gardenTitle: { fontSize: 18, fontWeight: '600', color: colors.warmDark },
  gardenDesc: { fontSize: 12, color: colors.warmAccent, marginTop: 2, lineHeight: 16 },
  sectionTitle: {
    fontSize: 12,
    color: colors.muted,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 12,
    lineHeight: 16,
  },
  insightLine: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 10,
    lineHeight: 16,
  },
  recoveryMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.sageDark,
    lineHeight: 20,
  },
  winRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  winText: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
  },
  barContainer: {
    gap: 12,
    marginTop: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barLabel: {
    width: 80,
    fontSize: 12,
    color: colors.ink,
    fontWeight: '500',
  },
  barTrackBg: {
    flex: 1,
    height: 10,
    backgroundColor: colors.bg,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barTrack: {
    height: '100%',
    borderRadius: 5,
  },
  barValue: {
    width: 32,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  playbookNotice: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.bg,
    borderRadius: 3,
    marginTop: 12,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.sage,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'right',
    fontWeight: '600',
  },
  statsSummaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 4,
  },
  playbookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: 10,
    borderRadius: 12,
    marginTop: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  playbookRank: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
    width: 24,
  },
  playbookName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  playbookCat: {
    fontSize: 10,
    color: colors.muted,
    textTransform: 'capitalize',
    marginTop: 1,
  },
  playbookDelta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.sage,
  },
});
