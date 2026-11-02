import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';
import type { GardenState } from '@/domain/garden/garden';
import type { ParkLight } from './ParkLayers';
import { SwayWrap, usePopOnChange } from './Motion';
import { TreeCanopyArt, TreeTrunkArt } from './art/TreeArt';
import { RobinsArt } from './art/CrittersArt';

interface Props {
  clock: SharedValue<number>;
  stage: GardenState['tree'];
  /** Workouts logged so far: each new one makes the tree pop. */
  logged: number;
  birds: boolean;
  asleep: boolean;
  cue: boolean;
  light: ParkLight;
  x: number;
  y: number;
  width: number;
}

/**
 * The hero cartoon tree. The trunk stays planted in the grass; only the canopy sways gently
 * around the trunk-crown junction. Each logged workout triggers a gentle squash-and-stretch pop.
 */
export function ParkTree({ clock, stage, logged, birds, asleep, cue, light, x, y, width }: Props) {
  const s = Math.min(stage, 5);
  const popStyle = usePopOnChange(logged);
  const mainLeft = x - width / 2;
  const mainTop = y - width * 0.9;

  const youngW = width * 0.42;
  const youngLeft = x + width * 0.2; // further up the hill, between the big tree and the hammock
  const youngTop = y - youngW * 0.92 - width * 0.12;

  return (
    <View testID={cue ? 'cue-tree' : undefined} pointerEvents="none" style={StyleSheet.absoluteFill}>
      {stage >= 6 && (
        <View
          testID="second-tree"
          style={[styles.abs, { left: youngLeft, top: youngTop, width: youngW, height: youngW }]}
        >
          <TreeTrunkArt stage={2} width={youngW} height={youngW} />
          <SwayWrap
            clock={clock}
            degrees={0.6}
            periodSec={5.6}
            phase={1.4}
            originY="center"
            style={{ left: 0, top: 0, width: youngW, height: youngW }}
          >
            <TreeCanopyArt stage={2} light={light} width={youngW} height={youngW} />
          </SwayWrap>
        </View>
      )}

      <Animated.View
        testID={`tree-stage-${s}`}
        style={[
          styles.abs,
          { left: mainLeft, top: mainTop, width, height: width, transformOrigin: '50% 90%' },
          popStyle,
        ]}
      >
        <TreeTrunkArt stage={s} width={width} height={width} />

        <SwayWrap
          clock={clock}
          degrees={cue ? 1.5 : 0.5}
          periodSec={cue ? 3.4 : 5.4}
          originY="center"
          style={{ left: 0, top: 0, width, height: width }}
        >
          <TreeCanopyArt stage={s} light={light} width={width} height={width} />
          {birds && stage >= 3 && (
            <View
              testID="birds"
              style={[
                styles.abs,
                {
                  left: width * 0.56,
                  top: width * 0.36,
                  opacity: asleep ? 0.85 : 1,
                },
              ]}
            >
              <RobinsArt size={width * 0.22} />
            </View>
          )}
        </SwayWrap>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
