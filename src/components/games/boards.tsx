import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { colors, gameInks } from '@/constants/colors';
import { PLAY_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import {
  SEQUENCE_SIZE,
  inkRound,
  pairsDeck,
  patternRound,
  sequenceRound,
  switchRound,
  type Ink,
  type Rng,
  type Shade,
  type Shape,
  type SwitchRule,
} from '@/domain/games/games';
import { chime } from '@/services/chime';

/**
 * The five game boards. Each plays exactly one round and reports whether it went cleanly;
 * the shell (GameScreen) owns levels, rounds and the end of a set. A miss is shown softly:
 * the answer is revealed in a warm colour, never a red cross.
 */
export interface BoardProps {
  level: number;
  onResult: (correct: boolean) => void;
  /** The rule used on the round before (Shape or shade only). */
  previousRule?: SwitchRule | null;
  onRule?: (rule: SwitchRule) => void;
  /** A fixed random source, for tests. */
  rng?: Rng;
}

const BOARD = 288;

/** Timers that are cleared when the board goes away, so nothing fires on a closed game. */
function useLater() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
}

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.prompt} accessibilityLiveRegion="polite">
      {children}
    </Text>
  );
}

function Grid({
  size,
  tone,
  onTap,
  disabled,
}: {
  size: number;
  tone: (index: number) => 'idle' | 'lit' | 'found' | 'missed';
  onTap: (index: number) => void;
  disabled: boolean;
}) {
  const gap = 8;
  const cell = (BOARD - gap * (size - 1)) / size;
  return (
    <View style={[styles.grid, { width: BOARD, gap }]}>
      {Array.from({ length: size * size }, (_, k) => {
        const t = tone(k);
        return (
          <Pressable
            key={k}
            onPress={() => onTap(k)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={PLAY_COPY.tile(Math.floor(k / size) + 1, (k % size) + 1)}
            accessibilityState={{ selected: t === 'lit' || t === 'found', disabled }}
            style={[
              styles.tile,
              { width: cell, height: cell },
              (t === 'lit' || t === 'found') && styles.tileLit,
              t === 'missed' && styles.tileMissed,
            ]}
          />
        );
      })}
    </View>
  );
}

// ---- Light the tiles ----------------------------------------------------------

export function PatternBoard({ level, onResult, rng = Math.random }: BoardProps) {
  const round = useMemo(() => patternRound(level, rng), []); // eslint-disable-line react-hooks/exhaustive-deps
  const later = useLater();
  const [phase, setPhase] = useState<'show' | 'input' | 'clean' | 'miss'>('show');
  const [found, setFound] = useState<number[]>([]);
  const [missed, setMissed] = useState<number | null>(null);

  useEffect(() => {
    chime.note(2);
    later(() => setPhase('input'), 1200 + round.targets.length * 150);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (k: number) => {
    if (phase !== 'input' || found.includes(k)) return;
    if (round.targets.includes(k)) {
      const next = [...found, k];
      setFound(next);
      chime.note(next.length);
      if (next.length === round.targets.length) {
        setPhase('clean');
        later(() => onResult(true), 700);
      }
    } else {
      setMissed(k);
      setPhase('miss');
      chime.soft();
      later(() => onResult(false), 1400);
    }
  };

  return (
    <View style={styles.board}>
      <Prompt>
        {phase === 'show' ? PLAY_COPY.watch : phase === 'input' ? PLAY_COPY.yourTurn : phase === 'clean' ? PLAY_COPY.clean : PLAY_COPY.easing}
      </Prompt>
      <Grid
        size={round.size}
        disabled={phase !== 'input'}
        onTap={tap}
        tone={(k) =>
          k === missed
            ? 'missed'
            : found.includes(k)
              ? 'found'
              : (phase === 'show' || phase === 'miss') && round.targets.includes(k)
                ? 'lit'
                : 'idle'
        }
      />
    </View>
  );
}

// ---- In order -----------------------------------------------------------------

const STEP_ON = 600;
const STEP_GAP = 250;

export function SequenceBoard({ level, onResult, rng = Math.random }: BoardProps) {
  const order = useMemo(() => sequenceRound(level, rng), []); // eslint-disable-line react-hooks/exhaustive-deps
  const later = useLater();
  const [phase, setPhase] = useState<'show' | 'input' | 'clean' | 'miss'>('show');
  const [lit, setLit] = useState<number | null>(null);
  const [done, setDone] = useState(0);
  const [missed, setMissed] = useState<number | null>(null);

  useEffect(() => {
    order.forEach((tileIndex, step) => {
      const at = 400 + step * (STEP_ON + STEP_GAP);
      later(() => {
        setLit(tileIndex);
        chime.note(step);
      }, at);
      later(() => setLit(null), at + STEP_ON);
    });
    later(() => setPhase('input'), 400 + order.length * (STEP_ON + STEP_GAP));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (k: number) => {
    if (phase !== 'input') return;
    if (k === order[done]) {
      chime.note(done);
      setLit(k);
      later(() => setLit(null), 180);
      if (done + 1 === order.length) {
        setPhase('clean');
        later(() => onResult(true), 700);
      }
      setDone(done + 1);
    } else {
      setMissed(k);
      setPhase('miss');
      chime.soft();
      later(() => onResult(false), 1200);
    }
  };

  return (
    <View style={styles.board}>
      <Prompt>
        {phase === 'show' ? PLAY_COPY.watch : phase === 'input' ? PLAY_COPY.yourTurn : phase === 'clean' ? PLAY_COPY.clean : PLAY_COPY.easing}
      </Prompt>
      <Grid
        size={SEQUENCE_SIZE}
        disabled={phase !== 'input'}
        onTap={tap}
        tone={(k) => (k === missed ? 'missed' : k === lit ? 'lit' : 'idle')}
      />
    </View>
  );
}

// ---- Ink ------------------------------------------------------------------------

export function InkBoard({ level, onResult, rng = Math.random }: BoardProps) {
  const round = useMemo(() => inkRound(level, rng), []); // eslint-disable-line react-hooks/exhaustive-deps
  const later = useLater();
  const [answered, setAnswered] = useState<Ink | null>(null);
  const correct = answered === round.ink;

  const answer = (ink: Ink) => {
    if (answered) return;
    setAnswered(ink);
    if (ink === round.ink) {
      chime.note(3);
      later(() => onResult(true), 350);
    } else {
      chime.soft();
      later(() => onResult(false), 1100);
    }
  };

  return (
    <View style={styles.board}>
      <Prompt>{answered && !correct ? PLAY_COPY.inkWas(PLAY_COPY.inks[round.ink]) : PLAY_COPY.inkAsk}</Prompt>
      <View style={styles.card}>
        <Text
          style={[styles.word, { color: gameInks[round.ink] }]}
          accessibilityLabel={PLAY_COPY.inkWordA11y(PLAY_COPY.inks[round.word], PLAY_COPY.inks[round.ink])}
        >
          {PLAY_COPY.inks[round.word]}
        </Text>
      </View>
      <View style={styles.options}>
        {round.options.map((ink) => (
          <View key={ink} style={styles.option}>
            <Button label={PLAY_COPY.inks[ink]} variant="secondary" disabled={!!answered} onPress={() => answer(ink)} />
          </View>
        ))}
      </View>
      <Text style={styles.note}>{PLAY_COPY.inkColourNote}</Text>
    </View>
  );
}

// ---- Shape or shade -----------------------------------------------------------------

export function SwitchBoard({ level, onResult, previousRule = null, onRule, rng = Math.random }: BoardProps) {
  const round = useMemo(() => switchRound(level, previousRule, rng), []); // eslint-disable-line react-hooks/exhaustive-deps
  const later = useLater();
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    onRule?.(round.rule);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (value: Shape | Shade) => {
    if (answered) return;
    setAnswered(true);
    const ok = value === round.answer;
    if (ok) chime.note(4);
    else chime.soft();
    later(() => onResult(ok), ok ? 300 : 800);
  };

  const choices: { value: Shape | Shade; label: string }[] =
    round.rule === 'shape'
      ? [
          { value: 'circle', label: PLAY_COPY.shapes.circle },
          { value: 'square', label: PLAY_COPY.shapes.square },
        ]
      : [
          { value: 'dark', label: PLAY_COPY.shades.dark },
          { value: 'light', label: PLAY_COPY.shades.light },
        ];

  return (
    <View style={styles.board}>
      <Prompt>{PLAY_COPY.rule[round.rule]}</Prompt>
      <View style={styles.card}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={PLAY_COPY.figureA11y(PLAY_COPY.shades[round.shade], PLAY_COPY.shapes[round.shape])}
          style={[
            styles.figure,
            round.shape === 'circle' && styles.figureCircle,
            round.shade === 'dark' ? styles.figureDark : styles.figureLight,
          ]}
        />
      </View>
      <View style={styles.options}>
        {choices.map((c) => (
          <View key={c.value} style={styles.option}>
            <Button label={c.label} variant="secondary" disabled={answered} onPress={() => answer(c.value)} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ---- Pairs ----------------------------------------------------------------------

export function PairsBoard({ level, onResult, rng = Math.random }: BoardProps) {
  const deck = useMemo(() => pairsDeck(level, rng), []); // eslint-disable-line react-hooks/exhaustive-deps
  const later = useLater();
  const [up, setUp] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const finished = matched.length === deck.length;

  const flip = (k: number) => {
    if (busy || up.includes(k) || matched.includes(k)) return;
    const next = [...up, k];
    setUp(next);
    if (next.length < 2) return;
    const [a, b] = next;
    if (deck[a] === deck[b]) {
      const all = [...matched, a, b];
      chime.note(all.length / 2);
      setMatched(all);
      setUp([]);
      if (all.length === deck.length) later(() => onResult(true), 1200);
    } else {
      setBusy(true);
      later(() => {
        setUp([]);
        setBusy(false);
      }, 900);
    }
  };

  const cell = (BOARD - 8 * 3) / 4;
  return (
    <View style={styles.board}>
      <Prompt>{finished ? PLAY_COPY.pairsDone : PLAY_COPY.yourTurn}</Prompt>
      <View style={[styles.grid, { width: BOARD, gap: 8 }]}>
        {deck.map((icon, k) => {
          const shown = up.includes(k) || matched.includes(k);
          return (
            <Pressable
              key={k}
              onPress={() => flip(k)}
              accessibilityRole="button"
              accessibilityLabel={shown ? PLAY_COPY.cardUp(k + 1, PLAY_COPY.pairNames[icon]) : PLAY_COPY.cardDown(k + 1)}
              style={[styles.tile, { width: cell, height: cell }, shown && styles.cardShown, matched.includes(k) && styles.cardMatched]}
            >
              {shown ? <Icon name={icon} size={30} color={matched.includes(k) ? colors.warmInk : colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: { alignItems: 'center' },
  prompt: { ...font.semibold, fontSize: 17, lineHeight: 24, color: colors.textPrimary, textAlign: 'center', marginBottom: 16, minHeight: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: {
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLit: { backgroundColor: colors.primary, borderColor: colors.primary },
  // A miss is shown in warm honey, never red.
  tileMissed: { backgroundColor: colors.warm, borderColor: colors.warmInk },
  cardShown: { backgroundColor: colors.surface, borderColor: colors.primary },
  cardMatched: { backgroundColor: colors.warm, borderColor: colors.warmInk },
  card: {
    width: BOARD,
    minHeight: 150,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  word: { ...font.extrabold, fontSize: 46 },
  options: { flexDirection: 'row', flexWrap: 'wrap', width: BOARD + 8, justifyContent: 'center' },
  option: { width: '50%', padding: 4 },
  note: { ...font.regular, fontSize: 13, color: colors.textMuted, marginTop: 10, textAlign: 'center' },
  figure: { width: 96, height: 96, borderRadius: 14, borderWidth: 3 },
  figureCircle: { borderRadius: 48 },
  figureDark: { backgroundColor: colors.primary, borderColor: colors.primary },
  figureLight: { backgroundColor: colors.warm, borderColor: colors.warmInk },
});
