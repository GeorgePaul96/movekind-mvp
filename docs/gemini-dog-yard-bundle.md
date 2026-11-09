# MoveKind source for the dog yard rewrite (branch park, 2026-11-09)

Pip and Motion are included as examples of the current character and animation code. The park art files are not included: they are being deleted. The meals, sleep and yard-mood data layer is already built (see gardenStore.ts, types and yardData.test.ts).

## src/screens/main/ParkScreen.tsx

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ParkScene, type ParkScrollHandle } from '@/components/park/ParkScene';
import { ParkDrawer } from '@/components/park/ParkDrawer';
import { ParkTour } from '@/components/park/ParkTour';
import { Sheet } from '@/components/park/Sheet';
import { WaterSheet } from '@/components/park/sheets/WaterSheet';
import { MoodSheet } from '@/components/park/sheets/MoodSheet';
import { StepsSheet } from '@/components/park/sheets/StepsSheet';
import { WorkoutSheet } from '@/components/garden/WorkoutSheet';
import { colors, parkColors } from '@/constants/colors';
import { PARK_COPY, SLEEP_SOON_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { gardenState } from '@/domain/garden/garden';
import { skyPhase } from '@/domain/garden/sky';
import { untendedToday } from '@/domain/park/tending';
import { parkLayout, type ParkObject } from '@/domain/park/layout';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useGardenStore } from '@/store/gardenStore';
import { useProfileStore } from '@/store/profileStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { Workout } from '@/types';

const GREETING_MS = 4000;

function partOfDay(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

/** Home: the full-screen park. Tap an object to tend it; pull up the drawer for everything else. */
export default function ParkScreen() {
  const win = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const scrollRef = useRef<ParkScrollHandle | null>(null);
  const greetingOpacity = useSharedValue(1);
  const [showGreeting, setShowGreeting] = useState(true);
  const [openSheet, setOpenSheet] = useState<ParkObject | null>(null);
  const [editing, setEditing] = useState<Workout | null>(null);
  const tourSeen = useSettingsStore((s) => s.parkTourSeen);
  const [touring, setTouring] = useState(!tourSeen);

  // Full physical height including bottom inset so no white bar can ever show under Android navigation
  const sceneW = win.width;
  const sceneH = win.height + insets.bottom;

  const name = useProfileStore((s) => s.profile?.name ?? null);
  const checkIns = useGardenStore((s) => s.checkIns);
  const water = useGardenStore((s) => s.water);
  const workouts = useGardenStore((s) => s.workouts);
  const stepsToday = useGardenStore((s) => s.stepsToday);
  const loaded = useGardenStore((s) => s.loaded);
  const load = useGardenStore((s) => s.load);
  const refreshSteps = useGardenStore((s) => s.refreshSteps);
  const addWorkout = useGardenStore((s) => s.addWorkout);
  const updateWorkout = useGardenStore((s) => s.updateWorkout);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  useEffect(() => {
    refreshSteps().catch(() => {}); // reads only if access was already given; never asks
  }, [refreshSteps]);

  // The greeting says hello, then fades so the park speaks for itself.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (reduce) setShowGreeting(false);
      else {
        greetingOpacity.value = withTiming(0, { duration: 900 }, (done) => {
          if (done) runOnJS(setShowGreeting)(false);
        });
      }
    }, GREETING_MS);
    return () => clearTimeout(timer);
  }, [greetingOpacity, reduce]);

  const greetingStyle = useAnimatedStyle(() => ({ opacity: greetingOpacity.value }));

  const now = new Date();
  const input = { checkIns, water, workouts, stepsToday };
  const state = gardenState(input, now);
  const phase = skyPhase(now);
  const light = state.resting || phase === 'night' ? 'night' : state.weather === 'rain' ? 'rain' : phase;
  const allMinutes = workouts.reduce((m, w) => m + w.minutes, 0);
  // The water sheet covers the fawn, so its thank-you waits until the sheet is closing.
  const wateredShown = useRef(water.length);
  if (openSheet !== 'river') wateredShown.current = water.length;
  const close = () => {
    setOpenSheet(null);
    setEditing(null);
  };

  return (
    <View style={[styles.root, { backgroundColor: parkColors.ground[light].front }]}>
      {/* After loading, so stored history doesn't read as things just logged and set everything popping. */}
      {loaded && (
        <ParkScene
          state={state}
          phase={phase}
          untended={untendedToday(input, now)}
          logged={workouts.length}
          watered={wateredShown.current}
          onObject={setOpenSheet}
          width={sceneW}
          height={sceneH}
          scrollRef={scrollRef}
        />
      )}

      {showGreeting && (
        <Animated.View pointerEvents="none" style={[styles.greeting, { top: insets.top + 24 }, greetingStyle]}>
          <Text
            style={[
              styles.greetingText,
              { color: light === 'night' || light === 'dusk' ? colors.onInverse : colors.textPrimary },
            ]}
          >
            {PARK_COPY.greeting(partOfDay(now), name)}
          </Text>
        </Animated.View>
      )}

      {touring && (
        <ParkTour
          layout={parkLayout(sceneW, win.height)}
          screenW={sceneW}
          scrollTo={(x) => scrollRef.current?.scrollTo({ x, y: 0, animated: !reduce })}
          focusObject={(o) => scrollRef.current?.focusObject?.(o)}
          onDone={() => setTouring(false)}
        />
      )}

      <ParkDrawer
        height={win.height}
        bottomInset={insets.bottom}
        onOpenSheet={setOpenSheet}
        onEditWorkout={(w) => {
          setEditing(w);
          setOpenSheet('tree');
        }}
      />

      <WaterSheet visible={openSheet === 'river'} onClose={close} />
      <MoodSheet visible={openSheet === 'flowerbed'} onClose={close} />
      <StepsSheet visible={openSheet === 'path'} onClose={close} />
      <WorkoutSheet
        visible={openSheet === 'tree'}
        initial={editing}
        minutesSoFar={editing ? allMinutes - editing.minutes : allMinutes}
        onClose={close}
        onSave={(type, minutes) => {
          (editing ? updateWorkout(editing.id, { type, minutes }) : addWorkout(type, minutes)).catch(() => {});
          close();
        }}
      />
      <Sheet visible={openSheet === 'hammock'} title={SLEEP_SOON_COPY.title} onClose={close}>
        <Text style={styles.soon}>{SLEEP_SOON_COPY.body}</Text>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  greeting: { position: 'absolute', left: 24, right: 24, alignItems: 'center' },
  greetingText: {
    ...font.extrabold,
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  soon: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginVertical: 12 },
});
```

## src/components/park/ParkDrawer.tsx

```tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { colors, elevation } from '@/constants/colors';
import { DRAWER_COPY, GARDEN_COPY, MOOD_COPY, STEPS_COPY, WATER_COPY, WORKOUT_COPY } from '@/constants/copy';
import type { Workout } from '@/types';
import { font } from '@/constants/typography';
import { weeklyChanges } from '@/domain/garden/changes';
import { isSameLocalDay } from '@/domain/garden/days';
import type { ParkObject } from '@/domain/park/layout';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useGardenStore } from '@/store/gardenStore';
import ChangesView from '@/screens/main/ChangesView';
import MeView from '@/screens/main/MeView';

const PEEK = 56;

interface Props {
  height: number;
  bottomInset: number;
  /** Open the same sheet a park object opens. */
  onOpenSheet: (o: ParkObject) => void;
  /** Re-open the workout log prefilled with this workout. */
  onEditWorkout: (w: Workout) => void;
}

function Row({
  icon,
  title,
  value,
  action,
  onPress,
  primary,
}: {
  icon: IconName;
  title: string;
  value: string;
  action: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
      </View>
      <View style={styles.rowAction}>
        <Button label={action} size="sm" variant={primary ? 'primary' : 'secondary'} onPress={onPress} />
      </View>
    </View>
  );
}

/**
 * The drawer over the park. Closed it is only a light arrow, so the park stays whole; tap it or
 * swipe up to open: plain log buttons (also the screen-reader path), the gentle note, Changes and Me.
 */
export function ParkDrawer({ height, bottomInset, onOpenSheet, onEditWorkout }: Props) {
  const reduce = useReduceMotion();
  const [open, setOpen] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;
  const closedY = height - PEEK - bottomInset;
  const openY = Math.round(height * 0.1);

  const translateY = useSharedValue(closedY);
  const startY = useSharedValue(closedY);
  const bob = useSharedValue(0);

  // Only a change of screen size repositions the drawer directly; open and close run the spring.
  useEffect(() => {
    translateY.value = openRef.current ? openY : closedY;
  }, [closedY, openY, translateY]);

  useEffect(() => {
    if (reduce || open) {
      bob.value = 0;
      return;
    }
    bob.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [bob, open, reduce]);

  const snapTo = (nextOpen: boolean, velocityY = 0) => {
    const target = nextOpen ? openY : closedY;
    // Opening shows the panel at once; closing keeps it until it has slid away.
    if (nextOpen) setOpen(true);
    if (reduce) {
      translateY.value = target;
      setOpen(nextOpen);
    } else {
      translateY.value = withSpring(
        target,
        { damping: 22, stiffness: 210, velocity: velocityY },
        (finished) => {
          if (finished && !nextOpen) runOnJS(setOpen)(false);
        },
      );
    }
  };

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .failOffsetX([-15, 15])
        .onStart(() => {
          startY.value = translateY.value;
          if (!open) runOnJS(setOpen)(true);
        })
        .onUpdate((e) => {
          const next = startY.value + e.translationY;
          translateY.value = Math.max(openY, Math.min(closedY, next));
        })
        .onEnd((e) => {
          const mid = (openY + closedY) / 2;
          const shouldOpen = e.velocityY < -400 || (e.velocityY <= 400 && translateY.value < mid);
          runOnJS(snapTo)(shouldOpen, e.velocityY);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [closedY, open, openY, reduce],
  );

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));

  const checkIns = useGardenStore((s) => s.checkIns);
  const water = useGardenStore((s) => s.water);
  const workouts = useGardenStore((s) => s.workouts);
  const stepsToday = useGardenStore((s) => s.stepsToday);
  const stepsByDay = useGardenStore((s) => s.stepsByDay);
  const stepsStatus = useGardenStore((s) => s.stepsStatus);
  const todayMood = useGardenStore((s) => s.todayMood());
  const addGlass = useGardenStore((s) => s.addGlass);
  const removeWorkout = useGardenStore((s) => s.removeWorkout);

  const today = (iso: string) => isSameLocalDay(new Date(iso), new Date());
  const glasses = water.filter((w) => today(w.created_at)).length;
  const todaysWorkouts = workouts.filter((w) => today(w.created_at));
  const minutes = todaysWorkouts.reduce((m, w) => m + w.minutes, 0);
  const steps = stepsStatus === 'granted' ? STEPS_COPY.count(stepsToday ?? 0) : GARDEN_COPY.stepsSoon;
  const note = weeklyChanges(
    { checkIns, water, workouts, stepsToday, stepsByDay: stepsStatus === 'granted' ? stepsByDay : undefined },
    new Date(),
  )[0]?.text;

  return (
    <Animated.View
      style={[styles.drawer, open && styles.panel, { height: height - openY + bottomInset }, drawerStyle]}
    >
      <GestureDetector gesture={pan}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? DRAWER_COPY.closeLabel : DRAWER_COPY.openLabel}
          onPress={() => snapTo(!open)}
          style={styles.peek}
        >
          <Animated.View style={chevronStyle}>
            <Icon name={open ? 'chevron-down' : 'chevron-up'} size={40} color={open ? colors.textSecondary : colors.onInverse} />
          </Animated.View>
        </Pressable>
      </GestureDetector>

      {open && (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 + bottomInset }}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{DRAWER_COPY.todayTitle}</Text>
          {note ? (
            <View style={styles.note}>
              <Icon name="creation" size={18} color={colors.onInverse} />
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ) : null}
          <Row icon="water-outline" title={DRAWER_COPY.rows.water.title} value={WATER_COPY.count(glasses)} action={DRAWER_COPY.rows.water.action} onPress={() => addGlass().catch(() => {})} primary />
          <Row icon="run" title={DRAWER_COPY.rows.workout.title} value={minutes ? DRAWER_COPY.minutesToday(minutes) : DRAWER_COPY.noWorkoutYet} action={DRAWER_COPY.rows.workout.action} onPress={() => onOpenSheet('tree')} />
          {todaysWorkouts.map((w) => (
            <View key={w.id} style={styles.workout}>
              <Text style={styles.workoutText}>{WORKOUT_COPY.entry(w.type, w.minutes)}</Text>
              <Button label={WORKOUT_COPY.edit} variant="link" size="sm" accessibilityLabel={WORKOUT_COPY.editA11y(w.type, w.minutes)} onPress={() => onEditWorkout(w)} />
              <Button label={WORKOUT_COPY.delete} variant="link" size="sm" accessibilityLabel={WORKOUT_COPY.deleteA11y(w.type, w.minutes)} onPress={() => removeWorkout(w.id).catch(() => {})} />
            </View>
          ))}
          <Row icon="flower-outline" title={DRAWER_COPY.rows.mood.title} value={todayMood ? MOOD_COPY[todayMood].label : DRAWER_COPY.noMoodYet} action={DRAWER_COPY.rows.mood.action} onPress={() => onOpenSheet('flowerbed')} />
          <Row icon="shoe-print" title={DRAWER_COPY.rows.steps.title} value={steps} action={DRAWER_COPY.rows.steps.action} onPress={() => onOpenSheet('path')} />

          <Text style={styles.sectionTitle} accessibilityRole="header">{DRAWER_COPY.changesTitle}</Text>
          <ChangesView />
          <Text style={styles.sectionTitle} accessibilityRole="header">{DRAWER_COPY.meTitle}</Text>
          <MeView />
        </ScrollView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawer: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 20, backgroundColor: 'transparent' },
  panel: { backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, ...elevation.raised },
  peek: { height: PEEK, alignSelf: 'center', minWidth: 120, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...font.bold, fontSize: 20, color: colors.textPrimary, marginTop: 18, marginBottom: 10 },
  note: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.inverse, borderRadius: 24, padding: 14, marginBottom: 10 },
  noteText: { ...font.medium, flex: 1, fontSize: 15, lineHeight: 22, color: colors.onInverse },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 24, padding: 14, marginBottom: 10, ...elevation.card },
  rowIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { ...font.bold, fontSize: 16, color: colors.textPrimary },
  rowValue: { ...font.regular, fontSize: 14, color: colors.textSecondary },
  rowAction: { minWidth: 120 },
  workout: { flexDirection: 'row', alignItems: 'center', paddingLeft: 64, marginTop: -4, marginBottom: 6 },
  workoutText: { ...font.medium, flex: 1, fontSize: 15, color: colors.textPrimary },
});
```

## src/components/park/Sheet.tsx

```tsx
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { colors, elevation } from '@/constants/colors';
import { SHEET_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';

interface Props {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** The small sheet a park object opens: handle, title, content, a quiet Close. */
export function Sheet({ visible, title, subtitle, onClose, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 8 }}>
            <Text style={styles.title} accessibilityRole="header">{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {children}
            <Button label={SHEET_COPY.close} variant="link" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    paddingTop: 10,
    paddingBottom: 28,
    ...elevation.raised,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.divider, marginBottom: 14 },
  title: { ...font.bold, fontSize: 24, color: colors.textPrimary },
  subtitle: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginTop: 4, marginBottom: 14 },
});
```

## src/components/park/Hotspot.tsx

```tsx
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import type { ParkObject, Rect } from '@/domain/park/layout';

interface Props {
  object: ParkObject;
  rect: Rect;
  label: string;
  hint: string;
  focused?: boolean;
  onPress: (o: ParkObject) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * An invisible, accessible button laid over a park object. The drawing is the visual, and the
 * object's own movement (see ParkWorld) is the "tap me" cue.
 */
export function Hotspot({ object, rect, label, hint, focused, onPress }: Props) {
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPressIn={() => {
        scale.value = withSpring(1.03, { damping: 15, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 260 });
      }}
      onPress={() => onPress(object)}
      style={[
        styles.target,
        { left: rect.x, top: rect.y, width: rect.w, height: rect.h },
        focused && styles.focused,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  target: { position: 'absolute', borderRadius: 24 },
  focused: { borderWidth: 2, borderColor: colors.primarySoft },
});
```

## src/components/park/sheets/WaterSheet.tsx

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { colors, gardenColors } from '@/constants/colors';
import { WATER_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { isSameLocalDay } from '@/domain/garden/days';
import { useGardenStore } from '@/store/gardenStore';
import { Sheet } from '../Sheet';

/** Water from the river: a drop appears for each glass. No empty slots, no target. */
export function WaterSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const water = useGardenStore((s) => s.water);
  const addGlass = useGardenStore((s) => s.addGlass);
  const removeLastGlassToday = useGardenStore((s) => s.removeLastGlassToday);
  const glasses = water.filter((w) => isSameLocalDay(new Date(w.created_at), new Date())).length;
  const quiet = (p: Promise<unknown>) => p.catch(() => {}); // the store keeps a calm error message

  return (
    <Sheet visible={visible} title={WATER_COPY.title} subtitle={WATER_COPY.subtitle} onClose={onClose}>
      <View style={styles.drops} accessible accessibilityLabel={WATER_COPY.count(glasses)}>
        {Array.from({ length: glasses }, (_, i) => (
          <View key={i} testID="drop" style={styles.drop}>
            <Icon name="water" size={20} color={gardenColors.streamDeep} />
          </View>
        ))}
      </View>
      <Text style={styles.count}>{WATER_COPY.count(glasses)}</Text>
      <Button label={WATER_COPY.add} onPress={() => quiet(addGlass())} />
      {glasses > 0 && <Button label={WATER_COPY.remove} variant="link" size="sm" onPress={() => quiet(removeLastGlassToday())} />}
      <View style={styles.note}>
        <Icon name="heart-outline" size={18} color={colors.primary} />
        <Text style={styles.noteText}>{WATER_COPY.note}</Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  drops: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, minHeight: 8, marginBottom: 6 },
  drop: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { ...font.semibold, fontSize: 15, color: colors.textPrimary, marginBottom: 12 },
  note: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  noteText: { ...font.regular, flex: 1, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});
```

## src/components/park/sheets/MoodSheet.tsx

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { MoodPicker } from '@/components/home/MoodPicker';
import { SHEET_COPY, UNWELL_COPY } from '@/constants/copy';
import { useGardenStore } from '@/store/gardenStore';
import { Sheet } from '../Sheet';

/** The flowerbed: one tap on a mood plants today's flower; then "Feeling unwell today" appears. */
export function MoodSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  // Select the values (not the functions) so the sheet redraws when they change.
  const todayMood = useGardenStore((s) => s.todayMood());
  const todayUnwell = useGardenStore((s) => s.todayUnwell());
  const setUnwell = useGardenStore((s) => s.setUnwell);

  return (
    <Sheet visible={visible} title={SHEET_COPY.moodTitle} subtitle={SHEET_COPY.moodSubtitle} onClose={onClose}>
      <MoodPicker hideTitle />
      {todayMood && (
        <View style={styles.unwell}>
          <Chip
            label={UNWELL_COPY.toggle}
            selected={todayUnwell}
            // Read the live value: two quick taps must not both send the same answer.
            onPress={() => setUnwell(!useGardenStore.getState().todayUnwell()).catch(() => {})}
          />
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  unwell: { flexDirection: 'row', marginTop: 4, marginBottom: 8 },
});
```

## src/components/park/sheets/StepsSheet.tsx

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { GARDEN_COPY, SHEET_COPY, STEPS_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { localDayKey, startOfLocalDay } from '@/domain/garden/days';
import { useGardenStore } from '@/store/gardenStore';
import { Sheet } from '../Sheet';

/** The grass and path: today's steps and the week, or a calm line on how steps arrive. */
export function StepsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const status = useGardenStore((s) => s.stepsStatus);
  const stepsByDay = useGardenStore((s) => s.stepsByDay);
  const allowSteps = useGardenStore((s) => s.allowSteps);
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => startOfLocalDay(now, -i));

  return (
    <Sheet visible={visible} title={SHEET_COPY.stepsTitle} subtitle={SHEET_COPY.stepsSubtitle} onClose={onClose}>
      {status === 'granted' ? (
        <>
          {days.map((d) => (
            <View key={localDayKey(d)} style={styles.row}>
              <Text style={styles.day}>{STEPS_COPY.day(d)}</Text>
              <Text style={styles.count}>{STEPS_COPY.count(stepsByDay[localDayKey(d)] ?? 0)}</Text>
            </View>
          ))}
          <Text style={styles.note}>{STEPS_COPY.weekNote}</Text>
        </>
      ) : status === 'ask' ? (
        <>
          <Text style={styles.note}>{STEPS_COPY.allowHint}</Text>
          <Button label={STEPS_COPY.allowButton} onPress={() => allowSteps().catch(() => {})} />
        </>
      ) : (
        <Text style={styles.note}>
          {status === 'denied'
            ? STEPS_COPY.offHint
            : status === 'unavailable'
              ? STEPS_COPY.unavailableHint
              : GARDEN_COPY.stepsHint}
        </Text>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  day: { ...font.medium, fontSize: 16, color: colors.textPrimary },
  count: { ...font.bold, fontSize: 16, color: colors.textPrimary },
  note: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginVertical: 12 },
});
```

## src/components/garden/WorkoutSheet.tsx

```tsx
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { colors, elevation } from '@/constants/colors';
import { WORKOUT_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { workoutGrowthLine } from '@/domain/garden/badges';
import type { WorkoutType } from '@/types';

const TYPES: WorkoutType[] = ['walk', 'run', 'yoga', 'gym', 'cycle', 'sport', 'dance', 'other'];
const PER_ROW = 3; // keeps every label on one line, even on small phones

interface Props {
  visible: boolean;
  /** Prefill when editing an existing workout. */
  initial?: { type: WorkoutType; minutes: number } | null;
  /** All-time workout minutes before this one, so the sheet can say what it will grow. */
  minutesSoFar?: number;
  onSave: (type: WorkoutType, minutes: number) => void;
  onClose: () => void;
}

/** The two-tap workout log: what you did, roughly how long. Never how to do it. */
export function WorkoutSheet({ visible, initial, minutesSoFar = 0, onSave, onClose }: Props) {
  const [type, setType] = useState<WorkoutType | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setType(initial?.type ?? null);
      setMinutes(initial?.minutes ?? null);
    }
  }, [visible, initial]);

  const rows = Array.from({ length: Math.ceil(TYPES.length / PER_ROW) }, (_, i) =>
    TYPES.slice(i * PER_ROW, (i + 1) * PER_ROW),
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title} accessibilityRole="header">{WORKOUT_COPY.title}</Text>
          <Text style={styles.subtitle}>{WORKOUT_COPY.subtitle}</Text>
          {rows.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((t) => (
                <Chip key={t} label={WORKOUT_COPY.types[t]} selected={type === t} onPress={() => setType(t)} />
              ))}
            </View>
          ))}

          <Text style={styles.label}>{WORKOUT_COPY.lengthTitle}</Text>
          <View style={styles.row}>
            {WORKOUT_COPY.durations.map((m) => (
              <Chip
                key={m}
                label={WORKOUT_COPY.durationChip(m)}
                accessibilityLabel={WORKOUT_COPY.durationA11y(m)}
                selected={minutes === m}
                onPress={() => setMinutes(m)}
              />
            ))}
          </View>

          {type && minutes ? (
            <View style={styles.growth}>
              <Icon name="sprout" size={20} color={colors.primary} />
              <Text style={styles.growthText}>{workoutGrowthLine(minutesSoFar, minutes)}</Text>
            </View>
          ) : null}

          <View style={{ height: 8 }} />
          <Button
            label={initial ? WORKOUT_COPY.update : WORKOUT_COPY.save}
            disabled={!type || !minutes}
            onPress={() => type && minutes && onSave(type, minutes)}
          />
          <Button label={WORKOUT_COPY.cancel} variant="link" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    paddingTop: 10,
    paddingBottom: 32,
    ...elevation.raised,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.divider, marginBottom: 14 },
  title: { ...font.bold, fontSize: 24, color: colors.textPrimary },
  subtitle: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginTop: 4, marginBottom: 14 },
  label: { ...font.semibold, fontSize: 15, color: colors.textSecondary, marginTop: 8, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  growth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 12,
    marginTop: 6,
  },
  growthText: { ...font.medium, flex: 1, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
});
```

## src/components/park/Motion.tsx

```tsx
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';

/**
 * Single shared clock on the UI thread (counts seconds, 0 to 3600, then restarts). Every gentle
 * motion in the park derives from it with phase offsets. An hour long because at the restart any
 * motion whose period doesn't divide it jumps, and sways of a few seconds rarely do.
 */
export function useParkClock(): SharedValue<number> {
  const reduce = useReduceMotion();
  const clock = useSharedValue(0);

  useEffect(() => {
    if (reduce) {
      clock.value = 0;
      return;
    }
    clock.value = 0;
    clock.value = withRepeat(
      withTiming(3600, { duration: 3600000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [clock, reduce]);

  return clock;
}

/** A squash-and-stretch pop when `dep` grows, that is, when something was logged for this object. */
export function usePopOnChange(dep: number) {
  const reduce = useReduceMotion();
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const last = React.useRef(dep);

  useEffect(() => {
    const grew = dep > last.current;
    last.current = dep;
    if (!grew || reduce) return;
    scaleX.value = withSequence(
      withTiming(1.1, { duration: 110 }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
    scaleY.value = withSequence(
      withTiming(0.92, { duration: 110 }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
  }, [dep, reduce, scaleX, scaleY]);

  return useAnimatedStyle(() => ({
    transform: [{ scaleX: scaleX.value }, { scaleY: scaleY.value }],
  }));
}

/** Gentle sway wrapper driven by the shared UI clock. */
export function SwayWrap({
  clock,
  degrees,
  periodSec,
  phase = 0,
  originY = 'bottom',
  style,
  testID,
  children,
}: {
  clock: SharedValue<number>;
  degrees: number;
  periodSec: number;
  phase?: number;
  originY?: 'bottom' | 'center';
  style?: object;
  testID?: string;
  children: React.ReactNode;
}) {
  const reduce = useReduceMotion();
  const animStyle = useAnimatedStyle(() => {
    if (reduce || degrees === 0) return { transform: [{ rotate: '0deg' }] };
    const angle = Math.sin(((clock.value + phase) / periodSec) * Math.PI * 2) * degrees;
    return { transform: [{ rotate: `${angle}deg` }] };
  });

  return (
    <Animated.View
      testID={testID}
      pointerEvents="none"
      style={[
        styles.abs,
        style,
        { transformOrigin: originY === 'bottom' ? '50% 90%' : '50% 50%' },
        animStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
```

## src/components/park/Pip.tsx

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, parkColors } from '@/constants/colors';
import { PIP_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import type { ParkLayout } from '@/domain/park/layout';
import { pipSpot, type PipMood, type PipNotice } from '@/domain/park/pip';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import type { ParkLight } from './ParkLayers';
import { PipArt } from './art/PipArt';

const SAY_MS = 4500;
const BUBBLE_W = 210;
const MIN_TARGET = 48;

interface Props {
  clock: SharedValue<number>;
  layout: ParkLayout;
  light: ParkLight;
  mood: PipMood;
  /** What Pip can mention; each tap says the next one. */
  notices: PipNotice[];
}

/**
 * Pip stands by the tree and breathes gently on the shared clock. A tap shows a short speech
 * bubble with something it noticed; the bubble fades after a few seconds. A fresh log makes Pip hop.
 */
export function Pip({ clock, layout, light, mood, notices }: Props) {
  const reduce = useReduceMotion();
  const { feet, size } = pipSpot(layout);
  const [said, setSaid] = useState<number | null>(null);
  const turn = useRef(0);
  const hop = useSharedValue(0);

  useEffect(() => {
    if (said === null) return;
    const t = setTimeout(() => setSaid(null), SAY_MS);
    return () => clearTimeout(t);
  }, [said]);

  useEffect(() => {
    if (mood !== 'cheer' || reduce) return;
    hop.value = withSequence(withTiming(-14, { duration: 180 }), withSpring(0, { damping: 10, stiffness: 200 }));
  }, [hop, mood, reduce]);

  const sleepy = mood === 'sleepy';
  const bodyStyle = useAnimatedStyle(() => {
    const breathe = reduce ? 0 : Math.sin(clock.value * (sleepy ? 1.2 : 2.2)) * 0.025;
    return { transform: [{ translateY: hop.value }, { scaleY: 1 + breathe }, { scaleX: 1 - breathe / 2 }] };
  });

  const artH = (size * 124) / 120;
  const box = Math.max(size, MIN_TARGET);
  const left = feet[0] - box / 2;
  const top = feet[1] - artH * 0.94;
  const line = said === null ? null : PIP_COPY.lines[notices[said % notices.length]!];
  const bubbleLeft = Math.min(Math.max(feet[0] - BUBBLE_W * 0.7, 12), layout.worldW - 12 - BUBBLE_W);

  return (
    <>
      <Pressable
        testID="pip"
        accessibilityRole="button"
        accessibilityLabel={PIP_COPY.label}
        accessibilityHint={PIP_COPY.hint}
        onPress={() => {
          const i = turn.current;
          turn.current += 1;
          setSaid(i);
          AccessibilityInfo.announceForAccessibility(PIP_COPY.lines[notices[i % notices.length]!]);
        }}
        style={[styles.abs, { left, top, width: box, height: Math.max(artH, MIN_TARGET) }]}
      >
        <Animated.View
          testID={`pip-${mood}`}
          style={[styles.art, { width: box, height: artH, transformOrigin: '50% 94%' }, bodyStyle]}
        >
          <PipArt mood={mood} light={light} size={size} />
        </Animated.View>
      </Pressable>

      {line && (
        <View
          testID="pip-says"
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.bubble, { left: bubbleLeft, bottom: layout.worldH - top + 10, width: BUBBLE_W }]}
        >
          <Text style={styles.line}>{line}</Text>
          <View style={[styles.tail, { left: feet[0] - bubbleLeft - 7 }]} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  art: { alignItems: 'center' },
  bubble: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderColor: parkColors.outline,
    borderWidth: 2.5,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: parkColors.outline,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  line: { ...font.bold, fontSize: 14, lineHeight: 19, color: colors.textPrimary },
  tail: {
    position: 'absolute',
    bottom: -9,
    width: 14,
    height: 14,
    backgroundColor: colors.surface,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: parkColors.outline,
    transform: [{ rotate: '45deg' }],
  },
});
```

## src/components/park/art/PipArt.tsx

```tsx
import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { gardenColors, parkColors, stateColors } from '@/constants/colors';
import type { PipMood } from '@/domain/park/pip';
import type { ParkLight } from '../ParkLayers';

const S = parkColors.outline;

/**
 * Pip: a round honey seed with a two-leaf sprout. Cheering opens its mouth and sparkles; in the
 * rain the sprout becomes a big leaf umbrella; asleep its eyes close and a few z's drift up.
 */
export const PipArt = React.memo(function PipArt({
  mood,
  light,
  size = 56,
}: {
  mood: PipMood;
  light: ParkLight;
  size?: number;
}) {
  const c = parkColors.pip;
  const f = parkColors.foliage[light === 'night' ? 'day' : light];

  return (
    <Svg width={size} height={(size * 124) / 120} viewBox="0 0 120 124">
      <Ellipse cx="60" cy="116" rx="34" ry="6" fill={parkColors.shadow} />
      <G stroke={S} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        {mood === 'rainy' ? (
          <>
            <Path d="M60 40 L60 16" fill="none" />
            <Path d="M10 30 C26 -2 94 -2 110 30 C96 24 74 22 60 28 C46 22 24 24 10 30 Z" fill={f.leaf} />
            <Path d="M8 50 l-3 8 M112 46 l-3 8 M20 66 l-3 8" stroke={gardenColors.rain} fill="none" />
          </>
        ) : (
          <>
            <Path d="M60 38 C60 30 60 24 60 16" fill="none" />
            <Path d="M60 22 C50 10 36 10 32 20 C42 28 54 28 60 22 Z" fill={f.leaf} />
            <Path d="M60 18 C70 4 86 4 90 14 C80 24 66 24 60 18 Z" fill={f.light} />
          </>
        )}
        <Ellipse cx="44" cy="112" rx="9" ry="5" fill={c.feet} />
        <Ellipse cx="76" cy="112" rx="9" ry="5" fill={c.feet} />
        <Path d="M60 36 C90 36 106 58 106 80 C106 102 88 112 60 112 C32 112 14 102 14 80 C14 58 30 36 60 36 Z" fill={c.body} />
      </G>
      <Path d="M34 58 C40 48 50 44 58 44" stroke={c.shine} strokeWidth="5" strokeLinecap="round" fill="none" />

      {mood === 'sleepy' ? (
        <>
          <Path d="M39 78 Q45 84 51 78 M69 78 Q75 84 81 78" stroke={S} strokeWidth="3" strokeLinecap="round" fill="none" />
          <Path
            d="M92 34 h10 l-10 12 h10 M104 14 h7 l-7 8 h7"
            stroke={parkColors.moon}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <Ellipse cx="45" cy="76" rx="5.5" ry="7.5" fill={S} />
          <Ellipse cx="75" cy="76" rx="5.5" ry="7.5" fill={S} />
          <Circle cx="47" cy="73" r="2.2" fill={parkColors.shimmer} />
          <Circle cx="77" cy="73" r="2.2" fill={parkColors.shimmer} />
        </>
      )}

      <Ellipse cx="34" cy="88" rx="7.5" ry="4.5" fill={c.cheek} />
      <Ellipse cx="86" cy="88" rx="7.5" ry="4.5" fill={c.cheek} />

      {mood === 'cheer' && (
        <>
          <Path d="M49 87 Q60 104 71 87 Z" fill={stateColors.activated.ink} stroke={S} strokeWidth="3" strokeLinejoin="round" />
          <Path
            d="M14 34 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z M104 52 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z"
            fill={parkColors.firefly}
            stroke={S}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </>
      )}
      {(mood === 'happy' || mood === 'rainy') && (
        <Path d="M52 89 Q60 97 68 89" stroke={S} strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
      {mood === 'sleepy' && <Ellipse cx="60" cy="92" rx="3.5" ry="2.5" fill={S} />}
    </Svg>
  );
});
```

## src/components/Button.tsx

```tsx
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { font } from '@/constants/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'link';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * The only button in the app. Three kinds, each unmistakable:
 * - primary   — solid deep green, white label (the one main action on a screen)
 * - secondary — white with a 2px green outline (the alternative)
 * - link      — underlined green text, still a full 44pt touch target
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const isDisabled = !!(disabled || loading);

  const style = [
    styles.base,
    size === 'sm' && styles.sm,
    variant === 'primary' && styles.primary,
    variant === 'primary' && pressed && !isDisabled && styles.primaryPressed,
    variant === 'secondary' && styles.secondary,
    variant === 'secondary' && pressed && !isDisabled && styles.secondaryPressed,
    variant === 'link' && styles.link,
    variant === 'link' && pressed && !isDisabled && styles.linkPressed,
    isDisabled && styles.disabled,
  ];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      style={style}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
        ) : (
          <Text
            style={[
              styles.label,
              size === 'sm' && styles.labelSm,
              variant === 'primary' && { color: colors.onPrimary },
              variant !== 'primary' && { color: colors.primary },
              variant === 'link' && styles.linkLabel,
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 999, paddingVertical: 15, paddingHorizontal: 22, minHeight: 54, justifyContent: 'center' },
  sm: { paddingVertical: 10, minHeight: 44 },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: colors.primary },
  secondaryPressed: { backgroundColor: colors.surface },
  link: { backgroundColor: 'transparent', minHeight: 44, paddingVertical: 10 },
  linkPressed: { opacity: 0.6 },
  disabled: { opacity: 0.45 },
  inner: { alignItems: 'center', justifyContent: 'center' },
  label: { ...font.bold, fontSize: 16 },
  labelSm: { fontSize: 15 },
  linkLabel: { ...font.semibold, textDecorationLine: 'underline' },
});
```

## src/components/Chip.tsx

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/constants/colors';
import { font } from '@/constants/typography';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

/** A selectable pill in a row of choices. Outlined until chosen, solid green once chosen. */
export function Chip({ label, selected, onPress, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  selected: { backgroundColor: colors.primary },
  label: { ...font.semibold, fontSize: 14, color: colors.primary },
  labelSelected: { color: colors.onPrimary },
});
```

## src/components/Icon.tsx

```tsx
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

/** A line icon. Always decorative: the control or text beside it carries the label. */
export function Icon({ name, size = 22, color = colors.primary }: Props) {
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
```

## src/components/MoodTile.tsx

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, stateColors } from '@/constants/colors';
import { MOOD_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { Icon, type IconName } from '@/components/Icon';
import type { UserState } from '@/types';

const MOOD_ICON: Record<UserState, IconName> = {
  overloaded: 'weather-night',
  recovering: 'sprout-outline',
  regulated: 'white-balance-sunny',
  activated: 'lightning-bolt-outline',
};

interface Props {
  mood: UserState;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}

/** One tap = one check-in. Pastel fill, an icon in a white circle, a tick once chosen. */
export function MoodTile({ mood, onPress, selected, disabled }: Props) {
  const c = stateColors[mood];
  const copy = MOOD_COPY[mood];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={copy.label}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: c.soft, borderColor: selected ? c.ink : 'transparent' },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <Icon name={MOOD_ICON[mood]} size={20} color={c.ink} />
        </View>
        {selected ? (
          <Icon name="check" size={20} color={c.ink} />
        ) : (
          <Text style={[styles.flavor, { color: c.ink }]}>{copy.flavor}</Text>
        )}
      </View>
      <Text style={[styles.label, { color: c.ink }]}>{copy.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minHeight: 112, borderRadius: 20, borderWidth: 2, padding: 14, justifyContent: 'space-between' },
  pressed: { transform: [{ scale: 0.97 }] },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flavor: { ...font.medium, fontSize: 13 },
  label: { ...font.bold, fontSize: 16, lineHeight: 21, marginTop: 10 },
});
```

## src/constants/colors.ts

```ts
/**
 * MoveKind design tokens — "Sage". The single source of truth for color.
 *
 * Misty sage canvas, white cards with faint green rings, deep forest-green actions,
 * four clearly different mood colours. Calm, but every action is solid or clearly outlined.
 *
 * Rules:
 * - Reference SEMANTIC tokens (`colors.primary`, `colors.textSecondary`, …), never raw hex.
 * - Text pairs clear WCAG AA 4.5:1; non-text UI/graph pairs clear 3:1.
 *   Enforced by __tests__/colors.test.ts — add new pairs there when you add tokens.
 * - Sage (#599E7C) is decoration only: white text on it fails 4.5:1, so actions use `primary`.
 * - Mood color comes from `stateColors[state]` (soft / ink / accent / tint), never ad hoc.
 */

export const colors = {
  // ---- Surfaces ----------------------------------------------------------
  background: '#F6FAF5',        // app canvas — misty sage white
  surface: '#FFFFFF',           // cards / raised surfaces
  surfaceSecondary: '#EEF4EF',  // inputs, wells, nested surfaces
  inverse: '#2D322E',           // the dark note card
  onInverse: '#FFFFFF',
  onInverseSoft: 'rgba(255,255,255,0.12)', // icon circle on the dark note card

  // ---- Text --------------------------------------------------------------
  textPrimary: '#181D1A',       // 16:1 on background
  textSecondary: '#404943',     // 8.8:1
  textMuted: '#5A635D',         // 5.9:1, still AA, never faint
  onPrimary: '#FFFFFF',

  // ---- Actions -----------------------------------------------------------
  primary: '#20684A',           // deep forest green — buttons, active tab, links (6.7:1 with white)
  primaryPressed: '#185239',
  primarySoft: '#DCEFE3',       // tinted surface (active tab pill, soft highlights)
  secondary: '#DCEFE3',
  secondaryText: '#20684A',
  sage: '#599E7C',              // decoration only (icons on soft fills, dots); never behind text

  // ---- Lines & elevation -------------------------------------------------
  border: '#BFC9C1',            // decorative card edges only — never the sole cue for a control
  ring: 'rgba(89,158,124,0.16)', // the faint green ring around cards
  divider: '#E5E9E4',
  shadow: '#244434',
  scrim: 'rgba(24,29,26,0.35)', // dims the screen behind a bottom sheet

  // ---- Status ------------------------------------------------------------
  success: '#2F7A52',
  warning: '#8A5A12',
  error: '#A8443A',
  info: '#2F6596',
} as const;

export type ColorName = keyof typeof colors;

/**
 * Per-mood color sets. Four distinct hues so no two moods can be confused.
 * - `soft`  : tile / surface fill
 * - `ink`   : text and borders on `soft` (and a ≥3:1 outline on the canvas)
 * - `accent`: fill that carries white text; also readable as text on the canvas
 * - `tint`  : flowers, dots — ≥3:1 on white
 */
export const stateColors = {
  overloaded: { soft: '#E3E5FA', ink: '#363C8C', accent: '#4C54B6', tint: '#6F78D8' },
  recovering: { soft: '#D5EEE0', ink: '#1F5C3A', accent: '#2F7A52', tint: '#3F9468' },
  regulated:  { soft: '#FBEBC4', ink: '#6B4A0E', accent: '#8A5A12', tint: '#B07A1C' },
  activated:  { soft: '#FAD9D1', ink: '#8A3220', accent: '#A8443A', tint: '#D0573F' },
} as const;

export type CapacityState = keyof typeof stateColors;

/**
 * The garden illustration (src/components/garden/Garden.tsx). Decorative only: no text
 * or control ever sits on these, and the garden has a spoken summary, so they are exempt
 * from the contrast pairs. Mood flowers use `stateColors[mood].tint`.
 */
export const gardenColors = {
  sky: '#E4F1EE',
  skyLow: '#F3F8EC',
  dawnSky: '#FBDCCB',
  dawnLow: '#FFF1E2',
  duskSky: '#F2C29C',
  duskLow: '#E9D6EE',
  sunDusk: '#F6A86B',
  rainSky: '#C6D4CF',
  rainLow: '#E3EBE7',
  rainCloud: '#A9BBB5',
  rain: '#7FA6BC',
  mist: '#FFFFFF',
  skyRest: '#26332C',
  skyRestLow: '#3A4A40',
  star: '#F4F1E8',
  sun: '#FFE08F',
  sunGlow: '#FFF2C7',
  moon: '#F6E7B5',
  cloud: '#FFFFFF',
  hillBack: '#BFE3CC',
  hillFront: '#9ED3B2',
  hillBackRest: '#3F5A4A',
  hillFrontRest: '#4C6B57',
  grass: '#4E9A6F',
  stream: '#A9D8EE',
  streamDeep: '#6BB6D9',
  trunk: '#9A7B5A',
  leaf: '#5FB585',
  leafLight: '#8ED3A8',
  blossom: '#F6C1C9',
  fruit: '#EE7A63',
  bird: '#F2B84B',
  birdWing: '#E0A13A',
  duck: '#F2D36B',
  beak: '#EE7A63',
  flowerHeart: '#FFE08A',
} as const;

/** Soft, consistent elevation: a faint sage-tinted shadow, never a hard drop shadow. */
export const elevation = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  raised: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
} as const;

type ParkLight = 'dawn' | 'day' | 'dusk' | 'night' | 'rain';

/**
 * The full-screen cartoon park (src/components/park). Decorative only, like `gardenColors`.
 * Tuned for a bright, friendly vector world with bold hero outlines (`outline`) and soft ground shadows (`shadow`).
 */
export const parkColors: {
  sky: Record<ParkLight, { top: string; low: string }>;
  far: Record<ParkLight, string>;
  mid: Record<ParkLight, string>;
  ground: Record<ParkLight, { back: string; front: string; fore: string }>;
  path: Record<ParkLight, string>;
  pathBank: Record<ParkLight, string>;
  river: Record<ParkLight, { water: string; flow: string; bank: string }>;
  /** Tree crowns: shade underneath, leaf, and the light catching the top. */
  foliage: Record<ParkLight, { shade: string; leaf: string; light: string }>;
  soil: Record<ParkLight, string>;
  stone: Record<ParkLight, string>;
  /** The rocks at the river's spring: darker than `stone`, so they can't read as a cloud. */
  rock: Record<ParkLight, { base: string; light: string }>;
  hammock: { cloth: string; stripe: string };
  /** `far` is the two legs on the far side, a shade darker so the fawn reads as standing on four. */
  fawn: { body: string; far: string; under: string; antler: string; spot: string; nose: string };
  rabbit: { body: string; earInner: string; nose: string };
  /** Pip, the honey-coloured seed who lives in the park. */
  pip: { body: string; shine: string; feet: string; cheek: string };
  /** Rosy cheeks on the park's creatures. */
  blush: string;
  /** Washes the daytime scene toward each light (day needs none). */
  tint: Record<Exclude<ParkLight, 'day'>, { color: string; opacity: number }>;
  mist: Record<ParkLight, number>;
  sun: { dawn: string; day: string; dusk: string };
  moon: string;
  star: string;
  firefly: string;
  shimmer: string;
  cloud: string;
  mistTint: string;
  outline: string;
  shadow: string;
} = {
  sky: {
    dawn: { top: '#B6D0F7', low: '#FFE4D6' },
    day: { top: '#89CFF8', low: '#DCF2FF' },
    dusk: { top: '#6D68A8', low: '#F7B08A' },
    night: { top: '#142038', low: '#263B5E' },
    rain: { top: '#A8BFC9', low: '#DAE6EC' },
  },
  far: { dawn: '#8FD694', day: '#7ED987', dusk: '#689E70', night: '#264D3E', rain: '#84B593' },
  mid: { dawn: '#6CC476', day: '#59C768', dusk: '#528B5A', night: '#1F4033', rain: '#6BA07B' },
  ground: {
    dawn: { back: '#63C16D', front: '#4FB45B', fore: '#3E9C4A' },
    day: { back: '#62C96B', front: '#4DB857', fore: '#399E43' },
    dusk: { back: '#509658', front: '#42824A', fore: '#346B3B' },
    night: { back: '#244A3B', front: '#1E3F32', fore: '#173328' },
    rain: { back: '#58AD68', front: '#479956', fore: '#388246' },
  },
  path: { dawn: '#EDE2C8', day: '#F5EBD4', dusk: '#C9BFA8', night: '#4A5752', rain: '#D1CABB' },
  pathBank: { dawn: '#47A352', day: '#42A84B', dusk: '#397340', night: '#1A362B', rain: '#3E8A4C' },
  river: {
    dawn: { water: '#7CC6F2', flow: '#E6F5FF', bank: '#3D964E' },
    day: { water: '#58BDF6', flow: '#E3F6FF', bank: '#389C49' },
    dusk: { water: '#6A9BC7', flow: '#DCEBFA', bank: '#326B3E' },
    night: { water: '#345E85', flow: '#7AA6CC', bank: '#16332A' },
    rain: { water: '#6CA9CC', flow: '#D6EBF7', bank: '#357F46' },
  },
  foliage: {
    dawn: { shade: '#2E9448', leaf: '#48B862', light: '#7CE08F' },
    day: { shade: '#279B43', leaf: '#44C45E', light: '#7AE88F' },
    dusk: { shade: '#2B753D', leaf: '#3E9452', light: '#66B878' },
    night: { shade: '#16382B', leaf: '#214F3D', light: '#326B54' },
    rain: { shade: '#2D8547', leaf: '#44A660', light: '#6EC786' },
  },
  soil: { dawn: '#8A624A', day: '#91674C', dusk: '#6E4E3A', night: '#382B24', rain: '#75533E' },
  stone: { dawn: '#E3DDD3', day: '#ECE6DC', dusk: '#BDB5A8', night: '#575C5C', rain: '#C7C3BA' },
  rock: {
    dawn: { base: '#9C9A8E', light: '#BDBBAE' },
    day: { base: '#A3A296', light: '#C6C4B7' },
    dusk: { base: '#7F7C75', light: '#9C9991' },
    night: { base: '#3F4645', light: '#525A58' },
    rain: { base: '#8E8F87', light: '#ABACA3' },
  },
  hammock: { cloth: '#FFE299', stripe: '#FF8A65' },
  fawn: {
    body: '#F08A35',
    far: '#C9692A',
    under: '#FFF1E0',
    antler: '#8A4A28',
    spot: '#FFFFFF',
    nose: '#4A2818',
  },
  rabbit: {
    body: '#ECEFF4',
    earInner: '#F6C1C9',
    nose: '#EE7A63',
  },
  pip: { body: '#FFD89A', shine: '#FFF1D6', feet: '#E8B96A', cheek: '#F6A9B4' },
  blush: '#F6A9B4',
  tint: {
    dawn: { color: '#FFA882', opacity: 0.12 },
    dusk: { color: '#5E3D7A', opacity: 0.22 },
    night: { color: '#0A1526', opacity: 0.45 },
    rain: { color: '#6E8894', opacity: 0.22 },
  },
  mist: { dawn: 0.3, day: 0.2, dusk: 0.25, night: 0.12, rain: 0.4 },
  sun: { dawn: '#FFE082', day: '#FFF0A8', dusk: '#FFB76B' },
  moon: '#FFF0B8',
  star: '#FFFDF5',
  firefly: '#FFE875',
  shimmer: '#FFFFFF',
  cloud: '#FFFFFF',
  mistTint: '#FFFFFF',
  outline: '#231F20',
  shadow: 'rgba(24, 52, 34, 0.18)',
};
```

## src/constants/typography.ts

```ts
/**
 * Plus Jakarta Sans, loaded once in App.tsx. Custom fonts ignore `fontWeight` on Android,
 * so every text style picks a weight by family instead: `...font.bold`, never `fontWeight`.
 */
export const fontFamilies = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const font = {
  regular: { fontFamily: fontFamilies.regular },
  medium: { fontFamily: fontFamilies.medium },
  semibold: { fontFamily: fontFamilies.semibold },
  bold: { fontFamily: fontFamilies.bold },
  extrabold: { fontFamily: fontFamilies.extrabold },
} as const;
```

## src/constants/copy.ts

```ts
import type { UserState, WorkoutType } from '@/types';

export const ERROR_FALLBACK = {
  title: 'Something needed a pause',
  body: "The app hit a snag, and it's nothing you did. Your progress is safe, and a fresh start is one tap away.",
  action: 'Start fresh',
} as const;

/** The four moods. `flavor` is the small word in the tile's corner; every mood is equally welcome. */
export const MOOD_COPY: Record<UserState, { label: string; flavor: string }> = {
  overloaded: { label: 'Running on empty', flavor: 'rest' },
  recovering: { label: 'A bit low', flavor: 'gentle' },
  regulated: { label: 'Steady', flavor: 'calm' },
  activated: { label: 'Buzzing', flavor: 'bright' },
};

export const CHECKIN_COPY = {
  saveFailed: "Couldn't save that. Tap to try again.",
} as const;

export const ONBOARDING_COPY = {
  nameTag: 'Welcome to MoveKind',
  nameTitle: 'What should we call you?',
  nameSubtitle: 'Optional. It stays on this phone, and there are no accounts.',
  namePlaceholder: 'Your name',
  reassureTitle: 'No streaks, no pressure',
  reassureBody: 'Your garden grows whenever you arrive.',
  skip: 'Skip for now',
} as const;

export const PROFILE_COPY = {
  nameLabel: 'Name',
  namePlaceholder: 'Your name',
  savedTitle: 'Saved',
  savedBody: 'Your name is updated.',
  saveFailedTitle: 'Could not save',
  dataTitle: 'Your data',
  localNote:
    "Everything you log stays on this phone. There's no account and nothing is sent to a server. Deleting the app deletes your data.",
  eraseButton: 'Erase all my data',
  eraseTitle: 'Erase all your data?',
  eraseBody: 'This deletes your garden and everything you logged on this phone. It cannot be undone.',
  eraseConfirm: 'Erase everything',
  cancel: 'Cancel',
} as const;

export function checkInPrompt(name?: string | null): string {
  return name ? `How's your energy, ${name}?` : "How's your energy?";
}

// ---- Garden ---------------------------------------------------------------

const STREAM_LINE = [
  'A gentle trickle runs through your garden',
  'Your stream is flowing',
  'Your stream is lively, with ducks paddling',
  'Your stream is full and sparkling, with ducks',
  'Your stream is brimming, ducks everywhere',
] as const;
const GRASS_LINE = ['the grass is soft and short', 'the grass is growing', 'the grass is tall and green', 'the grass is lush'] as const;
const TREE_LINE = [
  'a sprout is waiting for its first workout',
  'a sapling is growing',
  'a young tree stands tall',
  'birds sing in your tree',
  'your tree is blossoming',
  'your tree has fruit',
  'two trees bear fruit side by side',
] as const;

export const GARDEN_COPY = {
  greeting: (partOfDay: string, name?: string | null) =>
    name ? `Good ${partOfDay}, ${name}` : `Good ${partOfDay}`,
  title: 'Your garden',
  brand: 'MoveKind',
  tag: 'Garden haven',
  tagFirstWeek: 'A quiet start',
  subtitle: 'Your garden is growing',
  subtitleResting: 'Your garden rested while you were away. Welcome back.',
  welcomeTitle: 'Welcome to your beginning',
  welcomeNoStreaks: 'No daily minimums or streaks. Log what you did, whenever you like.',
  moodTitle: 'How are you feeling?',
  moodAside: 'Check-in',
  careTitle: "Today's care",
  defaultNote: 'Everything you log helps your garden grow.',
  water: 'Water',
  glasses: (n: number) => (n === 1 ? '1 glass' : `${n} glasses`),
  waterA11y: (n: number) => `Add a glass of water. ${n === 1 ? '1 glass' : `${n} glasses`} today.`,
  undoGlass: 'Undo last glass',
  glassesUnit: (n: number) => (n === 1 ? 'glass' : 'glasses'),
  waterTap: 'Tap to add one',
  waterNote: 'Nourished',
  workoutUnit: 'Any movement',
  workoutToday: (minutes: number) => `${minutes} min`,
  workoutTodayUnit: 'today',
  workoutNote: 'Tree growing',
  stepsUnit: 'steps',
  workout: 'Workout',
  logOne: 'Log one',
  workoutA11y: 'Log a workout',
  steps: 'Steps',
  stepsSoon: 'Arrive soon',
  stepsHint: 'Your phone will count steps for you in the next update.',
  todayMood: (label: string) => `Today: ${label}`,
  changeMood: 'Change',
  todayWorkouts: 'Today',
  /** What a screen reader says about the garden. Never negative, whatever the state. */
  a11ySummary(s: { stream: number; grass: number; tree: number; flowers: unknown[]; resting: boolean; weather?: 'clear' | 'rain' }): string {
    const flowers =
      s.flowers.length === 0 ? '' : s.flowers.length === 1 ? ' One flower blooms.' : ` ${s.flowers.length} flowers bloom.`;
    const rest = s.resting ? 'Your garden is resting under the moon. ' : '';
    const rain = s.weather === 'rain' ? 'Gentle rain is falling and the garden is drinking it in. ' : '';
    return `${rain}${rest}${STREAM_LINE[s.stream]}, ${GRASS_LINE[s.grass - 1]}, and ${TREE_LINE[s.tree]}.${flowers}`;
  },
} as const;

export const WORKOUT_COPY = {
  title: 'What did you do?',
  subtitle: 'Any movement counts. Stretches, strolling, or dancing in your kitchen.',
  lengthTitle: 'About how many minutes?',
  save: 'Add to my garden',
  update: 'Save changes',
  cancel: 'Not now',
  types: {
    walk: '🚶 Walk',
    run: '🏃 Run',
    yoga: '🧘 Yoga',
    gym: '🏋️ Gym',
    cycle: '🚴 Cycle',
    sport: '⚽ Sport',
    dance: '💃 Dance',
    other: '✨ Other',
  } as Record<WorkoutType, string>,
  names: {
    walk: 'Walk', run: 'Run', yoga: 'Yoga', gym: 'Gym', cycle: 'Cycle', sport: 'Sport', dance: 'Dance', other: 'Other',
  } as Record<WorkoutType, string>,
  durations: [10, 20, 30, 45, 60] as const,
  minutes: (m: number) => (m >= 60 ? '1 hr+' : `${m} min`),
  /** Short chip label; the question above says "minutes". */
  durationChip: (m: number) => (m >= 60 ? '60+' : String(m)),
  durationA11y: (m: number) => (m >= 60 ? 'An hour or more' : `${m} minutes`),
  entry: (type: WorkoutType, m: number) => `${WORKOUT_COPY.names[type]} · ${WORKOUT_COPY.minutes(m)}`,
  edit: 'Edit',
  delete: 'Delete',
  editA11y: (type: WorkoutType, m: number) => `Edit ${WORKOUT_COPY.entry(type, m)}`,
  deleteA11y: (type: WorkoutType, m: number) => `Delete ${WORKOUT_COPY.entry(type, m)}`,
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** The Changes tab. Ups are celebrated; quieter weeks are named gently and never counted. */
export const CHANGES_COPY = {
  tag: 'Your garden over time',
  title: 'Changes',
  subtitle: 'Gentle moments and growth over time.',
  paceNote: 'Every pace is welcome here. Growth happens quietly beneath the surface.',
  linesTitle: 'This week',
  welcome: 'Your first week. Everything you log from here helps your garden grow.',
  stepsUp: (perDay: number) => `You walked about ${perDay.toLocaleString()} more steps a day than last week.`,
  stepsSame: 'Your steps are as steady as last week.',
  stepsQuieter: 'A gentler week for walking. Your grass grows back every morning.',
  workoutsUp: (n: number, more: number) =>
    `You logged ${n} ${plural(n, 'workout', 'workouts')} this week, ${more} more than last week.`,
  workoutsSame: 'Same number of workouts as last week. Steady counts.',
  workoutsQuieter: 'A quieter week for workouts. Your tree keeps everything it has grown.',
  waterUp: 'You drank more water this week than last.',
  waterSame: 'Your water is as steady as last week.',
  waterQuieter: 'A lighter week for water. Your stream keeps flowing.',
  checkinsUp: (n: number) => `You checked in on ${n} ${plural(n, 'day', 'days')} this week, more than last week.`,
  checkinsSame: 'You checked in as often as last week.',
  checkinsQuieter: 'A quieter week for check-ins. Every flower you planted is still blooming.',
  compareTitle: 'Look how it has grown',
  then: 'A month ago',
  now: 'Today',
  flowerbedTitle: 'How your weeks felt',
  weekOf: (d: Date) => `Week of ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`,
  emptyWeek: 'No flowers this week',
} as const;

export const REMINDER_COPY = {
  body: 'Your garden is here whenever you are. A glass of water counts.',
} as const;

/** The Me tab. */
export const ME_COPY = {
  tag: 'Me',
  hello: (name?: string | null) => (name ? `Hello, ${name}` : 'Hello'),
  subtitle: 'Your personal quiet corner.',
  nameTitle: 'What should we call you?',
  save: 'Save',
  saving: 'Saving',
  localBadge: 'Local and private',
  philosophyTitle: 'MoveKind philosophy',
  philosophy:
    'Movement is for joy, not for penance. Take your time, rest when you need, and let your garden flourish at its own pace.',
  reminderTitle: 'Daily reminder',
  reminderLabel: 'Daily reminder at 9am',
  reminderBody: 'One gentle note each morning. Off unless you turn it on.',
  reminderDenied: "Notifications are off for MoveKind in your phone's settings, so the reminder can't be sent.",
} as const;

/** The one screen after the name: how the garden grows. */
export const GARDEN_INTRO_COPY = {
  tag: 'Your garden',
  title: 'A garden that grows with you',
  subtitle: 'Everything you do gently nurtures this space.',
  lines: [
    { icon: 'water-outline', text: 'Water makes the stream flow', detail: 'Every glass makes it a little livelier.' },
    { icon: 'shoe-print', text: 'Steps grow the grass', detail: 'Walks carpet the hills in green.' },
    { icon: 'tree-outline', text: 'Workouts grow the tree', detail: 'Any movement you enjoy brings leaves, blossom and fruit.' },
    { icon: 'flower-outline', text: 'Each mood check-in plants a flower', detail: 'Every feeling adds a colour to the meadow.' },
  ],
  sanctuary: 'Gentle sanctuary',
  promise: 'Nothing ever wilts. If you are away, your garden simply rests until you are back.',
  start: 'Start my garden',
  next: 'Continue',
} as const;

/** The Steps button and its week view. Counts are shown plainly, never against a target. */
export const STEPS_COPY = {
  checking: 'Checking',
  allow: 'Tap to allow',
  allowButton: 'Allow steps',
  allowHint: 'Lets MoveKind read your step count from this phone. Steps stay on this phone.',
  off: 'Off',
  offHint: 'Step access is off. You can turn on Motion and Fitness for MoveKind in your phone settings.',
  unavailable: 'Not available',
  unavailableHint: "This phone doesn't share a step count with MoveKind.",
  weekHint: 'Opens your steps for the week',
  weekTitle: 'Your steps this week',
  weekNote: 'Every day has its own rhythm. Days with fewer steps give space for rest.',
  close: 'Close',
  day: (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long' }),
  count: (n: number) => n.toLocaleString(),
} as const;

/** Small status pills on the garden card, and captions for the then-and-now cards. */
export const BADGE_COPY = {
  resting: 'Resting under the moon',
  rain: 'Gentle rain falling',
  stream: ['Soft breeze', 'Stream flowing', 'Ducks visiting', 'Ducks visiting', 'Stream sparkling'],
  tree: ['Young sprout', 'Sapling growing', 'Young tree', 'Birds nesting', 'In blossom', 'Fruit ripening', 'Two trees thriving'],
  caption: [
    'A tiny sprout',
    'A growing sapling',
    'A young tree',
    'A tree with birds',
    'A tree in blossom',
    'A tree full of fruit',
    'Two trees, full of fruit',
  ],
  /** What logging a workout will grow (index = the stage it reaches). */
  growth: [
    '',
    'This will turn your sprout into a sapling.',
    'This will grow your sapling into a young tree.',
    'This will bring birds to your tree.',
    'This will make your tree blossom.',
    'This will bring fruit to your tree.',
    'This will grow a second tree.',
  ],
  growthMore: 'This helps your tree grow a little more.',
  growthFull: 'This keeps your two trees thriving.',
} as const;

/** Feeling unwell: rest, never a shortfall. The garden gets gentle rain that day. */
export const UNWELL_COPY = {
  toggle: 'Feeling unwell today',
  cardTitle: 'Rest is part of growing. Your garden is drinking the rain.',
  cardBody: 'No logs needed today. Rest easy.',
  subtitle: 'Today is for resting.',
} as const;

/** The full-screen park: what each object is called and opens, for taps and screen readers. */
export const PARK_COPY = {
  objects: {
    river: { label: 'River', hint: 'Opens water. Each glass makes the river livelier.' },
    tree: { label: 'Tree', hint: 'Opens the workout log. Workouts grow the tree.' },
    flowerbed: { label: 'Flowerbed', hint: 'Opens your mood check-in. Each mood plants a flower.' },
    hammock: { label: 'Hammock', hint: 'Opens sleep. Rest between the trees.' },
    path: { label: 'Grass and path', hint: 'Opens your steps. Steps grow the grass.' },
  },
  greeting: (partOfDay: string, name?: string | null) =>
    name ? `Good ${partOfDay}, ${name}` : `Good ${partOfDay}`,
  sceneLabel: 'Your park.',
} as const;

/** Pip, the seed who lives in the park. Pip only mentions what is there, and never asks for anything. */
export const PIP_COPY = {
  label: 'Pip',
  hint: 'Pip tells you something it noticed in your park.',
  lines: {
    hello: 'Hello! I like it here with you.',
    riverFull: 'The river is full and sparkly today.',
    riverAwake: 'I can hear the river trickling along.',
    treeGrowing: 'The tree feels a little taller. I checked.',
    birds: 'The birds have settled into the tree.',
    flowerToday: 'A new flower today. It suits you.',
    grassTall: 'The grass is soft and tall. Good for sitting.',
    calm: 'I am just here, enjoying the shade.',
    rainy: 'I have a leaf. We can wait out the rain together.',
    sleepy: 'Zzz. The park is resting. Nothing is lost.',
  },
} as const;

/** The river's water sheet. One drop per glass; there is never an "out of". */
export const WATER_COPY = {
  title: 'Water',
  subtitle: 'A cool sip from the river',
  add: '+1 glass',
  remove: 'Undo last glass',
  count: (n: number) => (n === 0 ? 'Nothing yet today' : n === 1 ? '1 glass today' : `${n} glasses today`),
  note: 'Drink when you are thirsty. Tea and other drinks count too.',
} as const;

export const SHEET_COPY = {
  close: 'Close',
  moodTitle: 'How are you feeling?',
  moodSubtitle: 'Each mood plants a flower.',
  stepsTitle: 'Your steps',
  stepsSubtitle: 'Steps grow the grass.',
} as const;

/** The pull-up drawer over the park: today at a glance, plain log buttons, Changes and Me. */
export const DRAWER_COPY = {
  openLabel: 'Today in your park. Opens the drawer.',
  closeLabel: 'Close the drawer',
  todayTitle: 'Today in your park',
  changesTitle: 'Changes',
  meTitle: 'You',
  rows: {
    water: { title: 'Water', action: '+1 glass' },
    workout: { title: 'Workouts', action: 'Log a workout' },
    mood: { title: 'Mood', action: 'Check in' },
    steps: { title: 'Steps', action: 'See your steps' },
  },
  noMoodYet: 'Not yet today',
  noWorkoutYet: 'Not yet today',
  minutesToday: (m: number) => `${m} min today`,
} as const;

/** Stage 1: the hammock is there, sleep logging arrives in the next update. */
export const SLEEP_SOON_COPY = {
  title: 'The hammock',
  body: 'Rest between the trees. Logging your sleep arrives in the next update.',
} as const;

/** The first-visit tour: one gentle line per park object, then the drawer. */
export const TOUR_COPY = {
  steps: {
    flowerbed: 'This flowerbed holds your moods. Each check-in plants a flower.',
    tree: 'Workouts grow this tree: leaves, then birds, blossom and fruit.',
    river: 'Water fills the river. Each glass makes it a little livelier.',
    path: 'Your steps grow the grass along this path.',
    drawer: 'Pull up from the bottom any time for today, your changes and settings.',
  },
  next: 'Next',
  done: 'Start exploring',
  skip: 'Skip the tour',
} as const;
```

## src/store/gardenStore.ts

```ts
import { create } from 'zustand';
import { db } from '@/services/db';
import { telemetry } from '@/services/telemetry';
import { friendlyErrorMessage } from '@/services/network';
import { requestStepsAccess, stepsByDay, stepsStatus, type StepsStatus } from '@/services/steps';
import { mapEnergyToState, moodToEnergy, yardMoodOf, yardMoodToEnergy } from '@/domain/checkin/moods';
import { isSameLocalDay, localDayKey, startOfLocalDay } from '@/domain/garden/days';
import type { GardenInput } from '@/domain/garden/garden';
import type { CheckIn, Meal, MealLog, SleepFeel, SleepLog, UserState, WaterLog, Workout, WorkoutType, YardMood } from '@/types';

/** Stamped on check-ins logged by the garden app (the old session engine is gone). */
export const GARDEN_VERSION = 'garden-1';

/** The meals the food sheet offers, in display order. */
export const MEALS: readonly Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/** Sleep hours are kept to the half hour, between 0 and 24. */
export function tidySleepHours(hours: number): number {
  if (!Number.isFinite(hours)) return 0;
  return Math.min(24, Math.max(0, Math.round(hours * 2) / 2));
}

const HISTORY_DAYS = 60;
/** Two weeks: this week and last, for the Changes comparison. */
const STEP_DAYS = 14;

interface GardenStoreState {
  checkIns: CheckIn[];
  water: WaterLog[];
  workouts: Workout[];
  meals: MealLog[];
  sleep: SleepLog[];
  /** Today's steps; null until the phone shares them (then the grass keeps a calm default). */
  stepsToday: number | null;
  /** Daily steps for the last two weeks, keyed by localDayKey. */
  stepsByDay: Record<string, number>;
  /** Whether the phone shares steps ('unknown' until first checked). */
  stepsStatus: StepsStatus | 'unknown';
  loaded: boolean;
  error: string | null;

  load: () => Promise<void>;
  /** Re-reads steps if access was already given. Never asks for permission. */
  refreshSteps: () => Promise<void>;
  /** Asks the phone for step access (from a tap), then reads steps. */
  allowSteps: () => Promise<void>;
  logMood: (mood: UserState) => Promise<void>;
  addGlass: () => Promise<void>;
  removeLastGlassToday: () => Promise<void>;
  addWorkout: (type: WorkoutType, minutes: number) => Promise<void>;
  updateWorkout: (id: string, patch: Partial<Pick<Workout, 'type' | 'minutes'>>) => Promise<void>;
  removeWorkout: (id: string) => Promise<void>;
  todayMood: () => UserState | null;
  /** Marks today's check-in as feeling unwell (or not). Needs a mood picked today first. */
  setUnwell: (unwell: boolean) => Promise<void>;
  todayUnwell: () => boolean;
  /** Logs today's yard mood (re-picking edits today's check-in). */
  logYardMood: (mood: YardMood) => Promise<void>;
  todayYardMood: () => YardMood | null;
  /** Which meals were logged today, in MEALS order. */
  mealsToday: () => Meal[];
  /** Makes today's meals exactly this set: adds the new ones, removes the unticked ones. */
  setMealsToday: (meals: Meal[]) => Promise<void>;
  /** This morning's sleep log, if there is one. */
  lastNightSleep: () => SleepLog | null;
  /** Logs last night's sleep (logging again this morning edits it). */
  logSleep: (hours: number, feel: SleepFeel | null) => Promise<void>;
  gardenInput: () => GardenInput;
}

const isToday = (iso: string) => isSameLocalDay(new Date(iso), new Date());

/**
 * Everything the garden grows from. Stores own the db calls (components stay thin).
 * Each log reports only *what kind* of thing was logged, never its value.
 */
export const useGardenStore = create<GardenStoreState>((set, get) => {
  // Runs a write; on failure keeps a calm message and rethrows so the UI can offer a retry.
  async function guarded<T>(op: () => Promise<T>): Promise<T> {
    try {
      const result = await op();
      set({ error: null });
      return result;
    } catch (err) {
      set({ error: friendlyErrorMessage(err) });
      throw err;
    }
  }

  return {
    checkIns: [],
    water: [],
    workouts: [],
    meals: [],
    sleep: [],
    stepsToday: null,
    stepsByDay: {},
    stepsStatus: 'unknown',
    loaded: false,
    error: null,

    load: async () => {
      try {
        const since = startOfLocalDay(new Date(), -HISTORY_DAYS).toISOString();
        const [checkIns, water, workouts, meals, sleep] = await Promise.all([
          db.checkIns.since(since),
          db.water.since(since),
          db.workouts.all(),
          db.meals.since(since),
          db.sleep.since(since),
        ]);
        set({ checkIns, water, workouts, meals, sleep, loaded: true, error: null });
      } catch (err) {
        set({ error: friendlyErrorMessage(err), loaded: true });
      }
    },

    refreshSteps: async () => {
      const status = await stepsStatus();
      if (status !== 'granted') {
        set({ stepsStatus: status, stepsToday: null, stepsByDay: {} });
        return;
      }
      const days = await stepsByDay(STEP_DAYS);
      set({ stepsStatus: status, stepsByDay: days, stepsToday: days[localDayKey(new Date())] ?? null });
    },

    allowSteps: async () => {
      await requestStepsAccess();
      await get().refreshSteps();
    },

    logMood: (mood) =>
      guarded(async () => {
        // A day is one check-in: re-picking today's mood edits it (one flower per day).
        const today = get().checkIns.find((c) => isToday(c.created_at));
        const energy_score = moodToEnergy(mood);
        if (today) {
          // Clears any yard mood, so the two pickers can never disagree about today.
          await db.checkIns.update(today.id, { energy_score, mood: undefined });
          set((s) => ({
            checkIns: s.checkIns.map((c) => (c.id === today.id ? { ...c, energy_score, mood: undefined } : c)),
          }));
        } else {
          const row = await db.checkIns.add({
            energy_score,
            sleep_quality: null,
            intention: null,
            engine_version: GARDEN_VERSION,
          });
          set((s) => ({ checkIns: [row, ...s.checkIns] }));
        }
        telemetry.capture('logged', { kind: 'mood' });
      }),

    addGlass: () =>
      guarded(async () => {
        const glass = await db.water.add();
        set((s) => ({ water: [...s.water, glass] }));
        telemetry.capture('logged', { kind: 'water' });
      }),

    removeLastGlassToday: () =>
      guarded(async () => {
        const last = [...get().water].reverse().find((w) => isToday(w.created_at));
        if (!last) return;
        await db.water.remove(last.id);
        set((s) => ({ water: s.water.filter((w) => w.id !== last.id) }));
      }),

    addWorkout: (type, minutes) =>
      guarded(async () => {
        const workout = await db.workouts.add({ type, minutes });
        set((s) => ({ workouts: [workout, ...s.workouts] }));
        telemetry.capture('logged', { kind: 'workout' });
      }),

    updateWorkout: (id, patch) =>
      guarded(async () => {
        await db.workouts.update(id, patch);
        set((s) => ({ workouts: s.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
      }),

    removeWorkout: (id) =>
      guarded(async () => {
        await db.workouts.remove(id);
        set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) }));
      }),

    setUnwell: (unwell) =>
      guarded(async () => {
        const today = get().checkIns.find((c) => isToday(c.created_at));
        if (!today) return;
        await db.checkIns.update(today.id, { unwell });
        set((s) => ({ checkIns: s.checkIns.map((c) => (c.id === today.id ? { ...c, unwell } : c)) }));
        // Deliberately no telemetry: how someone feels physically never leaves the phone.
      }),

    todayUnwell: () => !!get().checkIns.find((c) => isToday(c.created_at))?.unwell,

    todayMood: () => {
      const today = get().checkIns.find((c) => isToday(c.created_at));
      return today ? mapEnergyToState(today.energy_score) : null;
    },

    logYardMood: (mood) =>
      guarded(async () => {
        const today = get().checkIns.find((c) => isToday(c.created_at));
        const energy_score = yardMoodToEnergy(mood);
        if (today) {
          await db.checkIns.update(today.id, { energy_score, mood });
          set((s) => ({ checkIns: s.checkIns.map((c) => (c.id === today.id ? { ...c, energy_score, mood } : c)) }));
        } else {
          const row = await db.checkIns.add({
            energy_score,
            mood,
            sleep_quality: null,
            intention: null,
            engine_version: GARDEN_VERSION,
          });
          set((s) => ({ checkIns: [row, ...s.checkIns] }));
        }
        telemetry.capture('logged', { kind: 'mood' });
      }),

    todayYardMood: () => {
      const today = get().checkIns.find((c) => isToday(c.created_at));
      return today ? yardMoodOf(today) : null;
    },

    mealsToday: () => {
      const eaten = new Set(get().meals.filter((m) => isToday(m.created_at)).map((m) => m.meal));
      return MEALS.filter((m) => eaten.has(m));
    },

    setMealsToday: (meals) =>
      guarded(async () => {
        const wanted = new Set(meals);
        const todays = get().meals.filter((m) => isToday(m.created_at));
        const have = new Set(todays.map((m) => m.meal));
        const toRemove = todays.filter((m) => !wanted.has(m.meal));
        const toAdd = MEALS.filter((m) => wanted.has(m) && !have.has(m));
        try {
          for (const row of toRemove) await db.meals.remove(row.id);
          for (const meal of toAdd) await db.meals.add(meal);
        } finally {
          // Re-read, so memory matches disk even if a write in the middle failed.
          set({ meals: await db.meals.since(startOfLocalDay(new Date(), -HISTORY_DAYS).toISOString()) });
        }
        if (toAdd.length) telemetry.capture('logged', { kind: 'food' });
      }),

    lastNightSleep: () => get().sleep.find((s) => s.night_of === localDayKey(new Date())) ?? null,

    logSleep: (hours, feel) =>
      guarded(async () => {
        const tidy = tidySleepHours(hours);
        const existing = get().lastNightSleep();
        if (existing) {
          await db.sleep.update(existing.id, { hours: tidy, feel });
          set((s) => ({ sleep: s.sleep.map((r) => (r.id === existing.id ? { ...r, hours: tidy, feel } : r)) }));
        } else {
          const row = await db.sleep.add({ night_of: localDayKey(new Date()), hours: tidy, feel });
          set((s) => ({ sleep: [row, ...s.sleep] }));
        }
        telemetry.capture('logged', { kind: 'sleep' });
      }),

    gardenInput: () => {
      const { checkIns, water, workouts, stepsToday } = get();
      return { checkIns, water, workouts, stepsToday };
    },
  };
});
```

## src/types/index.ts

```ts
export type UserState = 'overloaded' | 'recovering' | 'regulated' | 'activated';

/**
 * The five moods Maple mirrors in the yard, in tile order. Stored on the check-in as `mood`;
 * `energy_score` is still written so the garden, its flowers and Changes keep working.
 */
export type YardMood = 'tired' | 'low' | 'frustrated' | 'steady' | 'buzzing';

export interface Profile {
  id: string;
  name: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  energy_score: number; // 1 to 5
  sleep_quality: 'good' | 'fair' | 'poor' | null;
  intention: string | null; // optional one-line intention set at check-in
  /** Feeling unwell today: the garden gets gentle rain. Absent on older rows. */
  unwell?: boolean;
  /** The yard mood picked. Absent on older rows: derive it from energy_score. */
  mood?: YardMood;
  engine_version: string;
  created_at: string;
}

/** One glass of water, logged with a tap. */
export interface WaterLog {
  id: string;
  created_at: string;
}

export type WorkoutType = 'walk' | 'run' | 'yoga' | 'gym' | 'cycle' | 'sport' | 'dance' | 'other';

/** A workout the user did anywhere, logged by hand: what and roughly how long. */
export interface Workout {
  id: string;
  type: WorkoutType;
  minutes: number;
  created_at: string;
}

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** One meal eaten, logged from the food bowl. Only which meal: never what or how much. */
export interface MealLog {
  id: string;
  meal: Meal;
  created_at: string;
}

export type SleepFeel = 'restless' | 'okay' | 'deep';

/** Last night's sleep, logged from Pudding. One row per morning: `night_of` is the localDayKey of the morning after. */
export interface SleepLog {
  id: string;
  night_of: string;
  hours: number;
  feel: SleepFeel | null;
  created_at: string;
}
```

## src/domain/garden/garden.ts

```ts
import type { UserState } from '@/types';
import { mapEnergyToState } from '@/domain/checkin/moods';
import { localDayKey, startOfLocalDay } from './days';

/**
 * What the garden shows, derived purely from what the user logged. No I/O, no clock:
 * `now` is a parameter, so `gardenState(input, aMonthAgo)` is the garden as it was then.
 *
 * The garden only grows or rests. Stream and grass have a floor (a trickle, short grass),
 * reset each local morning; the tree grows from all-time workout minutes and never shrinks.
 */

export interface GardenInput {
  checkIns: { energy_score: number; created_at: string; unwell?: boolean }[];
  water: { created_at: string }[];
  workouts: { minutes: number; created_at: string }[];
  stepsToday: number | null;
}

export interface GardenState {
  stream: 0 | 1 | 2 | 3 | 4;
  ducks: boolean;
  grass: 1 | 2 | 3 | 4;
  tree: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  birds: boolean;
  flowers: { day: string; mood: UserState }[];
  resting: boolean;
  /** 'rain' when today's check-in says the person feels unwell: soft rain, never decay. */
  weather: 'clear' | 'rain';
}

/** Cumulative workout minutes needed for each tree stage (sprout … second tree). */
export const TREE_STAGE_MINUTES = [0, 1, 60, 180, 360, 600, 1000] as const;

const FLOWER_DAYS = 28;
const QUIET_DAYS_BEFORE_REST = 3; // today and the two days before

function streamLevel(glasses: number): GardenState['stream'] {
  if (glasses >= 7) return 4;
  if (glasses >= 5) return 3;
  if (glasses >= 3) return 2;
  if (glasses >= 1) return 1;
  return 0;
}

function grassLevel(steps: number | null): GardenState['grass'] {
  if (steps === null || steps < 2000) return 1;
  if (steps < 5000) return 2;
  if (steps < 8000) return 3;
  return 4;
}

export function treeStageFor(minutes: number): GardenState['tree'] {
  let stage = 0;
  TREE_STAGE_MINUTES.forEach((need, i) => {
    if (minutes >= need) stage = i;
  });
  return stage as GardenState['tree'];
}

export function gardenState(input: GardenInput, now: Date): GardenState {
  const upToNow = <T extends { created_at: string }>(rows: T[]) =>
    rows.filter((r) => new Date(r.created_at) <= now);
  const water = upToNow(input.water);
  const workouts = upToNow(input.workouts);
  const checkIns = upToNow(input.checkIns);

  const todayStart = startOfLocalDay(now);
  const since = (start: Date) => (r: { created_at: string }) => new Date(r.created_at) >= start;

  const stream = streamLevel(water.filter(since(todayStart)).length);
  const tree = treeStageFor(workouts.reduce((sum, w) => sum + w.minutes, 0));

  // One flower per local day; the latest check-in that day decides its colour.
  const latestByDay = new Map<string, { at: string; energy: number }>();
  for (const c of checkIns.filter(since(startOfLocalDay(now, -(FLOWER_DAYS - 1))))) {
    const day = localDayKey(new Date(c.created_at));
    const prev = latestByDay.get(day);
    if (!prev || c.created_at > prev.at) latestByDay.set(day, { at: c.created_at, energy: c.energy_score });
  }
  const flowers = [...latestByDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, { energy }]) => ({ day, mood: mapEnergyToState(energy) }));

  // Resting means "away for a while", so a brand-new garden (nothing logged yet) is awake.
  const everything = [...water, ...workouts, ...checkIns];
  const awakeSince = since(startOfLocalDay(now, -(QUIET_DAYS_BEFORE_REST - 1)));
  const resting = everything.length > 0 && !everything.some(awakeSince);

  const todayCheckIn = checkIns
    .filter(since(todayStart))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const weather = todayCheckIn?.unwell ? 'rain' : 'clear';

  return {
    weather,
    stream,
    ducks: stream >= 2,
    grass: grassLevel(input.stepsToday),
    tree,
    birds: tree >= 3,
    flowers,
    resting,
  };
}
```

## src/domain/garden/sky.ts

```ts
/** Time of day from the phone's clock. Only the light changes; what has grown stays grown. */
export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night';

export function skyPhase(now: Date): SkyPhase {
  const h = now.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}
```

## src/domain/checkin/moods.ts

```ts
import type { CheckIn, UserState, YardMood } from '@/types';

/** The four one-tap moods, lowest to highest energy. Order is the tile order. */
export const MOODS: readonly UserState[] = ['overloaded', 'recovering', 'regulated', 'activated'];

// Score 3 is intentionally unused by tiles: it maps to 'recovering' like 2, so the
// tiles pick the unambiguous anchor of each state.
const ENERGY_FOR_MOOD: Record<UserState, number> = {
  overloaded: 1,
  recovering: 2,
  regulated: 4,
  activated: 5,
};

export function moodToEnergy(mood: UserState): number {
  return ENERGY_FOR_MOOD[mood];
}

/** energy_score (1–5) → mood (also the flower colour in the garden). */
export function mapEnergyToState(score: number): UserState {
  if (score === 1) return 'overloaded';
  if (score <= 3) return 'recovering';
  if (score === 4) return 'regulated';
  return 'activated';
}

/** The five yard moods, in tile order. */
export const YARD_MOODS: readonly YardMood[] = ['tired', 'low', 'frustrated', 'steady', 'buzzing'];

// Frustrated takes the score tiles never used (3), so it reads as 'recovering' in the garden.
const ENERGY_FOR_YARD_MOOD: Record<YardMood, number> = {
  tired: 1,
  low: 2,
  frustrated: 3,
  steady: 4,
  buzzing: 5,
};

/** The energy_score written alongside a yard mood, so the garden and Changes keep working. */
export function yardMoodToEnergy(mood: YardMood): number {
  return ENERGY_FOR_YARD_MOOD[mood];
}

/** A check-in's yard mood: the stored one, or for older rows the closest one to its energy score. */
export function yardMoodOf(checkIn: Pick<CheckIn, 'energy_score' | 'mood'>): YardMood {
  if (checkIn.mood) return checkIn.mood;
  const s = checkIn.energy_score;
  if (s <= 1) return 'tired';
  if (s <= 3) return 'low';
  if (s === 4) return 'steady';
  return 'buzzing';
}
```

## src/hooks/useReduceMotion.ts

```ts
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Whether the phone asks apps to minimise motion (iOS "Reduce Motion", Android "Remove animations"). */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (active) setReduce(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  return reduce;
}
```

## __tests__/ParkScreen.test.tsx

```tsx
import React from 'react';
import { fireEvent, render, waitForElementToBeRemoved } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({ telemetry: { capture: jest.fn() } }));
jest.mock('../src/services/steps', () => ({
  stepsStatus: async () => 'needs-full-app',
  requestStepsAccess: async () => false,
  stepsByDay: async () => ({}),
}));
jest.mock('../src/services/notifications', () => ({
  enableDailyReminder: jest.fn(async () => true),
  disableDailyReminder: jest.fn(async () => {}),
}));
jest.mock('../src/hooks/useReduceMotion', () => ({ useReduceMotion: () => true }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import ParkScreen from '../src/screens/main/ParkScreen';
import { useGardenStore } from '../src/store/gardenStore';
import { useProfileStore } from '../src/store/profileStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { __resetDbCacheForTests } from '../src/services/db';
import { BADGE_COPY, CHANGES_COPY, DRAWER_COPY, ME_COPY, MOOD_COPY, PARK_COPY, SHEET_COPY, UNWELL_COPY, WATER_COPY, WORKOUT_COPY } from '../src/constants/copy';

const obj = (o: keyof typeof PARK_COPY.objects) => ({ name: PARK_COPY.objects[o].label });

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useGardenStore.setState({ checkIns: [], water: [], workouts: [], stepsToday: null, stepsByDay: {}, stepsStatus: 'needs-full-app', loaded: true, error: null });
  useProfileStore.setState({ profile: { id: 'p1', name: 'Sam', created_at: new Date().toISOString() } });
  useSettingsStore.setState({ parkTourSeen: true } as any);
});

describe('<ParkScreen />', () => {
  it('tapping the river opens water and logs a glass', async () => {
    const { getByRole, getByLabelText, findAllByTestId } = render(<ParkScreen />);
    fireEvent.press(getByRole('button', obj('river')));
    fireEvent.press(getByLabelText(WATER_COPY.add));
    expect(await findAllByTestId('drop')).toHaveLength(1);
  });

  it('tapping the tree opens the workout log', () => {
    const { getByRole, getByText } = render(<ParkScreen />);
    fireEvent.press(getByRole('button', obj('tree')));
    expect(getByText(WORKOUT_COPY.title)).toBeTruthy();
  });

  it('tapping the flowerbed opens mood', () => {
    const { getByRole, getByText } = render(<ParkScreen />);
    fireEvent.press(getByRole('button', obj('flowerbed')));
    expect(getByText(SHEET_COPY.moodTitle)).toBeTruthy();
  });

  it('only one sheet opens at a time', () => {
    const { getByRole, queryByText, getByText } = render(<ParkScreen />);
    fireEvent.press(getByRole('button', obj('river')));
    expect(getByText(WATER_COPY.title)).toBeTruthy();
    fireEvent.press(getByRole('button', obj('tree')));
    expect(getByText(WORKOUT_COPY.title)).toBeTruthy();
    expect(queryByText(WATER_COPY.subtitle)).toBeNull();
  });

  it('the drawer shows today at a glance and opens on tap', () => {
    const { getByLabelText, getByText } = render(<ParkScreen />);
    fireEvent.press(getByLabelText(DRAWER_COPY.openLabel));
    expect(getByText(DRAWER_COPY.todayTitle)).toBeTruthy();
  });

  it('closed, the drawer is only an arrow over the park', () => {
    const { getByLabelText, queryByText } = render(<ParkScreen />);
    expect(getByLabelText(DRAWER_COPY.openLabel)).toBeTruthy();
    expect(queryByText(WATER_COPY.count(0))).toBeNull();
    expect(queryByText('Today')).toBeNull();
  });

  it('every kind of care can be logged from the drawer', () => {
    const { getByLabelText, getAllByLabelText } = render(<ParkScreen />);
    fireEvent.press(getByLabelText(DRAWER_COPY.openLabel));
    expect(getAllByLabelText(DRAWER_COPY.rows.water.action).length).toBeGreaterThan(0);
    expect(getByLabelText(DRAWER_COPY.rows.workout.action)).toBeTruthy();
    expect(getByLabelText(DRAWER_COPY.rows.mood.action)).toBeTruthy();
    expect(getByLabelText(DRAWER_COPY.rows.steps.action)).toBeTruthy();
  });

  it('Changes and Me live in the drawer', () => {
    const { getByLabelText, getByText } = render(<ParkScreen />);
    fireEvent.press(getByLabelText(DRAWER_COPY.openLabel));
    expect(getByText(CHANGES_COPY.linesTitle)).toBeTruthy();
    expect(getByLabelText(ME_COPY.reminderLabel)).toBeTruthy();
  });

  it("today's workouts are listed in the drawer and can be deleted", async () => {
    await useGardenStore.getState().addWorkout('run', 20);
    const { getByLabelText, queryByText } = render(<ParkScreen />);
    fireEvent.press(getByLabelText(DRAWER_COPY.openLabel));
    expect(queryByText(WORKOUT_COPY.entry('run', 20))).toBeTruthy();
    fireEvent.press(getByLabelText(WORKOUT_COPY.deleteA11y('run', 20)));
    await waitForElementToBeRemoved(() => queryByText(WORKOUT_COPY.entry('run', 20)));
    expect(useGardenStore.getState().workouts).toEqual([]);
  });

  it('editing a workout opens the log prefilled and saves changes', async () => {
    await useGardenStore.getState().addWorkout('run', 20);
    const { getByLabelText, findByText } = render(<ParkScreen />);
    fireEvent.press(getByLabelText(DRAWER_COPY.openLabel));
    fireEvent.press(getByLabelText(WORKOUT_COPY.editA11y('run', 20)));
    fireEvent.press(getByLabelText(WORKOUT_COPY.durationA11y(45)));
    fireEvent.press(getByLabelText(WORKOUT_COPY.update));
    expect(await findByText(WORKOUT_COPY.entry('run', 45))).toBeTruthy();
  });

  it('feeling unwell from the flowerbed brings gentle rain to the park', async () => {
    const { getByRole, getByLabelText, findByLabelText, findAllByTestId } = render(<ParkScreen />);
    fireEvent.press(getByRole('button', obj('flowerbed')));
    fireEvent.press(getByLabelText(MOOD_COPY.regulated.label));
    fireEvent.press(await findByLabelText(UNWELL_COPY.toggle));
    expect((await findAllByTestId('rain')).length).toBeGreaterThan(0);
  });

  it('the workout log says honestly what it will grow', () => {
    const { getByRole, getByText, getByLabelText } = render(<ParkScreen />);
    fireEvent.press(getByRole('button', obj('tree')));
    fireEvent.press(getByText(WORKOUT_COPY.types.walk));
    fireEvent.press(getByLabelText(WORKOUT_COPY.durationA11y(10)));
    expect(getByText(BADGE_COPY.growth[1])).toBeTruthy();
  });
});

describe('first visit', () => {
  it('the tour shows on the first visit only', () => {
    const { TOUR_COPY } = require('../src/constants/copy');
    useSettingsStore.setState({ parkTourSeen: false } as any);
    const first = render(<ParkScreen />);
    expect(first.getByLabelText(TOUR_COPY.skip)).toBeTruthy();
    first.unmount();
    useSettingsStore.setState({ parkTourSeen: true } as any);
    const later = render(<ParkScreen />);
    expect(later.queryByLabelText(TOUR_COPY.skip)).toBeNull();
  });
});
```

## __tests__/parkSheets.test.tsx

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({ telemetry: { capture: jest.fn() } }));
let mockStatus = 'ask';
const mockRequest = jest.fn(async () => true);
jest.mock('../src/services/steps', () => ({
  stepsStatus: async () => mockStatus,
  requestStepsAccess: async () => {
    mockStatus = 'granted';
    return mockRequest();
  },
  stepsByDay: async () => ({}),
}));

import { WaterSheet } from '../src/components/park/sheets/WaterSheet';
import { MoodSheet } from '../src/components/park/sheets/MoodSheet';
import { StepsSheet } from '../src/components/park/sheets/StepsSheet';
import { useGardenStore } from '../src/store/gardenStore';
import { __resetDbCacheForTests } from '../src/services/db';
import { MOOD_COPY, STEPS_COPY, UNWELL_COPY, WATER_COPY } from '../src/constants/copy';

beforeEach(async () => {
  mockStatus = 'ask';
  mockRequest.mockClear();
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useGardenStore.setState({ checkIns: [], water: [], workouts: [], stepsToday: null, stepsByDay: {}, stepsStatus: 'ask', loaded: true, error: null });
});

describe('park sheets', () => {
  it('water sheet adds a glass and draws one more drop', async () => {
    const { getByLabelText, queryAllByTestId, findAllByTestId } = render(<WaterSheet visible onClose={() => {}} />);
    expect(queryAllByTestId('drop')).toHaveLength(0);
    fireEvent.press(getByLabelText(WATER_COPY.add));
    expect(await findAllByTestId('drop')).toHaveLength(1);
    expect(useGardenStore.getState().water).toHaveLength(1);
  });

  it('water sheet never shows empty slots', () => {
    const { queryAllByTestId, getByText, queryByLabelText } = render(<WaterSheet visible onClose={() => {}} />);
    expect(queryAllByTestId('drop')).toHaveLength(0);
    expect(queryAllByTestId('drop-empty')).toHaveLength(0);
    expect(getByText(WATER_COPY.note)).toBeTruthy();
    expect(queryByLabelText(WATER_COPY.remove)).toBeNull(); // nothing to undo yet
  });

  it('mood sheet plants a flower and then offers feeling unwell', async () => {
    const { getByLabelText, findByLabelText } = render(<MoodSheet visible onClose={() => {}} />);
    fireEvent.press(getByLabelText(MOOD_COPY.regulated.label));
    expect(await findByLabelText(UNWELL_COPY.toggle)).toBeTruthy();
    expect(useGardenStore.getState().checkIns).toHaveLength(1);
  });

  it('steps sheet asks only on tap of Allow', async () => {
    const { getByLabelText } = render(<StepsSheet visible onClose={() => {}} />);
    expect(mockRequest).not.toHaveBeenCalled();
    fireEvent.press(getByLabelText(STEPS_COPY.allowButton));
    await new Promise((r) => setTimeout(r, 0));
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });
});
```

## __tests__/yardData.test.ts

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, __resetDbCacheForTests } from '../src/services/db';
import { tidySleepHours, useGardenStore } from '../src/store/gardenStore';
import { telemetry } from '../src/services/telemetry';
import { localDayKey } from '../src/domain/garden/days';
import { mapEnergyToState, YARD_MOODS, yardMoodOf, yardMoodToEnergy } from '../src/domain/checkin/moods';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/steps', () => ({
  stepsStatus: async () => 'denied',
  requestStepsAccess: async () => false,
  stepsByDay: async () => ({}),
}));
jest.mock('../src/services/telemetry', () => ({
  telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() },
}));

const store = () => useGardenStore.getState();
const ALL_TIME = new Date(0).toISOString();

const yesterdayIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString();
};

/** Simulates closing and reopening the app. */
async function restart() {
  __resetDbCacheForTests();
  useGardenStore.setState({ checkIns: [], meals: [], sleep: [], loaded: false });
  await store().load();
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useGardenStore.setState({
    checkIns: [], water: [], workouts: [], meals: [], sleep: [],
    stepsToday: null, stepsByDay: {}, stepsStatus: 'unknown', loaded: false, error: null,
  });
});

describe('yard moods (domain)', () => {
  it('lists the five moods in tile order', () => {
    expect(YARD_MOODS).toEqual(['tired', 'low', 'frustrated', 'steady', 'buzzing']);
  });

  it('each mood round-trips through its stored row', () => {
    for (const m of YARD_MOODS) expect(yardMoodOf({ energy_score: yardMoodToEnergy(m), mood: m })).toBe(m);
  });

  it('older rows without a mood get the closest one from their energy', () => {
    expect([1, 2, 3, 4, 5].map((energy_score) => yardMoodOf({ energy_score }))).toEqual([
      'tired', 'low', 'low', 'steady', 'buzzing',
    ]);
  });

  it('frustrated reads as recovering in the garden', () => {
    expect(mapEnergyToState(yardMoodToEnergy('frustrated'))).toBe('recovering');
  });
});

describe('yard moods (store)', () => {
  it('logYardMood saves the mood and a matching energy score', async () => {
    await store().logYardMood('frustrated');
    expect(store().todayYardMood()).toBe('frustrated');
    const [row] = await db.checkIns.all();
    expect(row).toMatchObject({ mood: 'frustrated', energy_score: 3 });
    expect(telemetry.capture).toHaveBeenCalledWith('logged', { kind: 'mood' });
  });

  it('re-picking edits today instead of adding a second check-in', async () => {
    await store().logYardMood('tired');
    await store().logYardMood('buzzing');
    expect(await db.checkIns.all()).toHaveLength(1);
    expect(store().todayYardMood()).toBe('buzzing');
    expect(store().todayMood()).toBe('activated');
  });

  it('survives a restart', async () => {
    await store().logYardMood('low');
    await restart();
    expect(store().todayYardMood()).toBe('low');
  });

  it('is null until a mood is picked today, and ignores yesterday', async () => {
    expect(store().todayYardMood()).toBeNull();
    useGardenStore.setState({
      checkIns: [{
        id: 'y', user_id: 'u', energy_score: 5, mood: 'buzzing', sleep_quality: null,
        intention: null, engine_version: 'garden-1', created_at: yesterdayIso(),
      }],
    });
    expect(store().todayYardMood()).toBeNull();
  });

  it('the old four-mood picker clears a stale yard mood', async () => {
    await store().logYardMood('frustrated');
    await store().logMood('regulated');
    expect(store().todayYardMood()).toBe('steady');
    await restart();
    expect(store().todayYardMood()).toBe('steady');
  });

  it('keeps feeling unwell when the yard mood changes', async () => {
    await store().logYardMood('tired');
    await store().setUnwell(true);
    await store().logYardMood('steady');
    expect(store().todayUnwell()).toBe(true);
  });
});

describe('meals', () => {
  it('setMealsToday adds and removes to match the set, in meal order', async () => {
    await store().setMealsToday(['dinner', 'breakfast']);
    expect(store().mealsToday()).toEqual(['breakfast', 'dinner']);
    await store().setMealsToday(['breakfast', 'snack']);
    expect(store().mealsToday()).toEqual(['breakfast', 'snack']);
    const stored = (await db.meals.since(ALL_TIME)).map((m) => m.meal).sort();
    expect(stored).toEqual(['breakfast', 'snack']);
  });

  it('picking the same meal twice keeps one row', async () => {
    await store().setMealsToday(['lunch']);
    await store().setMealsToday(['lunch']);
    expect(await db.meals.since(ALL_TIME)).toHaveLength(1);
  });

  it('never touches yesterday', async () => {
    const old = await db.meals.add('lunch');
    await AsyncStorage.setItem(
      '@movekind/db/meals',
      JSON.stringify([{ ...old, created_at: yesterdayIso() }]),
    );
    await restart();
    await store().setMealsToday([]);
    expect(store().mealsToday()).toEqual([]);
    expect(await db.meals.since(ALL_TIME)).toHaveLength(1);
  });

  it('reports food only when a meal was added, never which one', async () => {
    await store().setMealsToday(['lunch']);
    expect(telemetry.capture).toHaveBeenCalledWith('logged', { kind: 'food' });
    (telemetry.capture as jest.Mock).mockClear();
    await store().setMealsToday([]);
    expect(telemetry.capture).not.toHaveBeenCalled();
  });

  it('survives a restart', async () => {
    await store().setMealsToday(['breakfast']);
    await restart();
    expect(store().mealsToday()).toEqual(['breakfast']);
  });
});

describe('sleep', () => {
  it('logSleep saves this morning, and logging again edits it', async () => {
    await store().logSleep(7, null);
    await store().logSleep(7.5, 'deep');
    expect(store().lastNightSleep()).toMatchObject({ hours: 7.5, feel: 'deep', night_of: localDayKey(new Date()) });
    expect(await db.sleep.since(ALL_TIME)).toHaveLength(1);
    expect(telemetry.capture).toHaveBeenCalledWith('logged', { kind: 'sleep' });
  });

  it('is null with nothing logged this morning', () => {
    useGardenStore.setState({
      sleep: [{ id: 'old', night_of: '2000-01-01', hours: 8, feel: null, created_at: yesterdayIso() }],
    });
    expect(store().lastNightSleep()).toBeNull();
  });

  it('keeps hours to the half hour between 0 and 24', () => {
    expect(tidySleepHours(7.3)).toBe(7.5);
    expect(tidySleepHours(-2)).toBe(0);
    expect(tidySleepHours(30)).toBe(24);
    expect(tidySleepHours(Number.NaN)).toBe(0);
  });

  it('survives a restart', async () => {
    await store().logSleep(6.5, 'restless');
    await restart();
    expect(store().lastNightSleep()).toMatchObject({ hours: 6.5, feel: 'restless' });
  });
});

describe('db: meals and sleep', () => {
  it('sleep update persists', async () => {
    const row = await db.sleep.add({ night_of: '2026-11-09', hours: 7, feel: null });
    await db.sleep.update(row.id, { hours: 8, feel: 'deep' });
    __resetDbCacheForTests();
    expect(await db.sleep.since(ALL_TIME)).toEqual([{ ...row, hours: 8, feel: 'deep' }]);
  });

  it('eraseAll clears meals and sleep', async () => {
    await db.meals.add('dinner');
    await db.sleep.add({ night_of: '2026-11-09', hours: 7, feel: 'okay' });
    await db.eraseAll();
    __resetDbCacheForTests();
    expect(await db.meals.since(ALL_TIME)).toEqual([]);
    expect(await db.sleep.since(ALL_TIME)).toEqual([]);
  });
});
```

## __tests__/colors.test.ts

```ts
import { colors, stateColors } from '../src/constants/colors';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const TEXT = 4.5;
const UI = 3;

describe('Sage palette contrast', () => {
  const textPairs: [string, string, string][] = [
    ['textPrimary on background', colors.textPrimary, colors.background],
    ['textSecondary on background', colors.textSecondary, colors.background],
    ['textSecondary on surfaceSecondary', colors.textSecondary, colors.surfaceSecondary],
    ['textMuted on background', colors.textMuted, colors.background],
    ['textMuted on surface', colors.textMuted, colors.surface],
    ['textMuted on surfaceSecondary', colors.textMuted, colors.surfaceSecondary],
    ['onPrimary on primary', colors.onPrimary, colors.primary],
    ['onPrimary on primaryPressed', colors.onPrimary, colors.primaryPressed],
    ['primary text on background', colors.primary, colors.background],
    ['primary text on surface', colors.primary, colors.surface],
    ['secondaryText on primarySoft', colors.secondaryText, colors.primarySoft],
    ['success on background', colors.success, colors.background],
    ['warning on background', colors.warning, colors.background],
    ['error on background', colors.error, colors.background],
    ['info on background', colors.info, colors.background],
    ['onInverse on inverse (note card)', colors.onInverse, colors.inverse],
    ['textSecondary on surface', colors.textSecondary, colors.surface],
    ['textPrimary on primarySoft (pace note)', colors.textPrimary, colors.primarySoft],
    ['primary text on primarySoft (active tab)', colors.primary, colors.primarySoft],
  ];

  it.each(textPairs)('%s clears 4.5:1', (_name, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(TEXT);
  });

  it('primary outline is visible against the canvas (3:1)', () => {
    expect(ratio(colors.primary, colors.background)).toBeGreaterThanOrEqual(UI);
  });

  describe.each(Object.entries(stateColors))('%s', (_state, c) => {
    it('ink text on soft tile clears 4.5:1', () => expect(ratio(c.ink, c.soft)).toBeGreaterThanOrEqual(TEXT));
    it('white on accent clears 4.5:1', () => expect(ratio('#FFFFFF', c.accent)).toBeGreaterThanOrEqual(TEXT));
    it('accent as text on background clears 4.5:1', () => expect(ratio(c.accent, colors.background)).toBeGreaterThanOrEqual(TEXT));
    it('ink tile border vs background clears 3:1', () => expect(ratio(c.ink, colors.background)).toBeGreaterThanOrEqual(UI));
    it('tint bar vs surface clears 3:1', () => expect(ratio(c.tint, colors.surface)).toBeGreaterThanOrEqual(UI));
  });
});
```

## __tests__/noEmDash.test.ts

```ts
/// <reference types="node" />
import fs from 'node:fs';
import path from 'node:path';

/**
 * User-facing text never uses em dashes: they read as machine-written. Comments may.
 * Scans every source file with comments stripped, so new screens are covered too.
 */
const SRC = path.resolve(__dirname, '../src');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(p);
    return /\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts') ? [p] : [];
  });
}

const withoutComments = (code: string) =>
  code
    .replace(/\/\*[\s\S]*?\*\//g, '') // block and JSX comments
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1'); // line comments (not the // in URLs)

describe('no em dashes in user-facing text', () => {
  it.each(sourceFiles(SRC).map((f) => [path.relative(SRC, f), f]))('%s', (_name, file) => {
    const offending = withoutComments(fs.readFileSync(file, 'utf8'))
      .split('\n')
      .filter((line) => line.includes('—'));
    expect(offending).toEqual([]);
  });
});
```

## jest.setup.ts

```ts
// Minimal global mocks. Most Expo modules don't run inside Jest preset.
// The park's animations run on the UI thread, which Jest doesn't have.
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => {
  const { Image, ScrollView, Text, View } = require('react-native');
  const value = (v: unknown) => v;
  const Animated = { View, Text, Image, ScrollView, createAnimatedComponent: (c: unknown) => c };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: (f: () => unknown) => f(),
    withTiming: value,
    withSpring: value,
    withRepeat: value,
    withSequence: (...v: unknown[]) => v[v.length - 1],
    runOnJS: (f: unknown) => f,
    Easing: { linear: value, sin: value, inOut: value },
  };
});
// Gestures need the native module too: taps still work, drags are covered on a phone.
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  const chain: object = new Proxy({}, { get: () => () => chain });
  return {
    Gesture: { Pan: () => chain },
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    GestureHandlerRootView: View,
  };
});

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async () => ''),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

// Icons are decorative (see src/components/Icon.tsx). On SDK 58 the real component loads its
// icon font through the asset registry, which Jest doesn't have, so tests draw a plain stand-in.
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  const Stub = ({ name }: { name: string }) => require('react').createElement(Text, { testID: `icon-${name}` }, '');
  return { MaterialCommunityIcons: Stub };
});
```

