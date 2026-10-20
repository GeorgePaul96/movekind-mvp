import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { colors, stateColors } from '@/constants/colors';
import { db } from '@/services/db';
import { exerciseById } from '@/data/exercises';
import { mapEnergyToState } from '@/domain/checkin/moods';
import { useProfileStore } from '@/store/profileStore';
import { effectivePremium } from '@/domain/premium/entitlements';
import type { UserState } from '@/types';
import { BarChart } from '@/components/BarChart';
import { useBehavioralProfile } from '@/hooks/useBehavioralProfile';
import { BEHAVIORAL_FALLBACK, MOOD_COPY, RE_ENTRY_READINESS } from '@/constants/copy';

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
  const { profile } = useBehavioralProfile();
  const isPremium = effectivePremium(useProfileStore((s) => s.profile?.is_premium ?? false));

  const [loading, setLoading] = useState(true);
  const [stateStats, setStateStats] = useState<StateStats[]>([]);
  const [playbook, setPlaybook] = useState<PlaybookItem[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [avgDelta, setAvgDelta] = useState(0.0);

  useEffect(() => {
    let cancelled = false;

    const loadJourneyData = async () => {
      const [checkIns, stats, completed, ratings] = await Promise.all([
        db.checkIns.all(),
        db.stats.all(),
        db.sessions.countCompleted(),
        db.ratings.list(),
      ]);
      if (cancelled) return;

      // How your days have felt: share of check-ins per mood
      const counts: Record<UserState, number> = { overloaded: 0, recovering: 0, regulated: 0, activated: 0 };
      for (const c of checkIns) counts[mapEnergyToState(c.energy_score)]++;
      const totalCheckins = checkIns.length || 1;
      const pct = (n: number) => Math.round((n / totalCheckins) * 100);
      setStateStats(
        (['overloaded', 'recovering', 'regulated', 'activated'] as const).map((m) => ({
          label: MOOD_COPY[m].label,
          count: counts[m],
          percentage: pct(counts[m]),
          color: stateColors[m].accent,
        })),
      );

      // Personal Playbook: the three exercises that lift you most
      setPlaybook(
        [...stats]
          .sort((a, b) => b.average_energy_delta - a.average_energy_delta)
          .slice(0, 3)
          .flatMap((s) => {
            const ex = exerciseById(s.exercise_id);
            return ex
              ? [{ name: ex.name, category: ex.category, average_energy_delta: s.average_energy_delta, times_completed: s.times_completed }]
              : [];
          }),
      );

      setTotalSessions(completed);
      setAvgDelta(ratings.length ? ratings.reduce((acc, r) => acc + r.rating_delta, 0) / ratings.length : 0);
      setLoading(false);
    };

    loadJourneyData().catch((err) => {
      console.warn('Could not load journey data:', err);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const isPlaybookUnlocked = totalSessions >= 10;

  if (loading) {
    return (
      <Screen>
        <Header tag="Journey" title="Your journey" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <Header tag="Journey" title="Your journey" />

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
          <Text style={styles.sectionTitle} accessibilityRole="header">How your days have felt</Text>
          <Text style={styles.sectionDesc}>Share of check-in days at each energy level:</Text>
          
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
                  <Text style={styles.summaryLabel}>Avg. lift per session</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
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
                    color={stateColors.recovering.tint}
                    highlightColor={colors.primary}
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
                    color={stateColors.overloaded.tint}
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
              stay free. This just adds the long-term view whenever you're ready.
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
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
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
    backgroundColor: stateColors.regulated.soft,
    borderColor: stateColors.regulated.tint,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  gardenTitle: { fontSize: 18, fontWeight: '600', color: stateColors.regulated.ink },
  gardenDesc: { fontSize: 13, color: stateColors.regulated.accent, marginTop: 2, lineHeight: 16 },
  sectionTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  insightLine: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 16,
  },
  recoveryMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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
    color: colors.textPrimary,
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
    width: 112,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  barTrackBg: {
    flex: 1,
    height: 10,
    backgroundColor: colors.background,
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
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  playbookNotice: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    marginTop: 12,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: colors.textSecondary,
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
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  playbookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 12,
    marginTop: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  playbookRank: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    width: 24,
  },
  playbookName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  playbookCat: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 1,
  },
  playbookDelta: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
