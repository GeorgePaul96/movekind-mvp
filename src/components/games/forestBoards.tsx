import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { Button } from '@/components/Button';
import type { BoardProps } from '@/components/games/boards';
import { colors, forestGameColors as g } from '@/constants/colors';
import { PLAY_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import {
  berryPatchRound,
  canopyLeafRound,
  carvedStonesRound,
  duskFirefliesRound,
  fireflyFlightRound,
  streamBalanceRound,
  type BalanceAnswer,
  type LeafShape,
} from '@/domain/games/forestGames';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { chime } from '@/services/chime';
import { playSound } from '@/services/sound';

/**
 * The six forest games' boards. Each plays one round and reports whether it went cleanly
 * (the same contract as boards.tsx). Misses are shown in warm honey, never red, and every
 * board is playable with reduced motion and with a screen reader.
 */

function useLater() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
}

/** The board's width: the screen minus padding, never wider than a comfortable 360. */
function useBoardSize() {
  const { width } = useWindowDimensions();
  return Math.min(360, Math.max(260, width - 40));
}

function Prompt({ children, warm }: { children: React.ReactNode; warm?: boolean }) {
  return (
    <Text style={[styles.prompt, warm && styles.promptWarm]} accessibilityLiveRegion="polite">
      {children}
    </Text>
  );
}

// ---- Canopy leaf -------------------------------------------------------------

const LEAF_PATHS: Record<LeafShape, string> = {
  oval: 'M20 4 C10 12, 8 26, 20 36 C32 26, 30 12, 20 4 Z',
  sassafras: 'M20 4 C16 10, 8 16, 10 24 C11 28, 15 28, 16 26 C17 32, 23 32, 24 26 C25 28, 29 28, 30 24 C32 16, 24 10, 20 4 Z',
  maple: 'M20 4 L23 14 L33 13 L26 21 L30 30 L20 25 L10 30 L14 21 L7 13 L17 14 Z',
  elm: 'M20 4 L23 7 L22 10 L26 13 L25 17 L29 21 L27 25 L28 30 L24 33 L20 36 L16 33 L12 30 L13 25 L11 21 L15 17 L14 13 L18 10 L17 7 Z',
  oak: 'M20 4 C17 7, 13 8, 14 13 C11 16, 11 20, 14 23 C12 26, 13 30, 17 33 L20 36 L23 33 C27 30, 28 26, 26 23 C29 20, 29 16, 26 13 C27 8, 23 7, 20 4 Z',
};

function Leaf({ shape, fill }: { shape: LeafShape; fill: string }) {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40">
      <Path d={LEAF_PATHS[shape]} fill={fill} />
      <Line x1="20" y1="8" x2="20" y2="34" stroke={g.leafVein} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function CanopyLeafBoard({ level, onResult, rng = Math.random }: BoardProps) {
  const round = useMemo(() => canopyLeafRound(level, rng), []); // eslint-disable-line react-hooks/exhaustive-deps
  const later = useLater();
  const size = useBoardSize();
  const [picked, setPicked] = useState<string | null>(null);
  const missed = picked !== null && picked !== round.targetId;

  const tap = (id: string) => {
    if (picked) return;
    setPicked(id);
    if (id === round.targetId) {
      playSound('select');
      later(() => onResult(true), 450);
    } else {
      chime.soft();
      later(() => onResult(false), 1100);
    }
  };

  return (
    <View style={styles.board}>
      <Prompt warm={missed}>{missed ? PLAY_COPY.leafWas : PLAY_COPY.leafAsk}</Prompt>
      <View style={[styles.field, { width: size, height: size * 1.1 }]}>
        {round.leaves.map((leaf, k) => {
          const reveal = missed && leaf.isTarget;
          const chosen = picked === leaf.id;
          return (
            <Pressable
              key={leaf.id}
              onPress={() => tap(leaf.id)}
              accessibilityRole="button"
              accessibilityLabel={PLAY_COPY.leafA11y(k + 1, PLAY_COPY.leafShapes[leaf.shape])}
              style={[
                styles.leaf,
                { left: (leaf.x / 100) * size - 24, top: (leaf.y / 100) * size * 1.1 - 24, transform: [{ rotate: `${leaf.rotation}deg` }] },
                reveal && styles.leafReveal,
              ]}
            >
              <Leaf shape={leaf.shape} fill={reveal ? colors.warmInk : chosen && leaf.isTarget ? colors.primary : g.leaf} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---- Dusk fireflies ----------------------------------------------------------------

export function DuskFirefliesBoard({ level, onResult, rng = Math.random }: BoardProps) {
  const round = useMemo(() => duskFirefliesRound(level, rng), []); // eslint-disable-line react-hooks/exhaustive-deps
  const reduce = useReduceMotion();
  const later = useLater();
  const size = useBoardSize();
  const height = size * 1.05;
  const [done, setDone] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const doneRef = useRef(false);
  const x = useSharedValue(0);

  const finish = (correct: boolean, message?: string) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    if (correct) {
      if (round.type === 'gold') playSound('select');
      else chime.note(2);
      later(() => onResult(true), 350);
    } else {
      chime.soft();
      setNote(message ?? null);
      later(() => onResult(false), 1100);
    }
  };

  useEffect(() => {
    if (!reduce) x.value = withTiming(1, { duration: round.durationMs, easing: Easing.inOut(Easing.sin) });
    // Drifting all the way across: right for a blue one, a gentle miss for a gold one.
    // With reduced motion it waits for a choice instead.
    if (!reduce) later(() => finish(round.type === 'blue', PLAY_COPY.goldMissed), round.durationMs + 50);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fly = useAnimatedStyle(() => {
    const t = reduce ? 0.5 : x.value;
    const yPct = round.startY + (round.endY - round.startY) * t;
    return { transform: [{ translateX: t * (size - 64) }, { translateY: (yPct / 100) * (height - 64) }] };
  });
  const color = round.type === 'gold' ? g.gold : g.blue;

  return (
    <View style={styles.board}>
      <Prompt warm={!!note}>{note ?? PLAY_COPY.firefliesAsk}</Prompt>
      <View style={[styles.dusk, { width: size, height }]}>
        <Animated.View style={[styles.fly, fly]}>
          <Pressable
            onPress={() => finish(round.type === 'gold', PLAY_COPY.blueTapped)}
            disabled={done}
            accessibilityRole="button"
            accessibilityLabel={round.type === 'gold' ? PLAY_COPY.catchA11y : PLAY_COPY.restA11y}
            style={styles.flyHit}
          >
            <Svg width={64} height={64} viewBox="0 0 64 64">
              <Circle cx="32" cy="32" r="26" fill={color} opacity={0.22} />
              <Circle cx="32" cy="32" r="16" fill={color} opacity={0.55} />
              <Circle cx="32" cy="32" r="8" fill={color} />
            </Svg>
          </Pressable>
        </Animated.View>
      </View>
      <View style={styles.wide}>
        <Button label={PLAY_COPY.letPass} variant="secondary" disabled={done} onPress={() => finish(round.type === 'blue', PLAY_COPY.goldMissed)} />
      </View>
    </View>
  );
}

// ---- Carved stones -----------------------------------------------------------------

function Glyph({ round, turned }: { round: ReturnType<typeof carvedStonesRound>; turned: boolean }) {
  const t = turned ? `rotate(${round.rotationDegrees}) scale(${round.isMirrored ? -1 : 1}, 1)` : undefined;
  return (
    <Svg width={120} height={120} viewBox="-60 -60 120 120">
      <G transform={t}>
        {round.lines.map((l, k) => (
          <Line
            key={k}
            x1={round.nodes[l.from].x}
            y1={round.nodes[l.from].y}
            x2={round.nodes[l.to].x}
            y2={round.nodes[l.to].y}
            stroke={g.stoneInk}
            strokeWidth={4}
            strokeLinecap="round"
          />
        ))}
        {round.nodes.map((n, k) => (
          <Circle key={k} cx={n.x} cy={n.y} r={k === 0 ? 7 : 5} fill={g.stoneInk} />
        ))}
      </G>
    </Svg>
  );
}

export function CarvedStonesBoard({ level, onResult, rng = Math.random }: BoardProps) {
  const round = useMemo(() => carvedStonesRound(level, rng), []); // eslint-disable-line react-hooks/exhaustive-deps
  const later = useLater();
  const [answer, setAnswer] = useState<'same' | 'mirrored' | null>(null);
  const missed = answer !== null && (answer === 'mirrored') !== round.isMirrored;

  useEffect(() => playSound('drop'), []);

  const choose = (a: 'same' | 'mirrored') => {
    if (answer) return;
    setAnswer(a);
    if ((a === 'mirrored') === round.isMirrored) {
      playSound('select');
      later(() => onResult(true), 400);
    } else {
      chime.soft();
      later(() => onResult(false), 1400);
    }
  };

  return (
    <View style={styles.board}>
      <Prompt warm={missed}>{missed ? PLAY_COPY.stonesWas(round.isMirrored) : PLAY_COPY.stonesAsk}</Prompt>
      <View style={styles.stones}>
        <View style={styles.stoneCol}>
          <View style={styles.stone} accessible accessibilityRole="image" accessibilityLabel={PLAY_COPY.stoneA11y(PLAY_COPY.stoneLeft, 0)}>
            <Glyph round={round} turned={false} />
          </View>
          <Text style={styles.stoneLabel}>{PLAY_COPY.stoneLeft}</Text>
        </View>
        <View style={styles.stoneCol}>
          <View
            style={[styles.stone, missed && styles.stoneWarm]}
            accessible
            accessibilityRole="image"
            accessibilityLabel={PLAY_COPY.stoneA11y(PLAY_COPY.stoneRight, round.rotationDegrees)}
          >
            <Glyph round={round} turned />
          </View>
          <Text style={styles.stoneLabel}>{PLAY_COPY.stoneRight}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.grow}>
          <Button label={PLAY_COPY.same} variant="secondary" disabled={!!answer} onPress={() => choose('same')} />
        </View>
        <View style={styles.grow}>
          <Button label={PLAY_COPY.mirrored} variant="secondary" disabled={!!answer} onPress={() => choose('mirrored')} />
        </View>
      </View>
    </View>
  );
}

// ---- Berry patch --------------------------------------------------------------------

export function BerryPatchBoard({ level, onResult, rng = Math.random }: BoardProps) {
  const round = useMemo(() => berryPatchRound(level, rng), []); // eslint-disable-line react-hooks/exhaustive-deps
  const later = useLater();
  const size = useBoardSize();
  const patch = (size - 12) / 2;
  const [picked, setPicked] = useState<'left' | 'right' | null>(null);

  const choose = (side: 'left' | 'right') => {
    if (picked) return;
    setPicked(side);
    const ok = side === round.correctSide;
    if (ok) playSound('select');
    else chime.soft();
    later(() => onResult(ok), ok ? 700 : 1300);
  };

  const side = (which: 'left' | 'right') => {
    const berries = which === 'left' ? round.leftBerries : round.rightBerries;
    const count = which === 'left' ? round.leftCount : round.rightCount;
    const highlight = picked && which === round.correctSide;
    return (
      <Pressable
        onPress={() => choose(which)}
        accessibilityRole="button"
        accessibilityLabel={PLAY_COPY.patchA11y(which === 'left' ? PLAY_COPY.left : PLAY_COPY.right)}
        style={[styles.patch, { width: patch, height: patch * 1.5 }, highlight && styles.patchWarm]}
      >
        <Svg width={patch - 16} height={patch * 1.5 - 44}>
          {berries.map((b, k) => (
            <Circle key={k} cx={(b.x / 100) * (patch - 16)} cy={(b.y / 100) * (patch * 1.5 - 44)} r={b.radius * (patch / 160)} fill={g.berry} />
          ))}
        </Svg>
        <Text style={styles.count}>{picked ? PLAY_COPY.berryCount(count) : ' '}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.board}>
      <Prompt>{PLAY_COPY.berriesAsk}</Prompt>
      <View style={[styles.row, { width: size }]}>
        {side('left')}
        {side('right')}
      </View>
    </View>
  );
}

// ---- Stream balance -------------------------------------------------------------------

export function StreamBalanceBoard({ level, onResult, rng = Math.random }: BoardProps) {
  const round = useMemo(() => streamBalanceRound(level, rng), []); // eslint-disable-line react-hooks/exhaustive-deps
  const later = useLater();
  const size = useBoardSize();
  const [picked, setPicked] = useState<BalanceAnswer | null>(null);
  const missed = picked !== null && picked !== round.correctAnswer;

  useEffect(() => playSound('drop'), []);

  const choose = (a: BalanceAnswer) => {
    if (picked) return;
    setPicked(a);
    if (a === round.correctAnswer) {
      playSound('select');
      later(() => onResult(true), 400);
    } else {
      chime.soft();
      later(() => onResult(false), 1500);
    }
  };

  const bank = (sideLabel: string, sum: string) => (
    <View style={styles.bank} accessible accessibilityLabel={PLAY_COPY.bankA11y(sideLabel, sum)}>
      <View style={styles.pebble}>
        <Text style={styles.sum}>{sum}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.board}>
      <Prompt warm={missed}>{missed ? PLAY_COPY.totals(round.leftTotal, round.rightTotal) : PLAY_COPY.balanceAsk}</Prompt>
      <View style={[styles.stream, { width: size }]}>
        {bank(PLAY_COPY.left, round.leftExpression)}
        <Svg width={36} height={200}>
          <Rect x={4} y={0} width={28} height={200} rx={14} fill={g.brook} />
          <Path d="M18 0 Q10 50, 18 100 T18 200" stroke={colors.surface} strokeWidth={2} fill="none" opacity={0.7} />
        </Svg>
        {bank(PLAY_COPY.right, round.rightExpression)}
      </View>
      <View style={[styles.row, { width: size }]}>
        {(
          [
            ['left', PLAY_COPY.moreLeft, PLAY_COPY.moreLeftA11y],
            ['balanced', PLAY_COPY.balanced, PLAY_COPY.balancedA11y],
            ['right', PLAY_COPY.moreRight, PLAY_COPY.moreRightA11y],
          ] as const
        ).map(([value, label, a11y]) => (
          <View key={value} style={styles.grow}>
            <Button label={label} accessibilityLabel={a11y} variant="secondary" size="sm" disabled={!!picked} onPress={() => choose(value)} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ---- Firefly flight -------------------------------------------------------------------

export function FireflyFlightBoard({ level, onResult, rng = Math.random }: BoardProps) {
  const round = useMemo(() => fireflyFlightRound(level, rng), []); // eslint-disable-line react-hooks/exhaustive-deps
  const later = useLater();
  const size = useBoardSize();
  const height = size * 1.1;
  const [phase, setPhase] = useState<'watch' | 'recall' | 'done'>('watch');
  const [lit, setLit] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [missed, setMissed] = useState(false);

  useEffect(() => {
    round.sequence.forEach((id, k) => {
      const at = 500 + k * (round.stepDurationMs + 220);
      later(() => {
        setLit(id);
        chime.note(k);
      }, at);
      later(() => setLit(null), at + round.stepDurationMs);
    });
    later(() => setPhase('recall'), 500 + round.sequence.length * (round.stepDurationMs + 220));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (id: number) => {
    if (phase !== 'recall') return;
    if (id === round.reverseSequence[step]) {
      chime.note(step);
      setLit(id);
      later(() => setLit(null), 200);
      if (step + 1 === round.reverseSequence.length) {
        setPhase('done');
        later(() => {
          playSound('select');
          onResult(true);
        }, 450);
      }
      setStep(step + 1);
    } else {
      setPhase('done');
      setMissed(true);
      chime.soft();
      later(() => onResult(false), 1600);
    }
  };

  return (
    <View style={styles.board}>
      <Prompt warm={missed}>
        {missed ? PLAY_COPY.flightWas : phase === 'watch' ? PLAY_COPY.flightWatch : PLAY_COPY.flightAsk}
      </Prompt>
      <View style={[styles.dusk, { width: size, height }]}>
        {round.lanterns.map((l) => {
          const on = lit === l.id;
          const order = missed ? round.reverseSequence.indexOf(l.id) : -1;
          return (
            <Pressable
              key={l.id}
              onPress={() => tap(l.id)}
              disabled={phase !== 'recall'}
              accessibilityRole="button"
              accessibilityLabel={PLAY_COPY.lanternA11y(l.id + 1)}
              style={[styles.lantern, { left: (l.x / 100) * size - 30, top: (l.y / 100) * height - 30 }]}
            >
              <Svg width={60} height={60} viewBox="0 0 60 60">
                {on ? <Circle cx="30" cy="30" r="28" fill={g.gold} opacity={0.3} /> : null}
                <Rect x="16" y="14" width="28" height="32" rx="8" fill={on ? g.gold : order >= 0 ? colors.warm : colors.surfaceSecondary} />
                <Circle cx="30" cy="30" r="6" fill={on ? colors.surface : g.dusk} opacity={on ? 1 : 0.5} />
              </Svg>
              {order >= 0 ? <Text style={styles.order}>{order + 1}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.note}>{phase === 'recall' ? PLAY_COPY.flightStep(step, round.reverseSequence.length) : ' '}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  board: { alignItems: 'center', width: '100%' },
  prompt: { ...font.semibold, fontSize: 17, lineHeight: 24, color: colors.textPrimary, textAlign: 'center', marginBottom: 14, minHeight: 48 },
  promptWarm: { color: colors.warmInk },
  field: { backgroundColor: g.moss, borderRadius: 24 },
  leaf: { position: 'absolute', width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  leafReveal: { backgroundColor: colors.warm },
  dusk: { backgroundColor: g.dusk, borderRadius: 24, overflow: 'hidden' },
  fly: { position: 'absolute', left: 0, top: 0 },
  flyHit: { width: 64, height: 64 },
  wide: { width: '100%', maxWidth: 360, marginTop: 14 },
  stones: { flexDirection: 'row', gap: 16, marginBottom: 18 },
  stoneCol: { alignItems: 'center' },
  stone: { width: 140, height: 150, borderRadius: 48, backgroundColor: g.stone, alignItems: 'center', justifyContent: 'center' },
  stoneWarm: { borderWidth: 4, borderColor: colors.warm },
  stoneLabel: { ...font.medium, fontSize: 14, color: colors.textSecondary, marginTop: 6 },
  row: { flexDirection: 'row', gap: 10, width: '100%', maxWidth: 360 },
  grow: { flex: 1 },
  patch: { backgroundColor: g.moss, borderRadius: 22, padding: 8, alignItems: 'center', borderWidth: 2, borderColor: g.moss },
  patchWarm: { borderColor: colors.warmInk, backgroundColor: colors.warm },
  count: { ...font.bold, fontSize: 15, color: colors.textPrimary, marginTop: 6 },
  stream: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: g.moss, borderRadius: 24, padding: 12, marginBottom: 16 },
  bank: { flex: 1, alignItems: 'center' },
  pebble: { minWidth: 110, minHeight: 90, borderRadius: 45, backgroundColor: g.stone, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  sum: { ...font.extrabold, fontSize: 26, color: g.stoneInk },
  lantern: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  order: { ...font.extrabold, position: 'absolute', fontSize: 16, color: colors.warmInk },
  note: { ...font.medium, fontSize: 14, color: colors.textSecondary, marginTop: 10 },
});
