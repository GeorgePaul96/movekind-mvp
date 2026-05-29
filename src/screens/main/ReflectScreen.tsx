import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { RatingRow } from '@/components/RatingRow';
import { Button } from '@/components/Button';
import { Toast } from '@/components/Toast';
import { colors } from '@/constants/colors';
import { REFLECTION_PROMPTS, WELLNESS_PROMPTS } from '@/constants/copy';
import { useReflectionStore } from '@/store/reflectionStore';
import { useAuthStore } from '@/store/authStore';
import { weekStartIso } from '@/utils/date';
import { useToast } from '@/hooks/useToast';
import { parseWellness, serializeWellness, type WellnessSnapshot } from '@/types';
import { IntentionPrompt, type IntentionDraft } from '@/components/IntentionPrompt';
import { IntentionCheckin } from '@/components/IntentionCheckin';
import { useIntentionStore } from '@/store/intentionStore';

type CoreKey = 'energy' | 'recovery' | 'consistency' | 'mood';
type WellnessKey = keyof WellnessSnapshot;

const DEFAULT_CORE: Record<CoreKey, number> = {
  energy: 7,
  recovery: 6,
  consistency: 7,
  mood: 7,
};

const DEFAULT_WELLNESS: WellnessSnapshot = {
  stress: 5,
  sleep: 7,
  soreness: 4,
  motivation: 7,
  confidence: 7,
  freeText: '',
};

// Maps wellness keys to calm, instructive scale descriptions
const WELLNESS_SCALE: Record<WellnessKey, { low: string; high: string }> = {
  stress:     { low: '1 = very calm', high: '10 = highly stressed' },
  sleep:      { low: '1 = rough nights', high: '10 = deep & restorative' },
  soreness:   { low: '1 = feeling fresh', high: '10 = quite sore' },
  motivation: { low: '1 = very low', high: '10 = feeling eager' },
  confidence: { low: '1 = doubtful', high: '10 = strong & capable' },
  freeText:   { low: '', high: '' },
};

export default function ReflectScreen() {
  const user = useAuthStore((s) => s.user);
  const reflections = useReflectionStore((s) => s.reflections);
  const save = useReflectionStore((s) => s.save);
  const { message, show, hide } = useToast();
  const [saving, setSaving] = useState(false);

  const intentionLoad = useIntentionStore((s) => s.load);
  const intentionSave = useIntentionStore((s) => s.save);
  const currentIntention = useIntentionStore((s) => s.currentIntention);
  const previousIntention = useIntentionStore((s) => s.previousIntention);
  const markPreviousMet = useIntentionStore((s) => s.markPreviousMet);

  const [intentionDraft, setIntentionDraft] = useState<IntentionDraft>({
    description: '',
    intendedDay: null,
    intendedTime: null,
  });

  const weekIso = weekStartIso();
  const existing = reflections.find((r) => r.week_start === weekIso);

  const [core, setCore] = useState<Record<CoreKey, number>>(DEFAULT_CORE);
  const [wellness, setWellness] = useState<WellnessSnapshot>(DEFAULT_WELLNESS);

  useEffect(() => {
    if (existing) {
      setCore({
        energy: existing.energy,
        recovery: existing.recovery,
        consistency: existing.consistency,
        mood: existing.mood,
      });
      const parsed = parseWellness(existing.notes);
      if (parsed) setWellness({ ...DEFAULT_WELLNESS, ...parsed });
    }
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    intentionLoad(user.id);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentIntention) {
      setIntentionDraft({
        description: currentIntention.description,
        intendedDay: currentIntention.intended_day,
        intendedTime: currentIntention.intended_time,
      });
    }
  }, [currentIntention?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setWellnessValue = (key: WellnessKey, value: number | string) => {
    setWellness((prev) => ({ ...prev, [key]: value }));
    if (typeof value === 'number') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const onSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await save(user.id, {
        week_start: weekIso,
        energy: core.energy,
        recovery: core.recovery,
        consistency: core.consistency,
        mood: core.mood,
        notes: serializeWellness(wellness, existing?.notes),
      });
      if (intentionDraft.description.trim()) {
        await intentionSave(user.id, {
          week_start: weekIso,
          description: intentionDraft.description.trim(),
          intended_day: intentionDraft.intendedDay,
          intended_time: intentionDraft.intendedTime,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      show('Reflection saved. Thank you for checking in.');
    } catch (e) {
      show(e instanceof Error ? e.message : 'Could not save reflection');
    } finally {
      setSaving(false);
    }
  };

  // Compassionate prompt based on what user entered
  const compassionateNote = (() => {
    if (wellness.stress >= 8) return 'High stress is a signal to soften your approach. Gentle movement can be medicine.';
    if (wellness.soreness >= 8) return 'Your body is asking for recovery. Honor that — rest is active progress.';
    if (wellness.sleep <= 3) return 'Poor sleep affects everything. Be extra gentle with yourself this week.';
    if (wellness.motivation <= 3 && core.energy <= 4) return 'Low energy and motivation are okay. Even a five-minute stretch is a genuine win.';
    if (wellness.confidence >= 8 && core.energy >= 7) return 'You seem to be in a strong place. This is a good week to try something slightly new.';
    return null;
  })();

  return (
    <Screen>
      <Header
        tag="Weekly reflection"
        title="How was your week?"
        subtitle="Check in honestly. No performance required."
      />

      {/* Previous week intention check-in — only shows when unanswered */}
      {previousIntention && previousIntention.met === null && (
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <IntentionCheckin
            intention={previousIntention}
            onRespond={markPreviousMet}
          />
        </Animated.View>
      )}

      {/* Core reflection */}
      <Text style={styles.sectionTitle}>Movement & Energy</Text>
      {REFLECTION_PROMPTS.map((p, i) => (
        <Animated.View key={p.key} entering={FadeInDown.delay(i * 60).springify()}>
          <Card style={styles.card}>
            <Text style={styles.q}>{p.label}</Text>
            <RatingRow
              value={core[p.key as CoreKey]}
              onChange={(v) => setCore((cur) => ({ ...cur, [p.key]: v }))}
            />
          </Card>
        </Animated.View>
      ))}

      <Animated.View entering={FadeInDown.delay(280).springify()}>
        <IntentionPrompt
          value={intentionDraft}
          onChange={setIntentionDraft}
          existingDescription={currentIntention?.description}
        />
      </Animated.View>

      {/* Deep wellness */}
      <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Body & Mind Check-in</Text>
      <Text style={styles.sectionSub}>
        These questions help your AI coach understand your full picture. There are no wrong answers.
      </Text>

      {WELLNESS_PROMPTS.map((p, i) => (
        <Animated.View key={p.key} entering={FadeInDown.delay(240 + i * 60).springify()}>
          <Card style={styles.card}>
            <View style={styles.wellnessHeader}>
              <Text style={styles.q}>{p.label}</Text>
              <Text style={styles.scaleHint}>
                {WELLNESS_SCALE[p.key as WellnessKey].low}
              </Text>
            </View>
            <RatingRow
              value={wellness[p.key as Exclude<WellnessKey, 'freeText'>] as number}
              onChange={(v) => setWellnessValue(p.key as WellnessKey, v)}
            />
            <Text style={styles.scaleRight}>
              {WELLNESS_SCALE[p.key as WellnessKey].high}
            </Text>
          </Card>
        </Animated.View>
      ))}

      {/* Optional free text */}
      <Animated.View entering={FadeInDown.delay(540).springify()}>
        <Card style={styles.card}>
          <Text style={styles.q}>Anything else on your mind? (optional)</Text>
          <TextInput
            value={wellness.freeText ?? ''}
            onChangeText={(t) => setWellnessValue('freeText', t)}
            placeholder="A few words about how you feel this week…"
            placeholderTextColor={colors.hint}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </Card>
      </Animated.View>

      {/* Compassionate coach note */}
      {compassionateNote ? (
        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.coachNote}>
          <Text style={styles.coachEmoji}>🌿</Text>
          <Text style={styles.coachText}>{compassionateNote}</Text>
        </Animated.View>
      ) : null}

      <Button label={saving ? 'Saving…' : 'Save reflection'} onPress={onSubmit} loading={saving} />

      <Toast message={message} onHide={hide} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 4,
    marginTop: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  card: { marginBottom: 10 },
  q: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    marginBottom: 12,
    lineHeight: 20,
  },
  wellnessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scaleHint: {
    fontSize: 10,
    color: colors.hint,
    textAlign: 'right',
    maxWidth: '40%',
    lineHeight: 14,
    marginTop: 2,
  },
  scaleRight: {
    fontSize: 10,
    color: colors.hint,
    textAlign: 'right',
    marginTop: 6,
  },
  textArea: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  coachNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.sageLight,
    borderColor: colors.sageMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  coachEmoji: { fontSize: 18, marginTop: 1 },
  coachText: {
    flex: 1,
    fontSize: 13,
    color: colors.sageDark,
    lineHeight: 19,
    fontStyle: 'italic',
  },
});
