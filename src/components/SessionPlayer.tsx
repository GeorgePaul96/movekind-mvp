import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Vibration, ActivityIndicator } from 'react-native';
import * as Speech from 'expo-speech';
import { Card } from './Card';
import { Button } from './Button';
import { colors, stateColors } from '@/constants/colors';
import { SESSION_COPY } from '@/constants/copy';
import { useSessionStore } from '@/store/sessionStore';
import { formatClock } from '@/utils/format';
import { speechParamsForState } from '@/domain/sessions/voice';

export function SessionPlayer() {
  const session = useSessionStore((s) => s.currentSession);
  const blocks = useSessionStore((s) => s.composedBlocks);
  const activeIndex = useSessionStore((s) => s.activeBlockIndex);
  const completeBlock = useSessionStore((s) => s.completeBlock);
  const skipBlock = useSessionStore((s) => s.skipBlock);
  const abandonSession = useSessionStore((s) => s.abandonSession);

  const activeBlock = blocks[activeIndex];
  const [timeLeft, setTimeLeft] = useState(activeBlock?.target_duration || 0);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef<any>(null);

  // Trigger Speech cues on block change
  useEffect(() => {
    if (!activeBlock || !session) return;

    // Reset timer time left
    setTimeLeft(activeBlock.target_duration);
    setIsPaused(false);

    // Speak details, tuned to the user's capacity state (gentler when depleted)
    const voice = speechParamsForState(session.state);
    Speech.stop();
    Speech.speak(`Next exercise: ${activeBlock.exercise.name}.`, {
      pitch: voice.pitch,
      rate: voice.rate,
    });

    const spokenCues = activeBlock.exercise.cues.slice(0, voice.maxSpokenCues);
    if (spokenCues.length > 0) {
      Speech.speak(`Cues: ${spokenCues.join('. ')}`, {
        pitch: voice.pitch,
        rate: voice.rate,
      });
    }

    // Trigger haptic vibration
    Vibration.vibrate(200);

    return () => {
      Speech.stop();
    };
  }, [activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer loop
  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleBlockComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeBlock || !session) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleBlockComplete = () => {
    Vibration.vibrate([0, 100, 100, 100]); // double tap haptic
    completeBlock(activeBlock.dbBlockId, activeBlock.target_duration - timeLeft);
  };

  const handleSkip = () => {
    Vibration.vibrate(50);
    skipBlock(activeBlock.dbBlockId);
  };

  const exercise = activeBlock.exercise;
  const mood = stateColors[session.state];

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.progressText}>{SESSION_COPY.progress(activeIndex + 1, blocks.length)}</Text>
          <Text style={[styles.categoryTag, { color: mood.ink, backgroundColor: mood.soft, borderColor: mood.ink }]}>
            {exercise.category}
          </Text>
        </View>

        <Text style={styles.exerciseName} accessibilityRole="header">{exercise.name}</Text>

        {/* Mood-colored panel until real exercise illustrations land (separate roadmap item). */}
        <View
          style={[styles.visualBox, { backgroundColor: mood.soft, borderColor: mood.ink }]}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Text style={styles.visualIcon}>{CATEGORY_ICON[exercise.category] ?? '🌙'}</Text>
        </View>

        <Text
          style={styles.timer}
          accessibilityLabel={`${Math.floor(timeLeft / 60)} minutes ${timeLeft % 60} seconds remaining`}
        >
          {formatClock(timeLeft)}
        </Text>

        {exercise.cues.length > 0 && (
          <View style={styles.cuesContainer}>
            <Text style={styles.cuesTitle}>{SESSION_COPY.howTo}</Text>
            {exercise.cues.map((cue, idx) => (
              <Text key={idx} style={styles.cueText}>• {cue}</Text>
            ))}
          </View>
        )}

        <View style={styles.controls}>
          <Button
            label={isPaused ? SESSION_COPY.resume : SESSION_COPY.pause}
            accessibilityLabel={isPaused ? 'Resume exercise' : 'Pause exercise'}
            onPress={() => setIsPaused(!isPaused)}
          />
          <Button
            label={SESSION_COPY.skip}
            variant="secondary"
            accessibilityLabel="Skip this exercise"
            onPress={handleSkip}
          />
          <Button
            label={SESSION_COPY.endEarly}
            variant="link"
            accessibilityHint={SESSION_COPY.endEarlyHint}
            onPress={abandonSession}
          />
        </View>
      </Card>
    </View>
  );
}

const CATEGORY_ICON: Record<string, string> = {
  regulate: '🌸',
  mobilize: '🌱',
  strengthen: '💪',
  move: '⚡',
  downshift: '🌙',
};

const styles = StyleSheet.create({
  container: { paddingVertical: 12, flex: 1 },
  card: { padding: 20, borderRadius: 20, alignItems: 'center', flex: 1 },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  categoryTag: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  exerciseName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  visualBox: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  visualIcon: { fontSize: 56 },
  timer: { fontSize: 52, fontWeight: '800', color: colors.textPrimary, marginBottom: 20 },
  cuesContainer: {
    width: '100%',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  cuesTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
  cueText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22, marginTop: 2 },
  controls: { width: '100%', gap: 10 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
