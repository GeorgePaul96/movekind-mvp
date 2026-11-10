import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { BreathPacer, CareDots, Section, styles as parts } from '@/components/home/parts';
import { colors } from '@/constants/colors';
import { BODY_COPY, HOME_COPY, STEPS_COPY, WATER_COPY, WORKOUT_COPY, YARD_COPY } from '@/constants/copy';
import { SOURCES } from '@/constants/sources';
import { font } from '@/constants/typography';
import { YARD_MOODS } from '@/domain/checkin/moods';
import { isSameLocalDay } from '@/domain/garden/days';
import { careToday, partOfDay } from '@/domain/home/care';
import { MEALS, tidySleepHours, useGardenStore } from '@/store/gardenStore';
import { useProfileStore } from '@/store/profileStore';
import type { Meal, SleepFeel, WorkoutType, YardMood } from '@/types';

const WORKOUT_TYPES: WorkoutType[][] = [
  ['walk', 'run', 'yoga', 'gym'],
  ['cycle', 'sport', 'dance', 'other'],
];
const MOOD_ROWS: YardMood[][] = [YARD_MOODS.slice(0, 3) as YardMood[], YARD_MOODS.slice(3) as YardMood[]];
const FEELS: SleepFeel[] = ['restless', 'okay', 'deep'];
const DEFAULT_SLEEP_HOURS = 7;

/**
 * Today on the simple home: a greeting, the care dots, then every way to note the day,
 * each done right here with a tap or two. No sheets, no targets, nothing to finish.
 */
export default function TodayView() {
  const name = useProfileStore((s) => s.profile?.name ?? null);
  const store = useGardenStore();
  const { checkIns, water, workouts, meals, sleep, goodThings, stepsToday, stepsStatus } = store;
  const now = new Date();

  const mood = store.todayYardMood();
  const unwell = store.todayUnwell();
  const eaten = store.mealsToday();
  const lastSleep = store.lastNightSleep();
  const today = (iso: string) => isSameLocalDay(new Date(iso), now);
  const glasses = water.filter((w) => today(w.created_at)).length;
  const todaysWorkouts = workouts.filter((w) => today(w.created_at));

  const part = partOfDay(now);
  const kindLine = unwell ? HOME_COPY.unwellLine : mood ? HOME_COPY.moodLine[mood] : HOME_COPY.welcome[part];

  // ---- Movement -----------------------------------------------------------
  const [type, setType] = useState<WorkoutType | null>(null);
  const [minutes, setMinutes] = useState<number>(WORKOUT_COPY.durations[2]);
  const addMovement = () => {
    if (!type) return;
    store.addWorkout(type, minutes).then(() => setType(null), () => {});
  };

  // ---- Sleep --------------------------------------------------------------
  const [hours, setHours] = useState(lastSleep?.hours ?? DEFAULT_SLEEP_HOURS);
  const [feel, setFeel] = useState<SleepFeel | null>(lastSleep?.feel ?? null);
  useEffect(() => {
    if (lastSleep) {
      setHours(lastSleep.hours);
      setFeel(lastSleep.feel);
    }
  }, [lastSleep]);

  // ---- One good thing -----------------------------------------------------
  const todaysGood = store.todayGoodThing();
  const [good, setGood] = useState(todaysGood?.text ?? '');
  const [goodSaved, setGoodSaved] = useState(false);
  useEffect(() => {
    setGood(todaysGood?.text ?? '');
  }, [todaysGood?.text]);
  const earlier = goodThings.filter((g) => g.id !== todaysGood?.id).slice(0, 5);

  const toggleMeal = (meal: Meal) => {
    const next = eaten.includes(meal) ? eaten.filter((m) => m !== meal) : [...eaten, meal];
    store.setMealsToday(next).catch(() => {});
  };

  const steps =
    stepsStatus === 'granted'
      ? STEPS_COPY.count(stepsToday ?? 0)
      : stepsStatus === 'denied'
        ? STEPS_COPY.off
        : stepsStatus === 'unavailable' || stepsStatus === 'needs-full-app'
          ? STEPS_COPY.unavailable
          : undefined;

  return (
    <View>
      <View style={styles.hello}>
        <Text style={styles.greeting} accessibilityRole="header">
          {HOME_COPY.greeting(part, name)}
        </Text>
        <Text style={styles.kind}>{kindLine}</Text>
        <CareDots done={careToday({ checkIns, water, meals, workouts, sleep }, now)} />
      </View>

      {store.error ? <Text style={styles.error}>{store.error}</Text> : null}

      <Section icon="emoticon-happy-outline" title={HOME_COPY.moodTitle}>
        {MOOD_ROWS.map((row, k) => (
          <View key={k} style={parts.chips}>
            {row.map((m) => (
              <Chip
                key={m}
                label={YARD_COPY.moods[m].label}
                selected={mood === m}
                onPress={() => void store.logYardMood(m).catch(() => {})}
              />
            ))}
          </View>
        ))}
        {mood ? (
          <View style={parts.chips}>
            <Chip label={HOME_COPY.unwell} selected={unwell} onPress={() => void store.setUnwell(!unwell).catch(() => {})} />
          </View>
        ) : null}
      </Section>

      <Section icon="water-outline" title={HOME_COPY.waterTitle} value={WATER_COPY.count(glasses)}>
        <View style={parts.row}>
          <View style={parts.grow}>
            <Button label={HOME_COPY.waterAdd} onPress={() => void store.addGlass().catch(() => {})} />
          </View>
          {glasses > 0 ? (
            <Button
              label={HOME_COPY.waterUndo}
              variant="link"
              accessibilityLabel={HOME_COPY.waterUndoA11y}
              onPress={() => void store.removeLastGlassToday().catch(() => {})}
            />
          ) : null}
        </View>
        <Text style={parts.small}>{WATER_COPY.note}</Text>
      </Section>

      <Section icon="food-apple-outline" title={HOME_COPY.foodTitle}>
        <View style={parts.chips}>
          {MEALS.slice(0, 2).map((m) => (
            <Chip key={m} label={YARD_COPY.foodSheet.meals[m]} selected={eaten.includes(m)} onPress={() => toggleMeal(m)} />
          ))}
        </View>
        <View style={parts.chips}>
          {MEALS.slice(2).map((m) => (
            <Chip key={m} label={YARD_COPY.foodSheet.meals[m]} selected={eaten.includes(m)} onPress={() => toggleMeal(m)} />
          ))}
        </View>
        <Text style={parts.small}>{HOME_COPY.foodBody}</Text>
      </Section>

      <Section icon="run" title={HOME_COPY.movementTitle}>
        <Text style={parts.body}>{HOME_COPY.movementBody}</Text>
        {todaysWorkouts.map((w) => (
          <View key={w.id} style={parts.row}>
            <Text style={[parts.strong, parts.grow]}>{WORKOUT_COPY.entry(w.type, w.minutes)}</Text>
            <Button
              label={WORKOUT_COPY.delete}
              variant="link"
              size="sm"
              accessibilityLabel={WORKOUT_COPY.deleteA11y(w.type, w.minutes)}
              onPress={() => void store.removeWorkout(w.id).catch(() => {})}
            />
          </View>
        ))}
        {WORKOUT_TYPES.map((row, k) => (
          <View key={k} style={parts.chips}>
            {row.map((t) => (
              <Chip key={t} label={WORKOUT_COPY.types[t]} selected={type === t} onPress={() => setType(type === t ? null : t)} />
            ))}
          </View>
        ))}
        {type ? (
          <>
            <Text style={parts.strong}>{HOME_COPY.movementMinutes}</Text>
            <View style={parts.chips}>
              {WORKOUT_COPY.durations.map((d) => (
                <Chip
                  key={d}
                  label={WORKOUT_COPY.durationChip(d)}
                  accessibilityLabel={WORKOUT_COPY.durationA11y(d)}
                  selected={minutes === d}
                  onPress={() => setMinutes(d)}
                />
              ))}
            </View>
            <Button label={HOME_COPY.movementAdd} onPress={addMovement} />
          </>
        ) : null}
      </Section>

      <Section
        icon="power-sleep"
        title={HOME_COPY.sleepTitle}
        value={lastSleep ? HOME_COPY.sleepHours(lastSleep.hours) : undefined}
      >
        <Text style={parts.body}>{HOME_COPY.sleepBody}</Text>
        <View style={[parts.row, { marginBottom: 10 }]}>
          <View style={styles.stepBtn}>
            <Button
              label={HOME_COPY.sleepLess}
              variant="secondary"
              size="sm"
              accessibilityLabel={HOME_COPY.sleepLessA11y}
              onPress={() => setHours((h) => tidySleepHours(h - 0.5))}
            />
          </View>
          <Text style={styles.hours}>{HOME_COPY.sleepHours(hours)}</Text>
          <View style={styles.stepBtn}>
            <Button
              label={HOME_COPY.sleepMore}
              variant="secondary"
              size="sm"
              accessibilityLabel={HOME_COPY.sleepMoreA11y}
              onPress={() => setHours((h) => tidySleepHours(h + 0.5))}
            />
          </View>
        </View>
        <View style={parts.chips}>
          {FEELS.map((f) => (
            <Chip
              key={f}
              label={YARD_COPY.sleepSheet.feels[f]}
              selected={feel === f}
              onPress={() => setFeel(feel === f ? null : f)}
            />
          ))}
        </View>
        <Button label={HOME_COPY.sleepSave} onPress={() => void store.logSleep(hours, feel).catch(() => {})} />
      </Section>

      <Section icon="shoe-print" title={HOME_COPY.stepsTitle} value={steps}>
        {stepsStatus === 'granted' ? (
          <Text style={parts.small}>{STEPS_COPY.weekNote}</Text>
        ) : stepsStatus === 'denied' ? (
          <Text style={parts.body}>{STEPS_COPY.offHint}</Text>
        ) : stepsStatus === 'unavailable' || stepsStatus === 'needs-full-app' ? (
          <Text style={parts.body}>{STEPS_COPY.unavailableHint}</Text>
        ) : (
          <>
            <Text style={parts.body}>{STEPS_COPY.allowHint}</Text>
            <Button label={STEPS_COPY.allowButton} variant="secondary" onPress={() => void store.allowSteps().catch(() => {})} />
          </>
        )}
      </Section>

      <Section icon="heart-outline" title={HOME_COPY.goodTitle}>
        <Text style={parts.body}>{HOME_COPY.goodBody}</Text>
        <TextInput
          value={good}
          onChangeText={(t) => {
            setGood(t);
            setGoodSaved(false);
          }}
          accessibilityLabel={HOME_COPY.goodLabel}
          placeholder={HOME_COPY.goodPlaceholder}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={280}
          style={styles.note}
        />
        {goodSaved ? <Text style={parts.strong}>{HOME_COPY.saved}</Text> : null}
        <Button
          label={HOME_COPY.goodSave}
          variant="secondary"
          onPress={() => void store.saveGoodThing(good).then(() => setGoodSaved(true), () => {})}
        />
        {earlier.length ? (
          <View style={styles.earlier}>
            <Text style={parts.strong}>{HOME_COPY.goodEarlier}</Text>
            {earlier.map((g) => (
              <Text key={g.id} style={styles.earlierLine}>
                {HOME_COPY.goodDay(new Date(`${g.day}T12:00:00`))}: {g.text}
              </Text>
            ))}
          </View>
        ) : null}
        <Text style={parts.small}>{BODY_COPY.source(SOURCES.goodThings.label)}</Text>
      </Section>

      <Section icon="weather-windy" title={HOME_COPY.breathTitle}>
        <Text style={parts.body}>{HOME_COPY.breathBody}</Text>
        <BreathPacer />
        <Text style={parts.small}>{HOME_COPY.breathCare}</Text>
        <Text style={parts.small}>{BODY_COPY.source(SOURCES.breathing.label)}</Text>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  hello: { backgroundColor: colors.warm, borderRadius: 32, padding: 22, marginBottom: 16 },
  greeting: { ...font.extrabold, fontSize: 30, lineHeight: 36, color: colors.textPrimary },
  kind: { ...font.medium, fontSize: 17, lineHeight: 25, color: colors.textSecondary, marginTop: 6 },
  error: { ...font.medium, fontSize: 14, color: colors.error, marginBottom: 10 },
  stepBtn: { width: 92 },
  hours: { ...font.bold, flex: 1, fontSize: 20, color: colors.textPrimary, textAlign: 'center' },
  note: {
    ...font.medium,
    minHeight: 76,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 18,
    padding: 14,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  earlier: { marginTop: 14 },
  earlierLine: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginBottom: 4 },
});
