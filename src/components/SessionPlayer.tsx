import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Vibration, ActivityIndicator } from 'react-native';
import * as Speech from 'expo-speech';
import { Card } from './Card';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import { formatDuration } from '@/utils/format';

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
    if (!activeBlock) return;
    
    // Reset timer time left
    setTimeLeft(activeBlock.target_duration);
    setIsPaused(false);

    // Speak details
    Speech.stop();
    Speech.speak(`Next exercise: ${activeBlock.exercise.name}.`, {
      pitch: 1.0,
      rate: 0.95,
    });

    if (activeBlock.exercise.cues.length > 0) {
      Speech.speak(`Cues: ${activeBlock.exercise.cues.join('. ')}`, {
        pitch: 1.0,
        rate: 0.95,
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
        <ActivityIndicator size="large" color={colors.sage} />
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

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.progressText}>
            Block {activeIndex + 1} of {blocks.length}
          </Text>
          <Text style={styles.categoryTag}>{exercise.category}</Text>
        </View>

        <Text style={styles.exerciseName} accessibilityRole="header">{exercise.name}</Text>

        {/* Static illustration placeholder - styled box representing SVG */}
        <View style={styles.illustrationBox} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={styles.illustrationIcon}>
            {exercise.category === 'regulate' ? '🌸' :
             exercise.category === 'mobilize' ? '🌱' :
             exercise.category === 'strengthen' ? '💪' :
             exercise.category === 'move' ? '⚡' : '🌙'}
          </Text>
          <Text style={styles.illustrationText}>[Static illustration: {exercise.illustration_ref}]</Text>
        </View>

        <Text
          style={styles.timer}
          accessibilityLabel={`${Math.floor(timeLeft / 60)} minutes ${timeLeft % 60} seconds remaining`}
        >
          {formatDuration(timeLeft)}
        </Text>

        <View style={styles.cuesContainer}>
          <Text style={styles.cuesTitle}>Coaching Cues:</Text>
          {exercise.cues.map((cue, idx) => (
            <Text key={idx} style={styles.cueText}>• {cue}</Text>
          ))}
        </View>

        <View style={styles.controlsRow}>
          <Pressable
            style={[styles.controlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]}
            onPress={() => setIsPaused(!isPaused)}
            accessibilityRole="button"
            accessibilityLabel={isPaused ? 'Resume exercise' : 'Pause exercise'}
          >
            <Text style={styles.controlBtnText}>{isPaused ? '▶ Resume' : '⏸ Pause'}</Text>
          </Pressable>

          <Pressable
            style={[styles.controlBtn, styles.skipBtn]}
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip this exercise"
          >
            <Text style={[styles.controlBtnText, { color: colors.muted }]}>⏭ Skip</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.abandonBtn}
          onPress={abandonSession}
          accessibilityRole="button"
          accessibilityLabel="Quit session"
        >
          <Text style={styles.abandonText}>Quit Session</Text>
        </Pressable>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    flex: 1,
  },
  card: {
    padding: 20,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    alignItems: 'center',
    flex: 1,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.warmDark,
    backgroundColor: colors.warmLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 16,
  },
  illustrationBox: {
    width: '100%',
    height: 180,
    backgroundColor: colors.bg,
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  illustrationIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  illustrationText: {
    fontSize: 11,
    color: colors.muted,
    fontStyle: 'italic',
  },
  timer: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 20,
  },
  cuesContainer: {
    width: '100%',
    alignItems: 'flex-start',
    backgroundColor: colors.bg,
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  cuesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  cueText: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  controlBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  pauseBtn: {
    backgroundColor: colors.sage,
  },
  resumeBtn: {
    backgroundColor: colors.warm,
  },
  skipBtn: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  abandonBtn: {
    marginTop: 20,
    padding: 8,
  },
  abandonText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
