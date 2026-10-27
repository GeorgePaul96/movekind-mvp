import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ParkScene, type ParkScrollHandle } from '@/components/park/ParkScene';
import { ParkDrawer } from '@/components/park/ParkDrawer';
import { ParkTour } from '@/components/park/ParkTour';
import { Sheet } from '@/components/park/Sheet';
import { WaterSheet } from '@/components/park/sheets/WaterSheet';
import { MoodSheet } from '@/components/park/sheets/MoodSheet';
import { StepsSheet } from '@/components/park/sheets/StepsSheet';
import { WorkoutSheet } from '@/components/garden/WorkoutSheet';
import { colors } from '@/constants/colors';
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
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const scrollRef = useRef<ParkScrollHandle | null>(null);
  const greeting = useRef(new Animated.Value(1)).current;
  const [showGreeting, setShowGreeting] = useState(true);
  const [openSheet, setOpenSheet] = useState<ParkObject | null>(null);
  const [editing, setEditing] = useState<Workout | null>(null);
  const tourSeen = useSettingsStore((s) => s.parkTourSeen);
  const [touring, setTouring] = useState(!tourSeen);

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
      else Animated.timing(greeting, { toValue: 0, duration: 1200, useNativeDriver: true }).start(() => setShowGreeting(false));
    }, GREETING_MS);
    return () => clearTimeout(timer);
  }, [reduce, greeting]);

  const now = new Date();
  const input = { checkIns, water, workouts, stepsToday };
  const state = gardenState(input, now);
  const allMinutes = workouts.reduce((m, w) => m + w.minutes, 0);
  const close = () => {
    setOpenSheet(null);
    setEditing(null);
  };

  return (
    <View style={styles.root}>
      <ParkScene
        state={state}
        phase={skyPhase(now)}
        untended={untendedToday(input, now)}
        onObject={setOpenSheet}
        width={width}
        height={height}
        scrollRef={scrollRef}
      />

      {showGreeting && (
        <Animated.View pointerEvents="none" style={[styles.greeting, { top: insets.top + 16, opacity: greeting }]}>
          <Text style={styles.greetingText}>{PARK_COPY.greeting(partOfDay(now), name)}</Text>
        </Animated.View>
      )}

      {touring && (
        <ParkTour
          layout={parkLayout(width, height)}
          screenW={width}
          scrollTo={(x) => scrollRef.current?.scrollTo({ x, y: 0, animated: !reduce })}
          onDone={() => setTouring(false)}
        />
      )}

      <ParkDrawer
        height={height}
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
  root: { flex: 1, backgroundColor: colors.background },
  greeting: { position: 'absolute', left: 20, right: 20, alignItems: 'center' },
  greetingText: {
    ...font.bold,
    fontSize: 22,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  soon: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginVertical: 12 },
});
