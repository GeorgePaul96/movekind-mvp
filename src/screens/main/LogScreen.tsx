import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

export default function LogScreen() {
  const user = useAuthStore((s) => s.user);
  const add = useActivityStore((s) => s.add);
  const { message, show, hide } = useToast();

  const [type, setType] = useState<ActivityType>('walk');
  const [duration, setDuration] = useState(25);
  const [effort, setEffort] = useState(4);
  const [moods, setMoods] = useState<string[]>(['Energized']);
  const [saving, setSaving] = useState(false);

  const toggleMood = (m: string) =>
    setMoods((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await add(user.id, {
        type,
        duration_minutes: duration,
        effort,
        moods,
        notes: null,
        performed_at: new Date().toISOString(),
      });
      show('Activity saved. Well done!');
      await sendNow(`Nice — ${duration} minutes logged.`);
      // Reset to friendly defaults
      setDuration(25);
      setEffort(4);
      setMoods([]);
    } catch (e) {
      show(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Log activity</Text>
        <Text style={styles.subtitle}>Any movement counts</Text>
      </View>

      <Text style={styles.label}>What did you do?</Text>
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
                selected && {
                  backgroundColor: palette.bg,
                  borderColor: palette.fg,
                },
              ]}
            >
              <Text style={{ fontSize: 22 }}>{a.emoji}</Text>
              <Text
                style={[
                  styles.actLabel,
                  selected && { color: palette.text, fontWeight: '500' },
                ]}
              >
                {a.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 12 }}>
        <View style={styles.row}>
          <Text style={styles.label}>Duration (minutes)</Text>
          <Text style={styles.value}>{duration}</Text>
        </View>
        <Slider min={5} max={120} step={5} value={duration} onChange={setDuration} />
      </View>

      <View style={{ marginTop: 16 }}>
        <View style={styles.row}>
          <Text style={styles.label}>How hard was it? (1–10)</Text>
          <Text style={styles.value}>{effort}</Text>
        </View>
        <Slider min={1} max={10} step={1} value={effort} onChange={setEffort} />
      </View>

      <View style={{ marginTop: 16, marginBottom: 16 }}>
        <Text style={styles.label}>Mood after activity</Text>
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

      <Button label={saving ? 'Saving…' : '+  Save activity'} onPress={save} loading={saving} />
      <Text style={styles.footer}>Even 5 minutes matters. You showed up.</Text>

      <Toast message={message} onHide={hide} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  title: { fontSize: 22, color: colors.ink, fontWeight: '500' },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 4 },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  value: { fontSize: 18, color: colors.sage, fontWeight: '500' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  actBtn: {
    width: '31%',
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
    borderRadius: 14,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
  },
  actLabel: { fontSize: 11, color: colors.muted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.muted,
    marginTop: 12,
  },
});
