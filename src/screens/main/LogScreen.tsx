import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Slider } from '@/components/Slider';
import { Chip } from '@/components/Chip';
import { Toast } from '@/components/Toast';
import { ACTIVITIES, MOOD_OPTIONS, PALETTE } from '@/constants/activities';
import { colors } from '@/constants/colors';
import { useToast } from '@/hooks/useToast';
import { useActivityStore } from '@/store/activityStore';
import { useAuthStore } from '@/store/authStore';
import { sendNow } from '@/services/notifications';
import type { ActivityType } from '@/types';
import { detectPersonalBestEvents, type PersonalBestEvent } from '@/utils/personalBests';
import { PersonalBestCard } from '@/components/PersonalBestCard';

export default function LogScreen() {
  const user = useAuthStore((s) => s.user);
  const add = useActivityStore((s) => s.add);
  const { message, show, hide } = useToast();

  const [type, setType] = useState<ActivityType>('walk');
  const [duration, setDuration] = useState(25);
  const [effort, setEffort] = useState(4);
  const [moods, setMoods] = useState<string[]>(['Energized']);
  const [saving, setSaving] = useState(false);
  const [personalBestEvents, setPersonalBestEvents] = useState<PersonalBestEvent[]>([]);

  const toggleMood = (m: string) =>
    setMoods((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const existingActivities = useActivityStore.getState().activities;
    const payload = {
      type,
      duration_minutes: duration,
      effort,
      moods,
      notes: null,
      performed_at: new Date().toISOString(),
    };
    try {
      const created = await add(user.id, payload);
      const events = detectPersonalBestEvents(created, existingActivities);
      setPersonalBestEvents(events);
      if (events.length === 0) {
        show(`Logged. ${duration} min of ${type}.`);
      }
      await sendNow(`${duration} minutes logged.`);
      setDuration(25);
      setEffort(4);
      setMoods([]);
    } catch (e: any) {
      show(e?.message || 'Could not save — check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Log movement</Text>
        <Text style={styles.subtitle}>Any movement counts — even five minutes</Text>
      </View>

      <Text style={styles.sectionLabel}>What did you do?</Text>
      <View style={styles.picker}>
        {ACTIVITIES.map((a) => {
          const selected = type === a.type;
          const palette = PALETTE[a.palette];
          return (
            <Pressable
              key={a.type}
              onPress={() => setType(a.type)}
              style={[
                styles.actBtn,
                selected
                  ? { backgroundColor: palette.bg, borderColor: palette.fg, borderWidth: 1.5 }
                  : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <Text style={styles.actEmoji}>{a.emoji}</Text>
              <Text
                style={[
                  styles.actLabel,
                  { color: selected ? palette.text : colors.muted },
                  selected && { fontWeight: '600' },
                ]}
              >
                {a.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.sectionLabel}>Duration</Text>
          <View style={styles.valueWrap}>
            <Text style={styles.value}>{duration}</Text>
            <Text style={styles.unit}>min</Text>
          </View>
        </View>
        <Slider min={5} max={120} step={5} value={duration} onChange={setDuration} />
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.sectionLabel}>How hard was it?</Text>
          <View style={styles.valueWrap}>
            <Text style={styles.value}>{effort}</Text>
            <Text style={styles.unit}>/ 10</Text>
          </View>
        </View>
        <Slider min={1} max={10} step={1} value={effort} onChange={setEffort} />
        <Text style={styles.effortHint}>
          {effort <= 3
            ? 'Very gentle — good for recovery'
            : effort <= 6
              ? 'Moderate — a sustainable pace'
              : 'High effort — recover well after this'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Mood after</Text>
        <View style={styles.chipRow}>
          {MOOD_OPTIONS.map((m) => (
            <Chip
              key={m}
              label={m}
              active={moods.includes(m)}
              onPress={() => toggleMood(m)}
            />
          ))}
        </View>
      </View>

      <PersonalBestCard events={personalBestEvents} />
      <Button label={saving ? 'Saving…' : 'Save activity'} onPress={save} loading={saving} />

      <Toast message={message} onHide={hide} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 16,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },
  title: { fontSize: 24, color: colors.ink, fontWeight: '500' },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 18 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  section: { marginBottom: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  value: { fontSize: 20, color: colors.sageDark, fontWeight: '600' },
  unit: { fontSize: 12, color: colors.muted },
  effortHint: {
    fontSize: 12,
    color: colors.hint,
    marginTop: 8,
    lineHeight: 16,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  actBtn: {
    width: '31%',
    paddingVertical: 14,
    alignItems: 'center',
    gap: 5,
    borderRadius: 14,
  },
  actEmoji: { fontSize: 22 },
  actLabel: { fontSize: 11 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
