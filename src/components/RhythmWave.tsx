import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import type { WeekCount } from '@/utils/rhythmScore';

interface Props {
  weeks: WeekCount[];
}

const MAX_HEIGHT = 72;
const MAX_SESSIONS = 7;

export function RhythmWave({ weeks }: Props) {
  return (
    <View style={styles.container}>
      {weeks.map((w, i) => {
        const fillHeight =
          w.sessions > 0
            ? Math.max(6, Math.round((w.sessions / MAX_SESSIONS) * MAX_HEIGHT))
            : 0;

        return (
          <View key={i} style={styles.col}>
            <View style={styles.barTrack}>
              {fillHeight > 0 ? (
                <View
                  style={[
                    styles.bar,
                    {
                      height: fillHeight,
                      backgroundColor: w.isCurrent ? colors.sageDark : colors.sageMid,
                    },
                  ]}
                />
              ) : (
                <View style={[styles.emptyBar, { height: 4 }]} />
              )}
            </View>
            {w.isCurrent ? (
              <Text style={styles.nowLabel}>now</Text>
            ) : (
              <View style={styles.labelSpacer} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: MAX_HEIGHT + 20,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: MAX_HEIGHT + 20,
  },
  barTrack: {
    height: MAX_HEIGHT,
    justifyContent: 'flex-end',
    width: '70%',
  },
  bar: {
    borderRadius: 4,
    width: '100%',
  },
  emptyBar: {
    borderRadius: 2,
    width: '50%',
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  nowLabel: {
    fontSize: 8,
    color: colors.sageDark,
    fontWeight: '700',
    marginTop: 4,
  },
  labelSpacer: {
    height: 12,
  },
});
