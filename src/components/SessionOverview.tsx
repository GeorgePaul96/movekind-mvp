import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { colors, stateColors } from '@/constants/colors';
import { MOOD_COPY, SESSION_COPY } from '@/constants/copy';
import { useSessionStore } from '@/store/sessionStore';
import { formatSecondsAsMinutes } from '@/utils/format';

const CATEGORY_ICON: Record<string, string> = {
  regulate: '🌸',
  mobilize: '🌱',
  strengthen: '💪',
  move: '⚡',
  downshift: '🌙',
};

export function SessionOverview() {
  const session = useSessionStore((s) => s.currentSession);
  const blocks = useSessionStore((s) => s.composedBlocks);
  const startSession = useSessionStore((s) => s.startSession);
  const abandonSession = useSessionStore((s) => s.abandonSession);

  if (!session) return null;

  const totalDuration = blocks.reduce((acc, curr) => acc + curr.target_duration, 0);
  const mood = stateColors[session.state];

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={[styles.stateTag, { color: mood.ink, backgroundColor: mood.soft, borderColor: mood.ink }]}>
            {MOOD_COPY[session.state].emoji} {MOOD_COPY[session.state].label}
          </Text>
          <Text style={styles.timeTag} accessibilityLabel={`About ${formatSecondsAsMinutes(totalDuration)}`}>
            ⏱️ {formatSecondsAsMinutes(totalDuration)}
          </Text>
        </View>

        <Text style={styles.title} accessibilityRole="header">{SESSION_COPY.overviewTitle}</Text>
        <Text style={styles.whyText}>{SESSION_COPY.why[session.state]}</Text>

        <View style={styles.timeline}>
          {blocks.map((block, index) => {
            const isLast = index === blocks.length - 1;
            return (
              <View key={block.dbBlockId} style={styles.timelineRow}>
                <View style={styles.iconCol}>
                  <Text style={styles.blockIcon} importantForAccessibility="no" accessibilityElementsHidden>
                    {CATEGORY_ICON[block.exercise.category] ?? '🌙'}
                  </Text>
                  {!isLast && <View style={styles.timelineLine} />}
                </View>

                <View style={styles.contentCol}>
                  <Text style={styles.blockTitle}>{block.exercise.name}</Text>
                  <Text style={styles.blockSub}>
                    {block.exercise.category} · {formatSecondsAsMinutes(block.target_duration)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ gap: 6, marginTop: 8 }}>
          <Button label={SESSION_COPY.start} onPress={startSession} />
          <Button
            label={SESSION_COPY.discard}
            variant="link"
            accessibilityHint={SESSION_COPY.discardHint}
            onPress={abandonSession}
          />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 12 },
  card: { padding: 20, borderRadius: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stateTag: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  timeTag: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  whyText: { fontSize: 15, color: colors.textSecondary, lineHeight: 21, marginBottom: 24 },
  timeline: { paddingLeft: 4 },
  timelineRow: { flexDirection: 'row', gap: 16 },
  iconCol: { alignItems: 'center' },
  blockIcon: { fontSize: 20, zIndex: 1 },
  timelineLine: { width: 2, backgroundColor: colors.border, flex: 1, marginVertical: 4 },
  contentCol: { flex: 1, paddingBottom: 20 },
  blockTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  blockSub: { fontSize: 14, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
});
