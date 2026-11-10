import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Icon, type IconName } from '@/components/Icon';
import { colors, elevation } from '@/constants/colors';
import { HOME_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { BREATH_MINUTES, CARE_KINDS, breathAt, type CareKind } from '@/domain/home/care';
import { useReduceMotion } from '@/hooks/useReduceMotion';

/** Pieces of the simple home: the care dots, a section, the tab bar and the breathing pacer. */

const CARE_ICONS: Record<CareKind, IconName> = {
  mood: 'emoticon-happy-outline',
  water: 'water-outline',
  food: 'food-apple-outline',
  movement: 'run',
  sleep: 'power-sleep',
};

/**
 * Five dots that warm up as the day is cared for. The one bold thing on the screen.
 * They only fill: an empty dot is an open invitation, never a count of what is missing.
 */
export function CareDots({ done }: { done: Record<CareKind, boolean> }) {
  return (
    <View style={styles.dots}>
      {CARE_KINDS.map((kind) => (
        <View
          key={kind}
          style={styles.dotWrap}
          accessible
          accessibilityLabel={HOME_COPY.careA11y(HOME_COPY.care[kind], done[kind])}
        >
          <View style={[styles.dot, done[kind] && styles.dotDone]}>
            <Icon name={CARE_ICONS[kind]} size={24} color={done[kind] ? colors.warmInk : colors.textMuted} />
          </View>
          <Text style={[styles.dotLabel, done[kind] && styles.dotLabelDone]}>{HOME_COPY.care[kind]}</Text>
        </View>
      ))}
    </View>
  );
}

/** A plain section of the Today page: a title, an optional value on the right, then its controls. */
export function Section({
  icon,
  title,
  value,
  children,
}: {
  icon: IconName;
  title: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Icon name={icon} size={22} color={colors.primary} />
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
        {value ? <Text style={styles.sectionValue}>{value}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export type HomeTab = 'today' | 'changes' | 'insights' | 'you';
const TABS: { id: HomeTab; icon: IconName }[] = [
  { id: 'today', icon: 'white-balance-sunny' },
  { id: 'changes', icon: 'sprout-outline' },
  { id: 'insights', icon: 'chart-timeline-variant' },
  { id: 'you', icon: 'account-outline' },
];

export function TabBar({ tab, onChange, bottomInset }: { tab: HomeTab; onChange: (t: HomeTab) => void; bottomInset: number }) {
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(bottomInset, 8) }]} accessibilityRole="tablist">
      {TABS.map(({ id, icon }) => {
        const selected = tab === id;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            accessibilityRole="tab"
            accessibilityLabel={HOME_COPY.tabA11y(HOME_COPY.tabs[id])}
            accessibilityState={{ selected }}
            style={styles.tab}
          >
            <View style={[styles.tabPill, selected && styles.tabPillSelected]}>
              <Icon name={icon} size={22} color={selected ? colors.primary : colors.textMuted} />
            </View>
            <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{HOME_COPY.tabs[id]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A slow-breathing pacer: in for five, out for five, for one, three or five minutes. */
export function BreathPacer() {
  const reduce = useReduceMotion();
  const [minutes, setMinutes] = useState<number>(BREATH_MINUTES[0]);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  const state = elapsed === null ? null : breathAt(elapsed, minutes);
  useEffect(() => {
    if (state?.phase === 'done') stop();
  }, [state?.phase]);

  const begin = () => {
    stop();
    setElapsed(0);
    timer.current = setInterval(() => setElapsed((s) => (s === null ? null : s + 1)), 1000);
  };
  const end = () => {
    stop();
    setElapsed(null);
  };

  const running = state !== null && state.phase !== 'done';
  // The circle grows on the in-breath and settles on the out-breath. Still when motion is reduced.
  const size = !running || reduce ? 96 : state.phase === 'in' ? 96 + state.count * 10 : 146 - state.count * 10;

  return (
    <View>
      {!running ? (
        <View style={styles.chips}>
          {BREATH_MINUTES.map((m) => (
            <Chip key={m} label={HOME_COPY.breathMinutes(m)} selected={minutes === m} onPress={() => setMinutes(m)} />
          ))}
        </View>
      ) : null}
      {running ? (
        <View style={styles.breath} accessibilityLiveRegion="polite">
          <View style={styles.breathStage}>
            <View style={[styles.breathCircle, { width: size, height: size, borderRadius: size / 2 }]}>
              <Text style={styles.breathCount}>{HOME_COPY.breathCount(state.count)}</Text>
            </View>
          </View>
          <Text style={styles.breathPhase}>{state.phase === 'in' ? HOME_COPY.breathIn : HOME_COPY.breathOut}</Text>
        </View>
      ) : null}
      {state?.phase === 'done' ? <Text style={styles.breathPhase}>{HOME_COPY.breathDone}</Text> : null}
      <Button
        label={running ? HOME_COPY.breathStop : HOME_COPY.breathStart}
        variant={running ? 'secondary' : 'primary'}
        onPress={running ? end : begin}
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  dotWrap: { alignItems: 'center', flex: 1 },
  dot: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.warm, borderColor: colors.warmInk, borderStyle: 'solid' },
  dotLabel: { ...font.medium, fontSize: 13, color: colors.textMuted, marginTop: 6 },
  dotLabelDone: { ...font.semibold, color: colors.textPrimary },

  section: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 18,
    marginBottom: 14,
    ...elevation.card,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionTitle: { ...font.bold, fontSize: 19, color: colors.textPrimary, flex: 1 },
  sectionValue: { ...font.semibold, fontSize: 15, color: colors.textSecondary },
  body: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginBottom: 10 },
  small: { ...font.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 8 },
  strong: { ...font.semibold, fontSize: 15, lineHeight: 22, color: colors.textPrimary, marginBottom: 8 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  grow: { flex: 1 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  tabPill: { paddingHorizontal: 18, paddingVertical: 4, borderRadius: 16 },
  tabPillSelected: { backgroundColor: colors.primarySoft },
  tabLabel: { ...font.medium, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  tabLabelSelected: { ...font.bold, color: colors.primary },

  breath: { alignItems: 'center', marginBottom: 12 },
  breathStage: { height: 156, alignItems: 'center', justifyContent: 'center' },
  breathCircle: { backgroundColor: colors.warm, alignItems: 'center', justifyContent: 'center' },
  breathCount: { ...font.extrabold, fontSize: 30, color: colors.warmInk },
  breathPhase: { ...font.bold, fontSize: 20, color: colors.textPrimary, textAlign: 'center', marginBottom: 12 },
});
