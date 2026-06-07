import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { RatingRow } from '@/components/RatingRow';
import { Button } from '@/components/Button';
import { Toast } from '@/components/Toast';
import { colors } from '@/constants/colors';
import { REFLECTION_PROMPTS } from '@/constants/copy';
import { useReflectionStore } from '@/store/reflectionStore';
import { useAuthStore } from '@/store/authStore';
import { weekStartIso } from '@/utils/date';
import { useToast } from '@/hooks/useToast';

type Key = 'energy' | 'recovery' | 'mood';

export default function ReflectScreen() {
  const user = useAuthStore((s) => s.user);
  const reflections = useReflectionStore((s) => s.reflections);
  const save = useReflectionStore((s) => s.save);
  const { message, show, hide } = useToast();
  const [saving, setSaving] = useState(false);

  const weekIso = weekStartIso();
  const existing = reflections.find((r) => r.week_start === weekIso);

  const [values, setValues] = useState<Record<Key, number>>({
    energy: 8,
    recovery: 6,
    mood: 7,
  });

  useEffect(() => {
    if (existing) {
      setValues({
        energy: existing.energy,
        recovery: existing.recovery,
        mood: existing.mood,
      });
    }
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await save(user.id, {
        week_start: weekIso,
        energy: values.energy,
        recovery: values.recovery,
        mood: values.mood,
        notes: null,
      });
      show('Reflection saved. Keep it up!');
    } catch (e) {
      show(e instanceof Error ? e.message : 'Could not save reflection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header
        tag="Weekly reflection"
        title="How was your week?"
        subtitle="Take a moment to check in with yourself"
      />

      {REFLECTION_PROMPTS.map((p) => (
        <Card key={p.key} style={{ marginBottom: 10 }}>
          <Text style={styles.q}>{p.label}</Text>
          <RatingRow
            value={values[p.key as Key]}
            onChange={(v) =>
              setValues((cur) => ({ ...cur, [p.key]: v }))
            }
          />
        </Card>
      ))}

      <Button label={saving ? 'Saving…' : 'Save reflection'} onPress={onSubmit} loading={saving} />
      <Text style={styles.footer}>
        Reflecting on your week builds awareness and progress.
      </Text>

      <Toast message={message} onHide={hide} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  q: { fontSize: 14, fontWeight: '500', color: colors.ink, marginBottom: 10 },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 12 },
});
