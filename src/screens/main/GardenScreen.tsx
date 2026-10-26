import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Icon, type IconName } from '@/components/Icon';
import { Garden } from '@/components/garden/Garden';
import { QuickActions } from '@/components/garden/QuickActions';
import { WorkoutSheet } from '@/components/garden/WorkoutSheet';
import { StepsWeekSheet } from '@/components/garden/StepsWeekSheet';
import { MoodPicker } from '@/components/home/MoodPicker';
import { colors, elevation } from '@/constants/colors';
import { GARDEN_COPY, MOOD_COPY, UNWELL_COPY, WORKOUT_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { gardenState } from '@/domain/garden/garden';
import { gardenBadges } from '@/domain/garden/badges';
import { weeklyChanges } from '@/domain/garden/changes';
import { isSameLocalDay } from '@/domain/garden/days';
import { skyPhase } from '@/domain/garden/sky';
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

/** A small white pill floating on the garden card ("Canopy thriving"). */
function Badge({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.badge}>
      <Icon name={icon} size={14} color={colors.primary} />
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

/** Home: the garden first, one note, today's mood, then the three big log cards. */
export default function GardenScreen() {
  const name = useProfileStore((s) => s.profile?.name ?? null);
  const checkIns = useGardenStore((s) => s.checkIns);
  const water = useGardenStore((s) => s.water);
  const workouts = useGardenStore((s) => s.workouts);
  const stepsToday = useGardenStore((s) => s.stepsToday);
  const stepsByDay = useGardenStore((s) => s.stepsByDay);
  const stepsStatus = useGardenStore((s) => s.stepsStatus);
  const refreshSteps = useGardenStore((s) => s.refreshSteps);
  const allowSteps = useGardenStore((s) => s.allowSteps);
  const loaded = useGardenStore((s) => s.loaded);
  const load = useGardenStore((s) => s.load);
  const todayMood = useGardenStore((s) => s.todayMood)();
  const todayUnwell = useGardenStore((s) => s.todayUnwell)();
  const setUnwell = useGardenStore((s) => s.setUnwell);
  const addGlass = useGardenStore((s) => s.addGlass);
  const removeLastGlassToday = useGardenStore((s) => s.removeLastGlassToday);
  const addWorkout = useGardenStore((s) => s.addWorkout);
  const updateWorkout = useGardenStore((s) => s.updateWorkout);
  const removeWorkout = useGardenStore((s) => s.removeWorkout);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Workout | null>(null);
  const [pickingMood, setPickingMood] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  useEffect(() => {
    refreshSteps().catch(() => {}); // reads only if access was already given; never asks
  }, [refreshSteps]);

  const now = new Date();
  const garden = gardenState({ checkIns, water, workouts, stepsToday }, now);
  const badges = gardenBadges(garden);
  const firstLine = weeklyChanges(
    { checkIns, water, workouts, stepsToday, stepsByDay: stepsStatus === 'granted' ? stepsByDay : undefined },
    now,
  )[0];
  const firstWeek = firstLine?.kind === 'welcome';
  const glassesToday = water.filter((w) => isToday(w.created_at)).length;
  const todaysWorkouts = workouts.filter((w) => isToday(w.created_at));
  const minutesToday = todaysWorkouts.reduce((sum, w) => sum + w.minutes, 0);
  const allMinutes = workouts.reduce((sum, w) => sum + w.minutes, 0);
  const quiet = (p: Promise<unknown>) => p.catch(() => {}); // the store keeps a calm error message

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(null);
  };

  return (
    <Screen>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Icon name="sprout" size={20} color={colors.primary} />
        </View>
        <Text style={styles.brand}>{GARDEN_COPY.brand}</Text>
      </View>

      <Header
        tag={firstWeek ? GARDEN_COPY.tagFirstWeek : GARDEN_COPY.tag}
        title={GARDEN_COPY.greeting(partOfDay(now), name)}
        subtitle={
          garden.weather === 'rain' ? UNWELL_COPY.subtitle : garden.resting ? GARDEN_COPY.subtitleResting : GARDEN_COPY.subtitle
        }
      />

      <View style={styles.gardenCard}>
        <Garden state={garden} phase={skyPhase(now)} />
        <View style={styles.badgesTop} pointerEvents="none">
          <Badge
            icon={garden.weather === 'rain' ? 'weather-rainy' : garden.resting ? 'weather-night' : 'weather-windy'}
            label={badges.sky}
          />
          <Badge icon="leaf" label={badges.tree} />
        </View>
      </View>

      {garden.weather === 'rain' ? (
        <Card tone="soft" style={styles.noteGap}>
          <View style={styles.welcomeHead}>
            <View style={styles.welcomeIcon}>
              <Icon name="weather-rainy" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeTitle}>{UNWELL_COPY.cardTitle}</Text>
              <Text style={styles.welcomeBody}>{UNWELL_COPY.cardBody}</Text>
            </View>
          </View>
        </Card>
      ) : firstWeek ? (
        <Card style={styles.noteGap}>
          <View style={styles.welcomeHead}>
            <View style={styles.welcomeIcon}>
              <Icon name="white-balance-sunny" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeTitle}>{GARDEN_COPY.welcomeTitle}</Text>
              <Text style={styles.welcomeBody}>{firstLine!.text}</Text>
            </View>
          </View>
          <View style={styles.welcomeNote}>
            <Icon name="heart-outline" size={18} color={colors.primary} />
            <Text style={styles.welcomeNoteText}>{GARDEN_COPY.welcomeNoStreaks}</Text>
          </View>
        </Card>
      ) : (
        <View style={[styles.note, styles.noteGap]}>
          <View style={styles.noteIcon}>
            <Icon name="creation" size={20} color={colors.onInverse} />
          </View>
          <Text style={styles.noteText}>{firstLine?.text ?? GARDEN_COPY.defaultNote}</Text>
        </View>
      )}

      {!todayMood || pickingMood ? (
        <View style={styles.section}>
          <MoodPicker onPicked={() => setPickingMood(false)} />
        </View>
      ) : (
        <View>
          <View style={styles.moodRow}>
            <Text style={styles.moodText}>{GARDEN_COPY.todayMood(MOOD_COPY[todayMood].label)}</Text>
            <Button label={GARDEN_COPY.changeMood} variant="link" size="sm" onPress={() => setPickingMood(true)} />
          </View>
          <View style={styles.unwellRow}>
            <Chip label={UNWELL_COPY.toggle} selected={todayUnwell} // Read the live value: two quick taps must not both send the same answer.
              onPress={() => quiet(setUnwell(!useGardenStore.getState().todayUnwell()))} />
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle} accessibilityRole="header">{GARDEN_COPY.careTitle}</Text>
      <QuickActions
        glassesToday={glassesToday}
        workoutMinutesToday={minutesToday}
        stepsToday={stepsToday}
        stepsStatus={stepsStatus}
        onSteps={() => {
          if (stepsStatus === 'granted') setStepsOpen(true);
          else if (stepsStatus === 'ask') quiet(allowSteps());
        }}
        onWater={() => quiet(addGlass())}
        onUndoWater={() => quiet(removeLastGlassToday())}
        onWorkout={() => setSheetOpen(true)}
      />

      {todaysWorkouts.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.listTitle}>{GARDEN_COPY.todayWorkouts}</Text>
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
        </Card>
      )}

      <StepsWeekSheet visible={stepsOpen} stepsByDay={stepsByDay} onClose={() => setStepsOpen(false)} />

      <WorkoutSheet
        visible={sheetOpen}
        initial={editing}
        minutesSoFar={editing ? allMinutes - editing.minutes : allMinutes}
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { ...font.bold, fontSize: 20, color: colors.textPrimary },
  gardenCard: { borderRadius: 28, overflow: 'hidden', backgroundColor: colors.surface, ...elevation.card },
  badgesTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 1,
  },
  badgeText: { ...font.semibold, fontSize: 13, color: colors.textPrimary, flexShrink: 1 },
  noteGap: { marginTop: 16, marginBottom: 8 },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.inverse,
    borderRadius: 24,
    padding: 16,
  },
  noteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.onInverseSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: { ...font.medium, flex: 1, fontSize: 15, lineHeight: 22, color: colors.onInverse },
  welcomeHead: { flexDirection: 'row', gap: 14 },
  welcomeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: { ...font.bold, fontSize: 18, color: colors.textPrimary },
  welcomeBody: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginTop: 4 },
  welcomeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
  },
  welcomeNoteText: { ...font.regular, flex: 1, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  section: { marginVertical: 12 },
  sectionTitle: { ...font.bold, fontSize: 20, color: colors.textPrimary, marginTop: 12, marginBottom: 12 },
  moodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  moodText: { ...font.bold, fontSize: 16, color: colors.textPrimary },
  unwellRow: { flexDirection: 'row', marginBottom: 8 },
  listTitle: { ...font.semibold, fontSize: 15, color: colors.textSecondary, marginBottom: 4 },
  workoutRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.divider },
  workoutText: { ...font.medium, flex: 1, fontSize: 16, color: colors.textPrimary },
});
