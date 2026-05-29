import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import type { PersonalBestEvent } from '@/utils/personalBests';

interface Props {
  events: PersonalBestEvent[];
}

export function PersonalBestCard({ events }: Props) {
  useEffect(() => {
    if (events.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [events.length]);

  if (events.length === 0) return null;

  return (
    <>
      {events.map((e) => (
        <Animated.View
          key={e.type}
          entering={FadeInDown.delay(200).springify()}
          exiting={FadeOut.duration(300)}
          style={styles.card}
        >
          <Text style={styles.icon}>⭐</Text>
          <View style={styles.text}>
            <Text style={styles.label}>Personal best</Text>
            <Text style={styles.message}>{e.message}</Text>
          </View>
        </Animated.View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.warmLight,
    borderColor: colors.warm,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: colors.warmDark,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  icon: { fontSize: 24 },
  text: { flex: 1 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warmDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warmDark,
    lineHeight: 20,
  },
});
