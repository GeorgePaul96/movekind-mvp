import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { Hotspot } from '@/components/park/Hotspot';
import { useParkClock } from '@/components/park/Motion';
import { yardColors, type YardLight } from '@/constants/colors';
import { YARD_COPY } from '@/constants/copy';
import type { GardenState } from '@/domain/garden/garden';
import type { SkyPhase } from '@/domain/garden/sky';
import { yardLayout, type Point, type YardObject } from '@/domain/yard/layout';
import type { DogAction } from '@/domain/yard/script';
import type { YardMood } from '@/types';
import { YardEnvironmentArt } from './art/YardEnvironmentArt';
import { BallArt, CushionArt, FoodBowlArt, WaterBowlArt } from './art/YardPropsArt';
import { Maple } from './Maple';
import { Pudding, type PuddingMode } from './Pudding';
import { SpeechBubble } from './SpeechBubble';

export interface BloomCounts {
  water: number;
  food: number;
  ball: number;
  pudding: number;
  mood: number;
}

interface Props {
  width: number;
  height: number;
  state: GardenState;
  phase: SkyPhase;
  mood: YardMood | null;
  mapleSpot: Point;
  mapleAction: DogAction;
  puddingSpot: Point;
  puddingMode: PuddingMode;
  ballSpot: Point;
  petCount: number;
  hopCount: number;
  rollTrigger: number;
  blooms: BloomCounts;
  bubble: { speaker: 'Maple' | 'Pudding'; text: string } | null;
  onTapObject: (object: YardObject) => void;
}

export function YardScene({
  width,
  height,
  state,
  phase,
  mood,
  mapleSpot,
  mapleAction,
  puddingSpot,
  puddingMode,
  ballSpot,
  petCount,
  hopCount,
  rollTrigger,
  blooms,
  bubble,
  onTapObject,
}: Props) {
  const clock = useParkClock();
  const layout = useMemo(() => yardLayout(width, height), [width, height]);

  const light: YardLight =
    state.resting || phase === 'night' ? 'night' : state.weather === 'rain' ? 'rain' : phase;
  const puddingAwake = puddingMode === 'wake' || puddingMode === 'walk' || puddingMode === 'eat';
  const summary = YARD_COPY.sceneSummary(mood, puddingAwake, state.resting, state.weather === 'rain');

  const bloomedSpots = useMemo(() => {
    const list: { point: Point; color: string }[] = [];
    const palette = [
      yardColors.flower.pink,
      yardColors.flower.butter,
      yardColors.flower.lilac,
      yardColors.flower.coral,
    ];
    const pushFor = (key: keyof BloomCounts, count: number) => {
      const anchors = layout.flowerAnchors[key];
      for (let i = 0; i < Math.min(count, anchors.length); i++) {
        list.push({ point: anchors[i]!, color: palette[(list.length + i) % palette.length]! });
      }
    };
    pushFor('water', blooms.water);
    pushFor('food', blooms.food);
    pushFor('ball', blooms.ball);
    pushFor('pudding', blooms.pudding);
    pushFor('mood', blooms.mood);
    return list;
  }, [blooms, layout]);

  const mapleEl = (
    <Maple
      key="maple"
      clock={clock}
      spot={mapleSpot}
      size={layout.mapleSize}
      mood={mood}
      action={mapleAction}
      resting={state.resting}
      petCount={petCount}
      hopCount={hopCount}
    />
  );

  const puddingEl = (
    <Pudding
      key="pudding"
      clock={clock}
      spot={puddingSpot}
      size={layout.puddingSize}
      mode={state.resting ? 'sleep' : puddingMode}
      rollTrigger={rollTrigger}
    />
  );

  return (
    <View
      style={[styles.root, { width, height }]}
      accessible={false}
      accessibilityLabel={summary}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <YardEnvironmentArt
          layout={layout}
          light={light}
          treeStage={state.tree}
          birds={state.birds}
          bloomedSpots={bloomedSpots}
        />
        <CushionArt spot={layout.cushionSpot} />
        <WaterBowlArt spot={layout.spots.water} drinking={mapleAction === 'drink'} />
        <FoodBowlArt spot={layout.spots.food} eating={mapleAction === 'eat' || puddingMode === 'eat'} />
        <BallArt spot={ballSpot} />
      </Svg>

      {/* While Pudding is up, draw him in front of Maple so he isn't hidden behind her at the bowl */}
      {puddingAwake ? [mapleEl, puddingEl] : [puddingEl, mapleEl]}

      {bubble && (
        <SpeechBubble
          speaker={bubble.speaker}
          text={bubble.text}
          anchor={bubble.speaker === 'Pudding' ? puddingSpot : mapleSpot}
          screenW={width}
          screenH={height}
        />
      )}

      {/* Accessible 48pt+ Hotspots */}
      {(Object.keys(layout.rects) as YardObject[]).map((obj) => (
        <Hotspot
          key={obj}
          object={obj}
          rect={layout.rects[obj]}
          label={YARD_COPY.objects[obj].label}
          hint={YARD_COPY.objects[obj].hint}
          onPress={onTapObject}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'relative', overflow: 'hidden' },
});