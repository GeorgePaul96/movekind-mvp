import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { colors, stateColors } from '@/constants/colors';
import { CHECKIN_COPY, MOOD_COPY, SLEEP_COPY } from '@/constants/copy';
import { mapEnergyToState } from '@/domain/checkin/moods';
import { useSessionStore } from '@/store/sessionStore';

/** Right after the tap: logging already counts; a session is offered, never forced. */
export function LoggedPanel() {
  const checkIn = useSessionStore((s) => s.currentCheckIn);
  const start = useSessionStore((s) => s.startTodaysSession);
  const dismiss = useSessionStore((s) => s.dismissForToday);
  const update = useSessionStore((s) => s.updateCheckIn);
  const loading = useSessionStore((s) => s.loading);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(checkIn?.intention ?? '');
  const [updateFailed, setUpdateFailed] = useState(false);

  if (!checkIn) return null;
  const mood = mapEnergyToState(checkIn.energy_score);
  const copy = MOOD_COPY[mood];
  const c = stateColors[mood];

  const save = async (patch: Parameters<typeof update>[0]) => {
    setUpdateFailed(false);
    try {
      await update(patch);
    } catch {
      setUpdateFailed(true);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text style={styles.logged}>{CHECKIN_COPY.logged}</Text>
        <Text style={styles.reassurance} accessibilityRole="header">{copy.reassurance}</Text>
      </View>

      <Card style={{ backgroundColor: c.soft, borderColor: c.ink, borderWidth: 1.5 }}>
        <Text style={[styles.sessionTitle, { color: c.ink }]}>{copy.sessionTitle}</Text>
        <Text style={[styles.sessionFeel, { color: c.ink }]}>{copy.sessionFeel}</Text>
      </Card>

      <Button
        label={CHECKIN_COPY.start}
        loading={loading}
        onPress={() => start().catch((e) => console.warn('Start session error:', e))}
      />
      <Button label={CHECKIN_COPY.notNow} variant="secondary" disabled={loading} onPress={dismiss} />

      <Card>
        <Text style={styles.small}>{CHECKIN_COPY.sleepPrompt}</Text>
        <View style={styles.chips}>
          {(['poor', 'fair', 'good'] as const).map((s) => (
            <Chip
              key={s}
              label={SLEEP_COPY[s]}
              accessibilityLabel={`Sleep: ${SLEEP_COPY[s].split(' ').slice(1).join(' ')}`}
              selected={checkIn.sleep_quality === s}
              onPress={() => save({ sleep_quality: s })}
            />
          ))}
        </View>
      </Card>

      {noteOpen ? (
        <Card>
          <TextInput
            value={note}
            onChangeText={setNote}
            accessibilityLabel="Note for today, optional"
            placeholder={CHECKIN_COPY.notePlaceholder}
            placeholderTextColor={colors.textMuted}
            maxLength={80}
            returnKeyType="done"
            style={styles.input}
          />
          <Button label={CHECKIN_COPY.saveNote} variant="secondary" size="sm" onPress={() => save({ intention: note })} />
        </Card>
      ) : (
        <Button label={CHECKIN_COPY.addNote} variant="link" onPress={() => setNoteOpen(true)} />
      )}

      {updateFailed && (
        <Text style={styles.error} accessibilityLiveRegion="polite">{CHECKIN_COPY.updateFailed}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logged: { fontSize: 14, fontWeight: '700', color: colors.success },
  reassurance: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, lineHeight: 30, marginTop: 2 },
  sessionTitle: { fontSize: 17, fontWeight: '800' },
  sessionFeel: { fontSize: 15, marginTop: 4, lineHeight: 21 },
  small: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  chips: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  error: { fontSize: 14, color: colors.error },
});
