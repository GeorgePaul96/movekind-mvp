import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { InkBoard, PairsBoard, PatternBoard, SequenceBoard, SwitchBoard, type BoardProps } from '@/components/games/boards';
import { colors } from '@/constants/colors';
import { PLAY_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { GAME_RULES, START, stairStep, type GameId, type Stair, type SwitchRule } from '@/domain/games/games';
import { telemetry } from '@/services/telemetry';

const BOARDS: Record<GameId, React.ComponentType<BoardProps>> = {
  pattern: PatternBoard,
  sequence: SequenceBoard,
  ink: InkBoard,
  switch: SwitchBoard,
  pairs: PairsBoard,
};

/**
 * One game, full screen. It runs a set of rounds on a gentle staircase (two clean rounds
 * step up, a miss steps down), then stops. There is no timer, no losing, and nothing is
 * scored or saved: the level lives only as long as the screen is open.
 */
export function GameScreen({ id, onClose }: { id: GameId; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const rules = GAME_RULES[id];
  const Board = BOARDS[id];
  const [stair, setStair] = useState<Stair>(START);
  const [round, setRound] = useState(1);
  const [sets, setSets] = useState(0);
  const [finished, setFinished] = useState(false);
  const lastRule = useRef<SwitchRule | null>(null);

  const onResult = (correct: boolean) => {
    // Pairs has no misses: each finished board simply offers a bigger one next.
    setStair((s) => (id === 'pairs' ? { level: Math.min(rules.maxLevel, s.level + 1), streak: 0 } : stairStep(s, correct, rules.maxLevel)));
    if (round >= rules.rounds) {
      setFinished(true);
      telemetry.capture('played', { game: id });
    } else {
      setRound(round + 1);
    }
  };

  const again = () => {
    setRound(1);
    setSets(sets + 1);
    setFinished(false);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.top}>
        <View style={styles.grow}>
          <Text style={styles.title} accessibilityRole="header">
            {PLAY_COPY.games[id].name}
          </Text>
          {!finished ? (
            <Text style={styles.meta}>
              {rules.rounds > 1 ? `${PLAY_COPY.round(round, rules.rounds)}, ` : ''}
              {PLAY_COPY.level(stair.level)}
            </Text>
          ) : null}
        </View>
        <Button label={PLAY_COPY.close} variant="link" size="sm" accessibilityLabel={PLAY_COPY.closeA11y} onPress={onClose} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {finished ? (
          <View style={styles.done}>
            <Text style={styles.doneTitle}>{PLAY_COPY.setDone}</Text>
            <Text style={styles.doneBody}>{PLAY_COPY.setDoneBody}</Text>
            <View style={styles.doneButton}>
              <Button label={PLAY_COPY.again} onPress={again} />
            </View>
            <Button label={PLAY_COPY.back} variant="secondary" onPress={onClose} />
          </View>
        ) : (
          <Board
            // A fresh board for every round.
            key={`${sets}:${round}`}
            level={stair.level}
            onResult={onResult}
            previousRule={lastRule.current}
            onRule={(rule) => {
              lastRule.current = rule;
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 8 },
  grow: { flex: 1 },
  title: { ...font.extrabold, fontSize: 26, color: colors.textPrimary },
  meta: { ...font.medium, fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, alignItems: 'center' },
  done: { width: '100%', maxWidth: 420, backgroundColor: colors.warm, borderRadius: 28, padding: 22 },
  doneTitle: { ...font.extrabold, fontSize: 26, color: colors.textPrimary },
  doneBody: { ...font.medium, fontSize: 16, lineHeight: 24, color: colors.textSecondary, marginTop: 6, marginBottom: 18 },
  doneButton: { marginBottom: 10 },
});
