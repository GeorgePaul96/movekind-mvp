import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { FLOW_STEPS } from '@/components/flow/CheckInFlow';
import { BreathPacer, CareDots, Section, styles as parts } from '@/components/home/parts';
import { colors, elevation, flowThemes, type FlowThemeName } from '@/constants/colors';
import { BODY_COPY, HOME_COPY, STEPS_COPY, WATER_COPY, YARD_COPY } from '@/constants/copy';
import { SOURCES } from '@/constants/sources';
import { font } from '@/constants/typography';
import { isSameLocalDay } from '@/domain/garden/days';
import { careToday, partOfDay } from '@/domain/home/care';
import { useGardenStore } from '@/store/gardenStore';
import { useProfileStore } from '@/store/profileStore';

const ROW_ICONS: Record<FlowThemeName, IconName> = {
  mood: 'emoticon-happy-outline',
  water: 'water-outline',
  food: 'food-apple-outline',
  movement: 'run',
  sleep: 'power-sleep',
};
const ROW_TITLES: Record<FlowThemeName, string> = {
  mood: HOME_COPY.care.mood,
  water: HOME_COPY.care.water,
  food: HOME_COPY.care.food,
  movement: HOME_COPY.care.movement,
  sleep: HOME_COPY.care.sleep,
};

interface Props {
  /** Opens the paged check-in: from its first page, or one page to edit. */
  onOpenFlow: (step: number, single: boolean) => void;
}

/**
 * The homepage: a greeting, the care dots, then the day so far. Each line shows what was
 * noted and opens its own page to add or change it. Below: steps, one good thing, a slow breath.
 */
export default function TodayView({ onOpenFlow }: Props) {
  const name = useProfileStore((s) => s.profile?.name ?? null);
  const store = useGardenStore();
  const { checkIns, water, workouts, meals, sleep, goodThings, stepsToday, stepsStatus } = store;
  const now = new Date();
  const today = (iso: string) => isSameLocalDay(new Date(iso), now);

  const mood = store.todayYardMood();
  const unwell = store.todayUnwell();
  const eaten = store.mealsToday();
  const kcal = store.todayCalories();
  const lastSleep = store.lastNightSleep();
  const glasses = water.filter((w) => today(w.created_at)).length;
  const todaysWorkouts = workouts.filter((w) => today(w.created_at));

  const part = partOfDay(now);
  const kindLine = unwell ? HOME_COPY.unwellLine : mood ? HOME_COPY.moodLine[mood] : HOME_COPY.welcome[part];
  const done = careToday({ checkIns, water, meals, workouts, sleep }, now);
  const anything = Object.values(done).some(Boolean);

  const S = HOME_COPY.summary;
  const foodParts = [
    eaten.length ? S.meals(eaten.map((m) => YARD_COPY.foodSheet.meals[m])) : '',
    kcal != null ? S.kcal(kcal) : '',
  ].filter(Boolean);
  const values: Record<FlowThemeName, string | null> = {
    mood: mood ? S.mood(YARD_COPY.moods[mood].label, unwell) : null,
    water: glasses ? WATER_COPY.count(glasses) : null,
    food: foodParts.length ? foodParts.join(', ') : null,
    movement: todaysWorkouts.length
      ? S.movement(todaysWorkouts.length, todaysWorkouts.reduce((m, w) => m + w.minutes, 0))
      : null,
    sleep: lastSleep
      ? S.sleep(lastSleep.hours, lastSleep.feel ? YARD_COPY.sleepSheet.feels[lastSleep.feel] : undefined)
      : null,
  };

  // ---- One good thing: shown as kept text once saved, with a way back to change it.
  const todaysGood = store.todayGoodThing();
  const [good, setGood] = useState('');
  const [editingGood, setEditingGood] = useState(false);
  useEffect(() => {
    setEditingGood(false);
  }, [todaysGood?.text]);
  const earlier = goodThings.filter((g) => g.id !== todaysGood?.id).slice(0, 5);
  const showGoodInput = !todaysGood || editingGood;

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
        <CareDots done={done} />
        <View style={styles.start}>
          <Button
            label={anything ? HOME_COPY.continueFlow : HOME_COPY.startFlow}
            variant={anything ? 'secondary' : 'primary'}
            onPress={() => onOpenFlow(0, false)}
          />
        </View>
      </View>

      {store.error ? <Text style={styles.error}>{store.error}</Text> : null}

      <Text style={styles.heading} accessibilityRole="header">
        {HOME_COPY.todayTitle}
      </Text>
      {FLOW_STEPS.map((kind, step) => {
        const theme = flowThemes[kind];
        const value = values[kind];
        return (
          <View key={kind} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: theme.bg }]}>
              <Icon name={ROW_ICONS[kind]} size={24} color={theme.ink} />
            </View>
            <View style={parts.grow}>
              <Text style={styles.rowTitle}>{ROW_TITLES[kind]}</Text>
              <Text style={[styles.rowValue, !value && styles.rowEmpty]}>{value ?? HOME_COPY.notYet}</Text>
            </View>
            <View style={styles.rowAction}>
              <Button
                label={value ? HOME_COPY.edit : HOME_COPY.add}
                size="sm"
                variant="secondary"
                accessibilityLabel={HOME_COPY.editA11y(ROW_TITLES[kind])}
                onPress={() => onOpenFlow(step, true)}
              />
            </View>
          </View>
        );
      })}

      <View style={styles.gap} />

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

      <Section icon="heart-outline" title={HOME_COPY.goodTitle} value={todaysGood && !editingGood ? HOME_COPY.goodKept : undefined}>
        {showGoodInput ? (
          <>
            <Text style={parts.body}>{HOME_COPY.goodBody}</Text>
            <TextInput
              value={good}
              onChangeText={setGood}
              accessibilityLabel={HOME_COPY.goodLabel}
              placeholder={HOME_COPY.goodPlaceholder}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={280}
              style={styles.note}
            />
            <Button
              label={HOME_COPY.goodSave}
              onPress={() =>
                void store.saveGoodThing(good).then(
                  () => {
                    setGood('');
                    setEditingGood(false);
                  },
                  () => {},
                )
              }
            />
          </>
        ) : (
          <>
            <View style={styles.kept}>
              <Text style={styles.keptText}>{todaysGood?.text}</Text>
            </View>
            <Button
              label={HOME_COPY.goodEdit}
              variant="link"
              size="sm"
              onPress={() => {
                setGood(todaysGood?.text ?? '');
                setEditingGood(true);
              }}
            />
          </>
        )}
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
  hello: { backgroundColor: colors.warm, borderRadius: 32, padding: 22, marginBottom: 20 },
  greeting: { ...font.extrabold, fontSize: 30, lineHeight: 36, color: colors.textPrimary },
  kind: { ...font.medium, fontSize: 17, lineHeight: 25, color: colors.textSecondary, marginTop: 6 },
  start: { marginTop: 18 },
  error: { ...font.medium, fontSize: 14, color: colors.error, marginBottom: 10 },
  heading: { ...font.bold, fontSize: 21, color: colors.textPrimary, marginBottom: 10, marginLeft: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 14,
    marginBottom: 10,
    ...elevation.card,
  },
  rowIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { ...font.bold, fontSize: 17, color: colors.textPrimary },
  rowValue: { ...font.medium, fontSize: 15, lineHeight: 21, color: colors.textSecondary, marginTop: 1 },
  rowEmpty: { ...font.regular, color: colors.textMuted },
  rowAction: { width: 84 },
  gap: { height: 10 },
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
  kept: { backgroundColor: colors.warm, borderRadius: 20, padding: 16 },
  keptText: { ...font.semibold, fontSize: 17, lineHeight: 25, color: colors.textPrimary },
  earlier: { marginTop: 14 },
  earlierLine: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginBottom: 4 },
});
