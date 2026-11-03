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
