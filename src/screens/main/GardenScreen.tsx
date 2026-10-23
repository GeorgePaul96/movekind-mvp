import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Garden } from '@/components/garden/Garden';
import { QuickActions } from '@/components/garden/QuickActions';
import { WorkoutSheet } from '@/components/garden/WorkoutSheet';
import { MoodPicker } from '@/components/home/MoodPicker';
import { colors, elevation } from '@/constants/colors';
import { GARDEN_COPY, MOOD_COPY, WORKOUT_COPY } from '@/constants/copy';
import { gardenState } from '@/domain/garden/garden';
import { weeklyChanges } from '@/domain/garden/changes';
import { isSameLocalDay } from '@/domain/garden/days';
import { useGardenStore } from '@/store/gardenStore';
import { useProfileStore } from '@/store/profileStore';
import type { Workout } from '@/types';

function partOfDay(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

const isToday = (iso: string) => isSameLocalDay(new Date(iso), new Date());

/** Home: the garden first, one note, today's mood, then the three big log buttons. */
export default function GardenScreen() {
  const name = useProfileStore((s) => s.profile?.name ?? null);
  const checkIns = useGardenStore((s) => s.checkIns);
  const water = useGardenStore((s) => s.water);
  const workouts = useGardenStore((s) => s.workouts);
  const stepsToday = useGardenStore((s) => s.stepsToday);
  const loaded = useGardenStore((s) => s.loaded);
  const load = useGardenStore((s) => s.load);
  const todayMood = useGardenStore((s) => s.todayMood)();
  const addGlass = useGardenStore((s) => s.addGlass);
  const removeLastGlassToday = useGardenStore((s) => s.removeLastGlassToday);
  const addWorkout = useGardenStore((s) => s.addWorkout);
  const updateWorkout = useGardenStore((s) => s.updateWorkout);
  const removeWorkout = useGardenStore((s) => s.removeWorkout);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Workout | null>(null);
  const [pickingMood, setPickingMood] = useState(false);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const now = new Date();
  const garden = gardenState({ checkIns, water, workouts, stepsToday }, now);
  const note = weeklyChanges({ checkIns, water, workouts, stepsToday }, now)[0]?.text ?? GARDEN_COPY.defaultNote;
  const glassesToday = water.filter((w) => isToday(w.created_at)).length;
  const todaysWorkouts = workouts.filter((w) => isToday(w.created_at));
  const quiet = (p: Promise<unknown>) => p.catch(() => {}); // the store keeps a calm error message

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(null);
  };

  return (
    <Screen>
      <Header tag={GARDEN_COPY.greeting(partOfDay(now), name)} title={GARDEN_COPY.title} />

      <View style={styles.gardenCard}>
        <Garden state={garden} />
      </View>
      <Text style={styles.note}>🌿 {note}</Text>

      {!todayMood || pickingMood ? (
        <View style={styles.section}>
          <MoodPicker name={name} onPicked={() => setPickingMood(false)} />
        </View>
      ) : (
        <View style={styles.moodRow}>
          <Text style={styles.moodText}>{GARDEN_COPY.todayMood(MOOD_COPY[todayMood].label)}</Text>
          <Button label={GARDEN_COPY.changeMood} variant="link" size="sm" onPress={() => setPickingMood(true)} />
        </View>
      )}

      <QuickActions
        glassesToday={glassesToday}
        stepsToday={stepsToday}
        onWater={() => quiet(addGlass())}
        onUndoWater={() => quiet(removeLastGlassToday())}
        onWorkout={() => setSheetOpen(true)}
      />

      {todaysWorkouts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{GARDEN_COPY.todayWorkouts}</Text>
          {todaysWorkouts.map((w) => (
            <View key={w.id} style={styles.workoutRow}>
              <Text style={styles.workoutText}>{WORKOUT_COPY.entry(w.type, w.minutes)}</Text>
              <Button
                label={WORKOUT_COPY.edit}
                variant="link"
                size="sm"
                accessibilityLabel={WORKOUT_COPY.editA11y(w.type, w.minutes)}
                onPress={() => {
                  setEditing(w);
                  setSheetOpen(true);
                }}
              />
              <Button
                label={WORKOUT_COPY.delete}
                variant="link"
                size="sm"
                accessibilityLabel={WORKOUT_COPY.deleteA11y(w.type, w.minutes)}
                onPress={() => quiet(removeWorkout(w.id))}
              />
            </View>
          ))}
        </View>
      )}

      <WorkoutSheet
        visible={sheetOpen}
        initial={editing}
        onClose={closeSheet}
        onSave={(type, minutes) => {
          quiet(editing ? updateWorkout(editing.id, { type, minutes }) : addWorkout(type, minutes));
          closeSheet();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gardenCard: { borderRadius: 20, overflow: 'hidden', ...elevation.card, backgroundColor: colors.surface },
  note: {
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    lineHeight: 21,
    marginVertical: 12,
  },
  section: { marginVertical: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  moodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  moodText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  workoutRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.divider },
  workoutText: { flex: 1, fontSize: 16, color: colors.textPrimary },
});
