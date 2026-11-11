import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/Icon';
import { flowThemes, type FlowTheme, type FlowThemeName } from '@/constants/colors';
import { COMPANION_COPY, FLOW_COPY, WORKOUT_COPY, YARD_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { YARD_MOODS } from '@/domain/checkin/moods';
import { isSameLocalDay } from '@/domain/garden/days';
import { yesterdayRepeat } from '@/domain/home/companion';
import { parseNumber } from '@/domain/body/units';
import { MEALS, tidySleepHours, useGardenStore } from '@/store/gardenStore';
import type { Meal, PauseKind, SleepFeel, WorkoutType, YardMood } from '@/types';

/**
 * The paged check-in: one question per page, each page its own colour world.
 * Mood, water, food, movement, sleep. Every page can be skipped; nothing is required.
 * Opened once a day by itself, and one page at a time from the home's Edit buttons.
 */
export const FLOW_STEPS: readonly FlowThemeName[] = ['mood', 'water', 'food', 'movement', 'sleep'];
const MAX_KCAL = 10000;
const DEFAULT_SLEEP_HOURS = 7;

const MOOD_ICONS: Record<YardMood, IconName> = {
  tired: 'weather-night',
  low: 'weather-cloudy',
  frustrated: 'weather-lightning',
  steady: 'weather-partly-cloudy',
  buzzing: 'white-balance-sunny',
};
const MEAL_ICONS: Record<Meal, IconName> = {
  breakfast: 'coffee-outline',
  lunch: 'food-outline',
  dinner: 'silverware-fork-knife',
  snack: 'food-apple-outline',
};
const WORKOUT_ICONS: Record<WorkoutType, IconName> = {
  walk: 'walk',
  run: 'run',
  yoga: 'yoga',
  gym: 'dumbbell',
  cycle: 'bike',
  sport: 'basketball',
  dance: 'dance-ballroom',
  other: 'dots-horizontal',
};
const WORKOUT_TYPES = Object.keys(WORKOUT_ICONS) as WorkoutType[];
const FEELS: SleepFeel[] = ['restless', 'okay', 'deep'];
const PAUSES: PauseKind[] = ['unwell', 'overwhelmed', 'travelling', 'resting'];
/** Fixed spots for the sleep page's stars, as shares of the page. */
const STARS: [number, number, number][] = [
  [0.08, 0.12, 3], [0.22, 0.05, 2], [0.4, 0.14, 2], [0.63, 0.07, 3], [0.9, 0.16, 2],
  [0.15, 0.3, 2], [0.93, 0.36, 3], [0.05, 0.52, 2], [0.86, 0.6, 2], [0.5, 0.26, 2],
];

// ---- Controls drawn in the page's own colours ------------------------------

function Tile({
  theme,
  label,
  detail,
  icon,
  selected,
  onPress,
  layout = 'row',
  a11y,
}: {
  theme: FlowTheme;
  label: string;
  detail?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
  layout?: 'row' | 'stack';
  a11y?: string;
}) {
  const fg = selected ? theme.onInk : theme.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      accessibilityState={{ selected }}
      style={[
        styles.tile,
        layout === 'stack' && styles.tileStack,
        { backgroundColor: selected ? theme.ink : theme.soft, borderColor: theme.ink },
      ]}
    >
      {icon ? <Icon name={icon} size={layout === 'stack' ? 30 : 26} color={fg} /> : null}
      <View style={layout === 'row' ? styles.tileText : styles.tileTextStack}>
        <Text style={[styles.tileLabel, { color: fg }, layout === 'stack' && styles.center]}>{label}</Text>
        {detail ? <Text style={[styles.tileDetail, { color: fg }]}>{detail}</Text> : null}
      </View>
    </Pressable>
  );
}

function Round({ theme, icon, label, onPress, disabled }: { theme: FlowTheme; icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.round, { backgroundColor: theme.ink, opacity: disabled ? 0.35 : 1 }]}
    >
      <Icon name={icon} size={30} color={theme.onInk} />
    </Pressable>
  );
}

function Solid({ theme, label, onPress }: { theme: FlowTheme; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[styles.solid, { backgroundColor: theme.ink }]}>
      <Text style={[styles.solidLabel, { color: theme.onInk }]}>{label}</Text>
    </Pressable>
  );
}

function Link({ theme, label, onPress, a11y }: { theme: FlowTheme; label: string; onPress: () => void; a11y?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y ?? label} style={styles.link}>
      <Text style={[styles.linkLabel, { color: theme.ink }]}>{label}</Text>
    </Pressable>
  );
}

// ---- The flow ---------------------------------------------------------------

interface Props {
  /** Which page to open on. */
  initialStep?: number;
  /** Editing one page from home: no Back or Next, just Done. */
  single?: boolean;
  onClose: () => void;
}

export function CheckInFlow({ initialStep = 0, single = false, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const store = useGardenStore();
  const [step, setStep] = useState(initialStep);
  const kind = FLOW_STEPS[step];
  const theme = flowThemes[kind];
  const now = new Date();
  const today = (iso: string) => isSameLocalDay(new Date(iso), now);

  // Mood
  const mood = store.todayYardMood();
  const pause = store.todayState()?.pause ?? null;
  // What yesterday held that today does not yet: one tap instead of typing it again.
  const same = yesterdayRepeat({ meals: store.meals, workouts: store.workouts, calories: store.calories }, now);
  // Water
  const glasses = store.water.filter((w) => today(w.created_at)).length;
  // Food
  const eaten = store.mealsToday();
  const savedKcal = store.todayCalories();
  const [kcalText, setKcalText] = useState(savedKcal == null ? '' : String(savedKcal));
  const [kcalError, setKcalError] = useState(false);
  // Movement
  const todaysWorkouts = store.workouts.filter((w) => today(w.created_at));
  const [type, setType] = useState<WorkoutType | null>(null);
  const [minutes, setMinutes] = useState<number>(WORKOUT_COPY.durations[2]);
  // Sleep
  const lastSleep = store.lastNightSleep();
  const [hours, setHours] = useState(lastSleep?.hours ?? DEFAULT_SLEEP_HOURS);
  const [feel, setFeel] = useState<SleepFeel | null>(lastSleep?.feel ?? null);
  const [sleepTouched, setSleepTouched] = useState(false);

  const toggleMeal = (meal: Meal) => {
    const next = eaten.includes(meal) ? eaten.filter((m) => m !== meal) : [...eaten, meal];
    store.setMealsToday(next).catch(() => {});
  };

  /** Saves what the page holds in local state. False means "stay here, something needs a look". */
  const commit = async (): Promise<boolean> => {
    try {
      if (kind === 'food') {
        const text = kcalText.trim();
        if (!text) {
          if (savedKcal != null) await store.setCaloriesToday(null);
        } else {
          const n = parseNumber(text);
          if (n == null || n > MAX_KCAL) {
            setKcalError(true);
            return false;
          }
          if (n !== savedKcal) await store.setCaloriesToday(n);
        }
        setKcalError(false);
      }
      if (kind === 'movement' && type) {
        await store.addWorkout(type, minutes);
        setType(null);
      }
      if (kind === 'sleep' && sleepTouched) {
        await store.logSleep(hours, feel);
        setSleepTouched(false);
      }
      return true;
    } catch {
      return true; // the store keeps a calm message; never trap someone on a page
    }
  };

  const go = async (delta: number) => {
    if (!(await commit())) return;
    const next = step + delta;
    if (single || next >= FLOW_STEPS.length) onClose();
    else if (next >= 0) setStep(next);
  };
  const close = async () => {
    if (await commit()) onClose();
  };

  const last = step === FLOW_STEPS.length - 1;
  const copy = FLOW_COPY[kind];

  return (
    <View style={[styles.page, { backgroundColor: theme.bg, paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 14) }]}>
      {/* A large soft shape, placed differently on every page. Decorative. */}
      <View pointerEvents="none" style={[styles.glow, glowStyle[kind], { backgroundColor: theme.glow }]} />
      {kind === 'sleep'
        ? STARS.map(([x, y, r], k) => (
            <View
              key={k}
              pointerEvents="none"
              style={[styles.star, { left: `${x * 100}%`, top: `${y * 100}%`, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: theme.ink }]}
            />
          ))
        : null}

      <View style={styles.top}>
        {single ? (
          <View style={styles.grow} />
        ) : (
          <View
            style={styles.progress}
            accessible
            accessibilityLabel={FLOW_COPY.progress(step + 1, FLOW_STEPS.length)}
          >
            {FLOW_STEPS.map((s, k) => (
              <View key={s} style={[styles.bar, { backgroundColor: theme.ink, opacity: k <= step ? 1 : 0.22 }]} />
            ))}
          </View>
        )}
        <Link theme={theme} label={FLOW_COPY.close} a11y={FLOW_COPY.closeA11y} onPress={() => void close()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>
          <Text style={[styles.title, { color: theme.ink }]} accessibilityRole="header">
            {copy.title}
          </Text>
          <Text style={[styles.sub, { color: theme.ink }]}>{copy.sub}</Text>

          {kind === 'mood' ? (
            <View style={styles.block}>
              {(YARD_MOODS as readonly YardMood[]).map((m) => (
                <Tile
                  key={m}
                  theme={theme}
                  icon={MOOD_ICONS[m]}
                  label={YARD_COPY.moods[m].label}
                  detail={YARD_COPY.moods[m].flavor}
                  selected={mood === m}
                  onPress={() => void store.logYardMood(m).catch(() => {})}
                />
              ))}
              <Text style={[styles.panelTitle, { color: theme.ink, marginTop: 10 }]}>{COMPANION_COPY.pauseTitle}</Text>
              <Text style={[styles.panelBody, { color: theme.ink, marginBottom: 2 }]}>{COMPANION_COPY.pauseBody}</Text>
              <View style={styles.grid}>
                {PAUSES.map((k) => (
                  <View key={k} style={styles.half}>
                    <Tile
                      theme={theme}
                      layout="stack"
                      label={COMPANION_COPY.pauses[k]}
                      selected={pause === k}
                      onPress={() => void store.setPause(pause === k ? null : k).catch(() => {})}
                    />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {kind === 'water' ? (
            <View style={[styles.block, styles.centerBlock]}>
              <Text style={[styles.giant, { color: theme.ink }]}>{glasses}</Text>
              <Text style={[styles.giantUnit, { color: theme.ink }]}>{FLOW_COPY.water.glasses(glasses)}</Text>
              <View style={styles.drops}>
                {Array.from({ length: Math.max(8, Math.min(glasses, 16)) }, (_, k) => (
                  <Icon key={k} name={k < glasses ? 'water' : 'water-outline'} size={30} color={theme.ink} />
                ))}
              </View>
              <View style={styles.rounds}>
                <Round
                  theme={theme}
                  icon="minus"
                  label={FLOW_COPY.water.remove}
                  disabled={glasses === 0}
                  onPress={() => void store.removeLastGlassToday().catch(() => {})}
                />
                <Round theme={theme} icon="plus" label={FLOW_COPY.water.add} onPress={() => void store.addGlass().catch(() => {})} />
              </View>
            </View>
          ) : null}

          {kind === 'food' ? (
            <View style={styles.block}>
              {same.meals.length ? (
                <Tile
                  theme={theme}
                  icon="history"
                  label={COMPANION_COPY.sameMeals(same.meals.map((m) => YARD_COPY.foodSheet.meals[m]).join(', '))}
                  a11y={COMPANION_COPY.sameMealsA11y}
                  selected={false}
                  onPress={() => void store.setMealsToday(same.meals).catch(() => {})}
                />
              ) : null}
              <View style={styles.grid}>
                {MEALS.map((m) => (
                  <View key={m} style={styles.half}>
                    <Tile
                      theme={theme}
                      layout="stack"
                      icon={MEAL_ICONS[m]}
                      label={YARD_COPY.foodSheet.meals[m]}
                      selected={eaten.includes(m)}
                      onPress={() => toggleMeal(m)}
                    />
                  </View>
                ))}
              </View>
              <View style={[styles.panel, { backgroundColor: theme.soft, borderColor: theme.ink }]}>
                <Text style={[styles.panelTitle, { color: theme.ink }]}>{FLOW_COPY.food.caloriesTitle}</Text>
                <Text style={[styles.panelBody, { color: theme.ink }]}>{FLOW_COPY.food.caloriesBody}</Text>
                <TextInput
                  value={kcalText}
                  onChangeText={(t) => {
                    setKcalText(t);
                    setKcalError(false);
                  }}
                  accessibilityLabel={FLOW_COPY.food.caloriesLabel}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={5}
                  style={[styles.input, { color: theme.ink, borderColor: theme.ink, backgroundColor: theme.bg }]}
                />
                {same.kcal != null && !kcalText ? (
                  <Link
                    theme={theme}
                    label={COMPANION_COPY.sameKcal(same.kcal)}
                    a11y={COMPANION_COPY.sameKcalA11y}
                    onPress={() => setKcalText(String(same.kcal))}
                  />
                ) : null}
                {kcalError ? <Text style={[styles.panelTitle, { color: theme.ink }]}>{FLOW_COPY.food.caloriesInvalid}</Text> : null}
              </View>
            </View>
          ) : null}

          {kind === 'movement' ? (
            <View style={styles.block}>
              {todaysWorkouts.map((w) => (
                <View key={w.id} style={[styles.entry, { borderColor: theme.ink }]}>
                  <Icon name={WORKOUT_ICONS[w.type]} size={22} color={theme.ink} />
                  <Text style={[styles.entryText, { color: theme.ink }]}>{WORKOUT_COPY.entry(w.type, w.minutes)}</Text>
                  <Link
                    theme={theme}
                    label={FLOW_COPY.movement.remove}
                    a11y={WORKOUT_COPY.deleteA11y(w.type, w.minutes)}
                    onPress={() => void store.removeWorkout(w.id).catch(() => {})}
                  />
                </View>
              ))}
              {same.workouts.map((w) => (
                <Tile
                  key={`${w.type}:${w.minutes}`}
                  theme={theme}
                  icon="history"
                  label={COMPANION_COPY.again(WORKOUT_COPY.entry(w.type, w.minutes))}
                  a11y={COMPANION_COPY.sameWorkoutA11y(WORKOUT_COPY.entry(w.type, w.minutes))}
                  selected={false}
                  onPress={() => void store.addWorkout(w.type, w.minutes).catch(() => {})}
                />
              ))}
              <View style={styles.grid}>
                {WORKOUT_TYPES.map((t) => (
                  <View key={t} style={styles.quarter}>
                    <Tile
                      theme={theme}
                      layout="stack"
                      icon={WORKOUT_ICONS[t]}
                      label={WORKOUT_COPY.types[t]}
                      selected={type === t}
                      onPress={() => setType(type === t ? null : t)}
                    />
                  </View>
                ))}
              </View>
              {type ? (
                <>
                  <Text style={[styles.panelTitle, { color: theme.ink, marginTop: 6 }]}>{FLOW_COPY.movement.minutes}</Text>
                  <View style={styles.pills}>
                    {WORKOUT_COPY.durations.map((d) => (
                      <View key={d} style={styles.grow}>
                        <Tile
                          theme={theme}
                          layout="stack"
                          label={WORKOUT_COPY.durationChip(d)}
                          a11y={WORKOUT_COPY.durationA11y(d)}
                          selected={minutes === d}
                          onPress={() => setMinutes(d)}
                        />
                      </View>
                    ))}
                  </View>
                  <Solid
                    theme={theme}
                    label={FLOW_COPY.movement.add}
                    onPress={() => void store.addWorkout(type, minutes).then(() => setType(null), () => {})}
                  />
                </>
              ) : null}
            </View>
          ) : null}

          {kind === 'sleep' ? (
            <View style={[styles.block, styles.centerBlock]}>
              <Icon name="moon-waning-crescent" size={44} color={theme.ink} />
              <View style={styles.rounds}>
                <Round
                  theme={theme}
                  icon="minus"
                  label={FLOW_COPY.sleep.less}
                  onPress={() => {
                    setHours((h) => tidySleepHours(h - 0.5));
                    setSleepTouched(true);
                  }}
                />
                <View style={styles.hoursBox}>
                  <Text style={[styles.giant, { color: theme.ink, opacity: sleepTouched || lastSleep ? 1 : 0.55 }]}>{hours}</Text>
                  <Text style={[styles.giantUnit, { color: theme.ink }]}>{FLOW_COPY.sleep.hours(hours)}</Text>
                </View>
                <Round
                  theme={theme}
                  icon="plus"
                  label={FLOW_COPY.sleep.more}
                  onPress={() => {
                    setHours((h) => tidySleepHours(h + 0.5));
                    setSleepTouched(true);
                  }}
                />
              </View>
              {!sleepTouched && !lastSleep ? <Text style={[styles.sub, { color: theme.ink }]}>{FLOW_COPY.sleep.hint}</Text> : null}
              <Text style={[styles.panelTitle, styles.feelTitle, { color: theme.ink }]}>{FLOW_COPY.sleep.feelTitle}</Text>
              <View style={styles.pills}>
                {FEELS.map((f) => (
                  <View key={f} style={styles.grow}>
                    <Tile
                      theme={theme}
                      layout="stack"
                      label={YARD_COPY.sleepSheet.feels[f]}
                      selected={feel === f}
                      onPress={() => {
                        setFeel(feel === f ? null : f);
                        setSleepTouched(true);
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.column}>
          {single ? (
            <Solid theme={theme} label={FLOW_COPY.done} onPress={() => void go(1)} />
          ) : (
            <View style={styles.nav}>
              {step > 0 ? <Link theme={theme} label={FLOW_COPY.back} onPress={() => void go(-1)} /> : <View style={styles.link} />}
              <View style={styles.grow}>
                <Solid theme={theme} label={last ? FLOW_COPY.finish : FLOW_COPY.next} onPress={() => void go(1)} />
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

/** Each page's big soft shape sits somewhere different, so no two pages share a silhouette. */
const glowStyle = StyleSheet.create({
  mood: { width: 360, height: 360, borderRadius: 180, top: -150, right: -120 },
  water: { width: 520, height: 520, borderRadius: 260, bottom: -330, left: -110 },
  food: { width: 300, height: 300, borderRadius: 90, top: -110, left: -90, transform: [{ rotate: '24deg' }] },
  movement: { width: 560, height: 220, borderRadius: 110, top: 40, right: -300, transform: [{ rotate: '-18deg' }] },
  sleep: { width: 440, height: 440, borderRadius: 220, bottom: -260, right: -160 },
});

const styles = StyleSheet.create({
  page: { flex: 1, overflow: 'hidden' },
  glow: { position: 'absolute' },
  star: { position: 'absolute', opacity: 0.7 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  progress: { flex: 1, flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 6, borderRadius: 3 },
  grow: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 },
  column: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  title: { ...font.extrabold, fontSize: 34, lineHeight: 40 },
  sub: { ...font.medium, fontSize: 17, lineHeight: 25, marginTop: 8, opacity: 0.9 },
  block: { marginTop: 22, gap: 10 },
  centerBlock: { alignItems: 'center' },
  center: { textAlign: 'center' },

  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    borderRadius: 22,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tileStack: { flexDirection: 'column', justifyContent: 'center', gap: 6, minHeight: 60, paddingHorizontal: 6 },
  tileText: { flex: 1 },
  tileTextStack: { alignItems: 'center' },
  tileLabel: { ...font.bold, fontSize: 17 },
  tileDetail: { ...font.regular, fontSize: 14, marginTop: 1, opacity: 0.9 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  half: { width: '50%', padding: 5 },
  quarter: { width: '25%', padding: 5 },
  pills: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },

  giant: { ...font.extrabold, fontSize: 84, lineHeight: 92 },
  giantUnit: { ...font.semibold, fontSize: 18, marginTop: -6 },
  drops: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginVertical: 18, maxWidth: 300 },
  rounds: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  round: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  hoursBox: { alignItems: 'center', minWidth: 130 },
  feelTitle: { marginTop: 22, alignSelf: 'flex-start' },

  panel: { borderRadius: 22, borderWidth: 2, padding: 16, marginTop: 6 },
  panelTitle: { ...font.bold, fontSize: 16 },
  panelBody: { ...font.regular, fontSize: 14, lineHeight: 20, marginTop: 2, marginBottom: 10, opacity: 0.9 },
  input: { ...font.bold, minHeight: 50, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 18, marginBottom: 6 },

  entry: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, paddingBottom: 6 },
  entryText: { ...font.semibold, flex: 1, fontSize: 16 },

  bottom: { paddingHorizontal: 20, paddingTop: 10 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  solid: { minHeight: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  solidLabel: { ...font.bold, fontSize: 18 },
  link: { minHeight: 48, minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  linkLabel: { ...font.bold, fontSize: 16, textDecorationLine: 'underline' },
});
