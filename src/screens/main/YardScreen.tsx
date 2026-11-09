import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkoutSheet } from '@/components/garden/WorkoutSheet';
import { StepsSheet } from '@/components/park/sheets/StepsSheet';
import { WaterSheet } from '@/components/park/sheets/WaterSheet';
import type { PuddingMode } from '@/components/yard/Pudding';
import { FoodSheet } from '@/components/yard/sheets/FoodSheet';
import { MoodSheet } from '@/components/yard/sheets/MoodSheet';
import { SleepSheet } from '@/components/yard/sheets/SleepSheet';
import { YardDrawer } from '@/components/yard/YardDrawer';
import { YardScene, type BloomCounts } from '@/components/yard/YardScene';
import { colors, elevation, yardColors } from '@/constants/colors';
import { YARD_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { isSameLocalDay } from '@/domain/garden/days';
import { gardenState } from '@/domain/garden/garden';
import { skyPhase } from '@/domain/garden/sky';
import { yardLayout, type Point, type YardObject } from '@/domain/yard/layout';
import { yardMoodColors } from '@/domain/yard/moods';
import {
  playBounceSpots,
  scriptOutcome,
  yardScript,
  type DogAction,
  type ScriptTarget,
  type SheetKind,
} from '@/domain/yard/script';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useGardenStore } from '@/store/gardenStore';
import { useProfileStore } from '@/store/profileStore';
import type { Workout } from '@/types';

const GREETING_MS = 4000;
const BUBBLE_MS = 3000;

function partOfDay(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export default function YardScreen() {
  const win = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();

  const sceneW = win.width;
  const sceneH = win.height + insets.bottom;
  const layout = useMemo(() => yardLayout(sceneW, sceneH), [sceneW, sceneH]);

  const name = useProfileStore((s) => s.profile?.name ?? null);
  const store = useGardenStore();
  const {
    checkIns,
    water,
    workouts,
    stepsToday,
    loaded,
    load,
    refreshSteps,
    addWorkout,
    updateWorkout,
  } = store;

  const todayMood = store.todayYardMood();
  const mealsToday = store.mealsToday();
  const lastSleep = store.lastNightSleep();

  const [showGreeting, setShowGreeting] = useState(true);
  const greetingOpacity = useSharedValue(1);
  const [moodPromptChecked, setMoodPromptChecked] = useState(false);

  const [busy, setBusy] = useState(false);
  const [activeTarget, setActiveTarget] = useState<ScriptTarget | null>(null);
  const [openSheet, setOpenSheet] = useState<SheetKind | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const [mapleSpot, setMapleSpot] = useState<Point>(layout.mapleActionSpots.home);
  const [mapleAction, setMapleAction] = useState<DogAction>('idle');
  const [puddingSpot, setPuddingSpot] = useState<Point>(layout.puddingActionSpots.home);
  const [puddingMode, setPuddingMode] = useState<PuddingMode>('sleep');
  const [ballSpot, setBallSpot] = useState<Point>(layout.spots.ball);

  const [petCount, setPetCount] = useState(0);
  const [hopCount, setHopCount] = useState(0);
  const [rollTrigger, setRollTrigger] = useState(0);
  const [bubble, setBubble] = useState<{ speaker: 'Maple' | 'Pudding'; text: string } | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const waterCountBeforeOpen = useRef(0);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  useEffect(() => {
    refreshSteps().catch(() => {});
  }, [refreshSteps]);

  // Open the Mood sheet the first time each day if no mood has been picked yet
  useEffect(() => {
    if (loaded && !moodPromptChecked) {
      setMoodPromptChecked(true);
      if (!todayMood) {
        setOpenSheet('mood');
      }
    }
  }, [loaded, moodPromptChecked, todayMood]);

  // Greeting fades after 4 seconds so the yard speaks for itself
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
  const state = gardenState({ checkIns, water, workouts, stepsToday }, now);
  const phase = skyPhase(now);
  const light = state.resting || phase === 'night' ? 'night' : state.weather === 'rain' ? 'rain' : phase;

  const homeSpot = state.weather === 'rain' ? layout.mapleActionSpots.rainHome : layout.mapleActionSpots.home;

  useEffect(() => {
    if (!busy) {
      setMapleSpot(homeSpot);
      setPuddingSpot(layout.puddingActionSpots.home);
      setBallSpot(layout.spots.ball);
    }
  }, [busy, homeSpot, layout]);

  const showBubble = (next: { speaker: 'Maple' | 'Pudding'; text: string } | null) => {
    setBubble(next);
    if (!next) return;
    const t = setTimeout(() => setBubble(null), BUBBLE_MS);
    timers.current.push(t);
  };

  const today = (iso: string) => isSameLocalDay(new Date(iso), now);
  const waterTodayCount = water.filter((w) => today(w.created_at)).length;
  const workoutsTodayCount = workouts.filter((w) => today(w.created_at)).length;

  const [extraBlooms, setExtraBlooms] = useState<BloomCounts>({
    water: 0,
    food: 0,
    ball: 0,
    pudding: 0,
    mood: 0,
  });

  const blooms: BloomCounts = {
    water: Math.max(waterTodayCount > 0 ? 1 : 0, extraBlooms.water),
    food: Math.max(mealsToday.length > 0 ? 1 : 0, extraBlooms.food),
    ball: Math.max(workoutsTodayCount > 0 ? 1 : 0, extraBlooms.ball),
    pudding: Math.max(lastSleep ? 1 : 0, extraBlooms.pudding),
    mood: Math.max(todayMood ? 1 : 0, extraBlooms.mood),
  };

  const startScript = (target: ScriptTarget) => {
    if (busy) return;
    clearTimers();
    setBusy(true);
    setActiveTarget(target);

    const script = yardScript(target);
    if (script.initialBubble) {
      showBubble(script.initialBubble);
    }

    if (target === 'water') {
      waterCountBeforeOpen.current = waterTodayCount;
      setMapleSpot(layout.mapleActionSpots.water);
      setMapleAction('drink');
    } else if (target === 'food') {
      setPuddingMode('eat');
      setMapleSpot(layout.mapleActionSpots.food);
      setPuddingSpot(layout.puddingActionSpots.food);
      setMapleAction('eat');
    } else if (target === 'ball') {
      const spots = playBounceSpots(layout);
      setBallSpot(spots[0] ?? layout.spots.ball);
      setMapleSpot(layout.mapleActionSpots.ball);
      setMapleAction('play');
      if (!reduce) {
        spots.forEach((pt, idx) => {
          const bt = setTimeout(() => {
            setBallSpot(pt);
            setMapleSpot({ x: pt.x + 24, y: pt.y + 6 });
          }, (idx + 1) * 380);
          timers.current.push(bt);
        });
      }
    } else if (target === 'pudding') {
      setPuddingMode('snore');
    }

    if (reduce) {
      setOpenSheet(script.sheet);
    } else {
      const t = setTimeout(() => {
        setOpenSheet(script.sheet);
      }, script.openDelayMs);
      timers.current.push(t);
    }
  };

  const finishScript = (target: ScriptTarget, saved: boolean) => {
    clearTimers();
    const outcome = scriptOutcome(target, saved);
    setOpenSheet(null);
    setEditingWorkout(null);

    setMapleAction('idle');
    setMapleSpot(homeSpot);
    setPuddingMode('sleep');
    setPuddingSpot(layout.puddingActionSpots.home);
    setBallSpot(layout.spots.ball);

    if (outcome.mapleHop) {
      setHopCount((c) => c + 1);
    }
    if (outcome.puddingRoll) {
      setRollTrigger((c) => c + 1);
    }
    if (outcome.bloomFlower) {
      setExtraBlooms((prev) => ({ ...prev, [target]: prev[target] + 1 }));
    }
    showBubble(outcome.bubble);
    setBusy(false);
    setActiveTarget(null);
  };

  const handleTapObject = (obj: YardObject) => {
    if (obj === 'maple') {
      if (busy) return;
      setPetCount((c) => c + 1);
      if (todayMood) {
        showBubble({ speaker: 'Maple', text: YARD_COPY.moods[todayMood].line });
      }
      return;
    }
    startScript(obj);
  };

  const allMinutes = workouts.reduce((m, w) => m + w.minutes, 0);
  const moodDotColor = todayMood ? yardMoodColors(todayMood).tint : colors.border;
  const moodChipLabel = todayMood ? YARD_COPY.moods[todayMood].label : YARD_COPY.moodButtonAsk;

  return (
    <View style={[styles.root, { backgroundColor: yardColors.lawn[light].low }]}>
      {loaded && (
        <YardScene
          width={sceneW}
          height={sceneH}
          state={state}
          phase={phase}
          mood={todayMood}
          mapleSpot={mapleSpot}
          mapleAction={mapleAction}
          puddingSpot={puddingSpot}
          puddingMode={puddingMode}
          ballSpot={ballSpot}
          petCount={petCount}
          hopCount={hopCount}
          rollTrigger={rollTrigger}
          blooms={blooms}
          bubble={bubble}
          onTapObject={handleTapObject}
        />
      )}

      {/* Quiet Top Bar: Greeting on the left (fades after 4s) and Mood Chip on the right */}
      <View pointerEvents="box-none" style={[styles.topBar, { top: insets.top + 14 }]}>
        {showGreeting ? (
          <Animated.View pointerEvents="none" style={greetingStyle}>
            <Text
              style={[
                styles.greetingSmall,
                { color: light === 'night' ? colors.onInverse : colors.textSecondary },
              ]}
            >
              {YARD_COPY.greeting(partOfDay(now), name)}
            </Text>
            <Text
              style={[
                styles.greetingTitle,
                { color: light === 'night' ? colors.onInverse : colors.textPrimary },
              ]}
            >
              {YARD_COPY.title}
            </Text>
          </Animated.View>
        ) : (
          <View />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={YARD_COPY.moodButtonA11y}
          onPress={() => {
            if (!busy) setOpenSheet('mood');
          }}
          style={styles.moodChip}
        >
          <View style={[styles.moodDot, { backgroundColor: moodDotColor }]} />
          <Text style={styles.moodChipText}>{moodChipLabel}</Text>
        </Pressable>
      </View>

      <YardDrawer
        height={win.height}
        bottomInset={insets.bottom}
        onTriggerScript={startScript}
        onOpenSteps={() => setOpenSheet('steps')}
        onEditWorkout={(w) => {
          setEditingWorkout(w);
          setOpenSheet('movement');
        }}
      />

      <WaterSheet
        visible={openSheet === 'water'}
        onClose={() => {
          const latestWater = useGardenStore
            .getState()
            .water.filter((w) => isSameLocalDay(new Date(w.created_at), new Date())).length;
          finishScript('water', latestWater > waterCountBeforeOpen.current);
        }}
      />

      <FoodSheet
        visible={openSheet === 'food'}
        initialMeals={mealsToday}
        onSave={(meals) => {
          store.setMealsToday(meals).catch(() => {});
          finishScript('food', true);
        }}
        onClose={() => finishScript('food', false)}
      />

      <WorkoutSheet
        visible={openSheet === 'movement'}
        initial={editingWorkout}
        minutesSoFar={editingWorkout ? allMinutes - editingWorkout.minutes : allMinutes}
        onSave={(type, minutes) => {
          (editingWorkout
            ? updateWorkout(editingWorkout.id, { type, minutes })
            : addWorkout(type, minutes)
          ).catch(() => {});
          finishScript('ball', true);
        }}
        onClose={() => {
          if (activeTarget === 'ball') finishScript('ball', false);
          else {
            setOpenSheet(null);
            setEditingWorkout(null);
          }
        }}
      />

      <SleepSheet
        visible={openSheet === 'sleep'}
        initial={lastSleep}
        onSave={(hours, feel) => {
          store.logSleep(hours, feel).catch(() => {});
          finishScript('pudding', true);
        }}
        onClose={() => finishScript('pudding', false)}
      />

      <MoodSheet
        visible={openSheet === 'mood'}
        onSelectMood={(m) => {
          setOpenSheet(null);
          setExtraBlooms((prev) => ({ ...prev, mood: prev.mood + 1 }));
          showBubble({ speaker: 'Maple', text: YARD_COPY.moods[m].line });
        }}
        onClose={() => setOpenSheet(null)}
      />

      <StepsSheet visible={openSheet === 'steps'} onClose={() => setOpenSheet(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingSmall: { ...font.semibold, fontSize: 13 },
  greetingTitle: { ...font.extrabold, fontSize: 22, lineHeight: 27 },
  moodChip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...elevation.card,
  },
  moodDot: { width: 12, height: 12, borderRadius: 6 },
  moodChipText: { ...font.bold, fontSize: 14, color: colors.textPrimary },
});