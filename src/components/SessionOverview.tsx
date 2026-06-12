import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { Card } from './Card';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import { formatDuration } from '@/utils/format';

export function SessionOverview() {
  const session = useSessionStore((s) => s.currentSession);
  const blocks = useSessionStore((s) => s.composedBlocks);
  const startSession = useSessionStore((s) => s.startSession);
  const abandonSession = useSessionStore((s) => s.abandonSession);

  if (!session) return null;

  const totalDuration = blocks.reduce((acc, curr) => acc + curr.target_duration, 0);

  const stateContexts: Record<string, string> = {
    overloaded: "Today's goal is to recover. Your body is overloaded, so we have focused entirely on parasympathetic nervous system release and somatic relaxation.",
    recovering: "Today's goal is to mobilize. We are dynamic, gentle, and moving joints slowly to restore recovery momentum without exhausting you.",
    regulated: "Today's goal is balance. A standard hybrid of joint preparation, progressive bodyweight strength, and low-friction conditioning.",
    activated: "Today's goal is progress. You checked in with high energy, so we have channeled that capacity into a heavier strength block and conditioning flow.",
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingVertical: 12 }}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.stateTag}>State: {session.state}</Text>
          <Text style={styles.timeTag}>⏱️ {formatDuration(totalDuration)}</Text>
        </View>

        <Text style={styles.title}>Your Composed Session</Text>
        <Text style={styles.whyText}>{stateContexts[session.state] || 'Custom adaptive movement block composed.'}</Text>

        <View style={styles.timeline}>
          {blocks.map((block, index) => {
            const isLast = index === blocks.length - 1;
            return (
              <View key={block.dbBlockId} style={styles.timelineRow}>
                <View style={styles.iconCol}>
                  <Text style={styles.blockIcon}>
                    {block.exercise.category === 'regulate' ? '🌸' :
                     block.exercise.category === 'mobilize' ? '🌱' :
                     block.exercise.category === 'strengthen' ? '💪' :
                     block.exercise.category === 'move' ? '⚡' : '🌙'}
                  </Text>
                  {!isLast && <View style={styles.timelineLine} />}
                </View>
                
                <View style={styles.contentCol}>
                  <Text style={styles.blockTitle}>{block.exercise.name}</Text>
                  <Text style={styles.blockSub}>
                    {block.exercise.category} · {formatDuration(block.target_duration)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 24 }} />

        <Pressable style={styles.startBtn} onPress={startSession}>
          <Text style={styles.startBtnText}>Start Composed Session</Text>
        </Pressable>

        <Pressable style={styles.abandonBtn} onPress={abandonSession}>
          <Text style={styles.abandonBtnText}>Discard & Start Over</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    padding: 20,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stateTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.sageDark,
    backgroundColor: colors.sageLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeTag: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  whyText: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 24,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 16,
  },
  iconCol: {
    alignItems: 'center',
  },
  blockIcon: {
    fontSize: 20,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    backgroundColor: colors.border,
    flex: 1,
    marginVertical: 4,
  },
  contentCol: {
    flex: 1,
    paddingBottom: 24,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  blockSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  startBtn: {
    backgroundColor: colors.sage,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  abandonBtn: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  abandonBtnText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
