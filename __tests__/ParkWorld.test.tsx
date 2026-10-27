import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { GardenState } from '../src/domain/garden/garden';
import { parkLayout } from '../src/domain/park/layout';
import { ParkWorld } from '../src/components/park/ParkWorld';
import type { ParkLight } from '../src/components/park/ParkLayers';

const base: GardenState = { stream: 1, ducks: false, grass: 2, tree: 3, birds: true, flowers: [], resting: false, weather: 'clear' };
const layout = parkLayout(412, 915);
const world = (state: Partial<GardenState> = {}, light: ParkLight = 'day') =>
  render(<ParkWorld layout={layout} state={{ ...base, ...state }} light={light} />);

describe('<ParkWorld />', () => {
  it('the painted ground is the base of the park', () => {
    expect(world().queryAllByTestId('ground-art')).toHaveLength(1);
  });

  it('the tree shows the painting for its growth stage', () => {
    for (const stage of [0, 1, 2, 3, 4, 5] as const) {
      expect(world({ tree: stage, birds: false }).queryAllByTestId(`tree-stage-${stage}`)).toHaveLength(1);
    }
    const six = world({ tree: 6 });
    expect(six.queryAllByTestId('tree-stage-5')).toHaveLength(1);
    expect(six.queryAllByTestId('second-tree')).toHaveLength(1);
  });

  it('birds come with the tree once workouts bring them', () => {
    expect(world({ tree: 3, birds: true }).queryAllByTestId('bird')).toHaveLength(2);
    expect(world({ tree: 3, birds: false }).queryAllByTestId('bird')).toHaveLength(0);
  });

  it('the flowerbed is there before any flowers, then holds one per day', () => {
    const empty = world();
    expect(empty.queryAllByTestId('flowerbed-art')).toHaveLength(1);
    expect(empty.queryAllByTestId('flower')).toHaveLength(0);
    const two = world({ flowers: [{ day: '2026-10-26', mood: 'regulated' }, { day: '2026-10-27', mood: 'activated' }] });
    expect(two.queryAllByTestId('flower')).toHaveLength(2);
  });

  it('more water makes the river sparkle more', () => {
    const glints = (stream: number) => StyleSheet.flatten(world({ stream: stream as GardenState['stream'] }).getByTestId('river-glint').props.style).opacity as number;
    expect(glints(3)).toBeGreaterThan(glints(0));
  });

  it('daylight needs no tint; dawn, dusk, night and rain each tint the painting', () => {
    expect(world({}, 'day').queryAllByTestId('light-tint')).toHaveLength(0);
    for (const l of ['dawn', 'dusk', 'night', 'rain'] as const) expect(world({}, l).queryAllByTestId('light-tint')).toHaveLength(1);
  });
});
