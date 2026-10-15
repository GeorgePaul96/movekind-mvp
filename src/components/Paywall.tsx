import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { colors } from '@/constants/colors';
import { PAYWALL_COPY } from '@/constants/copy';
import { useSessionStore } from '@/store/sessionStore';
import { useProfileStore } from '@/store/profileStore';
import { db } from '@/services/db';
import { exerciseById } from '@/data/exercises';
import { startCheckout } from '@/services/premium';

export function Paywall() {
  const profileId = useProfileStore((s) => s.profile?.id ?? '');
  const setPremium = useProfileStore((s) => s.setPremium);
  const setPaywallVisible = useSessionStore((s) => s.setPaywallVisible);
  const dismissPaywall = useSessionStore((s) => s.dismissPaywall);
  const loadStatsAndHistory = useSessionStore((s) => s.loadStatsAndHistory);

  const [loading, setLoading] = useState(true);
  const [avgDelta, setAvgDelta] = useState(1.2);
  const [bestCategory, setBestCategory] = useState('Mobilize');

  useEffect(() => {
    const loadInsights = async () => {
      // 1. Average rating delta across every rated session on this phone
      const ratings = await db.ratings.list();
      if (ratings.length > 0) {
        setAvgDelta(ratings.reduce((acc, r) => acc + r.rating_delta, 0) / ratings.length);
      }

      // 2. The category whose exercises lift you most, from local per-exercise stats
      const catAverages: Record<string, { sum: number; count: number }> = {};
      for (const s of await db.stats.all()) {
        const cat = exerciseById(s.exercise_id)?.category;
        if (!cat) continue;
        catAverages[cat] ??= { sum: 0, count: 0 };
        catAverages[cat].sum += s.average_energy_delta;
        catAverages[cat].count++;
      }
      let topCat: string | null = null;
      let topAvg = -Infinity;
      for (const [cat, { sum, count }] of Object.entries(catAverages)) {
        if (sum / count > topAvg) {
          topAvg = sum / count;
          topCat = cat;
        }
      }
      if (topCat) setBestCategory(topCat.charAt(0).toUpperCase() + topCat.slice(1));

      setLoading(false);
    };

    loadInsights().catch((err) => {
      console.warn('Error loading paywall insights:', err);
      setLoading(false);
    });
  }, []);

  const handleCheckout = async () => {
    const result = await startCheckout(profileId);
    if (result) {
      Alert.alert('Checkout Link', `Redirecting to premium portal: ${result.url}`);
    } else {
      // Beta simulation until store billing is wired: flip the local premium flag.
      setLoading(true);
      try {
        await setPremium(true);
        Alert.alert('Beta Upgrade Success', 'You are now a Premium Member in the beta simulation!');
        setPaywallVisible(false);
        await loadStatsAndHistory();
      } catch (err) {
        Alert.alert('Error upgrading', (err as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <ActivityIndicator size="large" color={colors.primary} />
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.lockIcon} importantForAccessibility="no" accessibilityElementsHidden>🌿</Text>
        <Text style={styles.title} accessibilityRole="header">{PAYWALL_COPY.title}</Text>

        <View style={styles.insightBox}>
          <Text style={styles.insightEmoji} importantForAccessibility="no" accessibilityElementsHidden>📊</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>{PAYWALL_COPY.learnedTitle}</Text>
            <Text style={styles.insightText}>{PAYWALL_COPY.restored(`+${avgDelta.toFixed(1)}`)}</Text>
            <Text style={[styles.insightText, { marginTop: 6 }]}>
              {PAYWALL_COPY.bestCategory(bestCategory.charAt(0).toUpperCase() + bestCategory.slice(1))}
            </Text>
          </View>
        </View>

        <Text style={styles.pitchText}>{PAYWALL_COPY.pitch}</Text>

        <View style={{ width: '100%', gap: 6 }}>
          <Button
            label={PAYWALL_COPY.upgrade}
            accessibilityLabel={PAYWALL_COPY.upgradeA11y}
            onPress={handleCheckout}
          />
          <Button label={PAYWALL_COPY.later} variant="link" onPress={dismissPaywall} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  card: {
    padding: 20,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 54,
    marginVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  insightBox: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    padding: 16,
    borderRadius: 16,
    borderColor: colors.primary,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    marginBottom: 20,
  },
  insightEmoji: {
    fontSize: 24,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
  },
  insightText: {
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  pitchText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
});
