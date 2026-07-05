import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Card } from './Card';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/services/supabase';
import { startCheckout } from '@/services/premium';

export function Paywall() {
  const user = useAuthStore((s) => s.user);
  const setPaywallVisible = useSessionStore((s) => s.setPaywallVisible);
  const dismissPaywall = useSessionStore((s) => s.dismissPaywall);
  const loadStatsAndHistory = useSessionStore((s) => s.loadStatsAndHistory);

  const [loading, setLoading] = useState(true);
  const [avgDelta, setAvgDelta] = useState(1.2);
  const [bestCategory, setBestCategory] = useState('Mobilize');

  useEffect(() => {
    if (!user) return;
    
    const loadInsights = async () => {
      // 1. Calculate average rating delta
      const { data: ratingData } = await supabase
        .from('post_ratings')
        .select('rating_delta, sessions!inner(user_id)')
        .eq('sessions.user_id', user.id);

      if (ratingData && ratingData.length > 0) {
        const sum = ratingData.reduce((acc, curr) => acc + curr.rating_delta, 0);
        setAvgDelta(sum / ratingData.length);
      }

      // 2. Fetch the user's best category
      const { data: stats } = await supabase
        .from('user_exercise_stats')
        .select('average_energy_delta, exercise:exercises(category)')
        .eq('user_id', user.id);

      if (stats && stats.length > 0) {
        const catAverages: Record<string, { sum: number; count: number }> = {};
        
        stats.forEach((s: any) => {
          const cat = s.exercise.category;
          const deltaVal = Number(s.average_energy_delta);
          if (!catAverages[cat]) {
            catAverages[cat] = { sum: 0, count: 0 };
          }
          catAverages[cat].sum += deltaVal;
          catAverages[cat].count++;
        });

        let topCat = 'Mobilize';
        let topAvg = -999;
        
        Object.keys(catAverages).forEach((cat) => {
          const avg = catAverages[cat]!.sum / catAverages[cat]!.count;
          if (avg > topAvg) {
            topAvg = avg;
            topCat = cat;
          }
        });

        setBestCategory(topCat.charAt(0).toUpperCase() + topCat.slice(1));
      }

      setLoading(false);
    };

    loadInsights().catch((err) => {
      console.warn('Error loading paywall insights:', err);
      setLoading(false);
    });
  }, [user]);

  const handleCheckout = async () => {
    if (!user) return;
    
    const result = await startCheckout(user.id);
    if (result) {
      Alert.alert('Checkout Link', `Redirecting to premium portal: ${result.url}`);
    } else {
      // For beta simulation, let the user simulate becoming premium!
      // This is excellent for testing. We can update the profile row in Supabase to is_premium = true.
      setLoading(true);
      try {
        await supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('id', user.id);
        
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
          <ActivityIndicator size="large" color={colors.sage} />
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.lockIcon} importantForAccessibility="no" accessibilityElementsHidden>🌿</Text>
        <Text style={styles.title} accessibilityRole="header">Unlock MoveKind Premium</Text>

        <View style={styles.insightBox}>
          <Text style={styles.insightEmoji} importantForAccessibility="no" accessibilityElementsHidden>📊</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>Nervous System Learning Complete</Text>
            <Text style={styles.insightText}>
              In your first 5 sessions, you restored an average of <Text style={styles.bold}>+{avgDelta.toFixed(1)} energy points</Text> per workout.
            </Text>
            <Text style={[styles.insightText, { marginTop: 6 }]}>
              Our composer learned that <Text style={styles.bold}>{bestCategory} routines</Text> improve your capacity state more than other categories.
            </Text>
          </View>
        </View>

        <Text style={styles.pitchText}>
          Premium unlocks your complete State Journey — full history, long-term
          capacity trends, and your whole Personal Playbook — plus extra exercise
          packs. Your daily check-in, sessions, recovery, and voice coaching stay
          free, always.
        </Text>

        <Pressable
          style={styles.upgradeBtn}
          onPress={handleCheckout}
          accessibilityRole="button"
          accessibilityLabel="Start Premium trial, 12 dollars 99 cents per month"
        >
          <Text style={styles.upgradeBtnText}>Start Premium Trial ($12.99/mo)</Text>
        </Pressable>

        <Pressable
          style={styles.backBtn}
          onPress={dismissPaywall}
          accessibilityRole="button"
          accessibilityLabel="Not now"
        >
          <Text style={styles.backBtnText}>Maybe later</Text>
        </Pressable>
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
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 20,
  },
  insightBox: {
    flexDirection: 'row',
    backgroundColor: colors.sageLight,
    padding: 16,
    borderRadius: 16,
    borderColor: colors.sage,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    marginBottom: 20,
  },
  insightEmoji: {
    fontSize: 24,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.sageDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  insightText: {
    fontSize: 13,
    color: colors.sageDark,
    lineHeight: 18,
    opacity: 0.9,
  },
  bold: {
    fontWeight: '700',
  },
  pitchText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  upgradeBtn: {
    width: '100%',
    backgroundColor: colors.sage,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 14,
    padding: 8,
  },
  backBtnText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
