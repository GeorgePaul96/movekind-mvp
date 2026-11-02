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
