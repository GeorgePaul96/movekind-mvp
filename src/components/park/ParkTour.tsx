import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { colors, elevation } from '@/constants/colors';
import { TOUR_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import type { ParkLayout, ParkObject } from '@/domain/park/layout';
import { useSettingsStore } from '@/store/settingsStore';

/** Through the park, then the drawer. (The hammock joins when sleep arrives.) */
export const TOUR_STOPS = ['flowerbed', 'tree', 'river', 'path', 'drawer'] as const;
type Stop = (typeof TOUR_STOPS)[number];

/** Scroll offset that centres an object on screen, kept inside the park. */
export function tourScrollX(layout: ParkLayout, screenW: number, o: ParkObject): number {
  const r = layout.objects[o];
  return Math.max(0, Math.min(r.x + r.w / 2 - screenW / 2, layout.worldW - screenW));
}

interface Props {
  layout: ParkLayout;
  screenW: number;
  scrollTo: (x: number) => void;
  focusObject?: (o: ParkObject | null) => void;
  onDone: () => void;
}

/** A short first-visit walk: highlights each object with one line about it. Skippable any time. */
export function ParkTour({ layout, screenW, scrollTo, focusObject, onDone }: Props) {
  const markSeen = useSettingsStore((s) => s.markParkTourSeen);
  const [i, setI] = useState(0);
  const stop: Stop = TOUR_STOPS[i]!;
  const last = i === TOUR_STOPS.length - 1;

  useEffect(() => {
    if (stop !== 'drawer') {
      scrollTo(tourScrollX(layout, screenW, stop));
      focusObject?.(stop);
    } else {
      focusObject?.(null);
    }
    return () => focusObject?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop]);

  const finish = () => {
    focusObject?.(null);
    markSeen().catch(() => {});
    onDone();
  };

  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      <Text style={styles.line}>{TOUR_COPY.steps[stop]}</Text>
      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button label={TOUR_COPY.skip} variant="link" size="sm" onPress={finish} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={last ? TOUR_COPY.done : TOUR_COPY.next} size="sm" onPress={() => (last ? finish() : setI(i + 1))} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '8%',
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    ...elevation.raised,
  },
  line: { ...font.bold, fontSize: 17, lineHeight: 25, color: colors.textPrimary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
});
