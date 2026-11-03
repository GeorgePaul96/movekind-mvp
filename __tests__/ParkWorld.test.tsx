import React from 'react';
import { render } from '@testing-library/react-native';
import type { SharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import type { GardenState } from '../src/domain/garden/garden';
import { parkLayout } from '../src/domain/park/layout';
import { ParkWorld } from '../src/components/park/ParkWorld';
import type { ParkLight } from '../src/components/park/ParkLayers';

const base: GardenState = { stream: 1, ducks: false, grass: 2, tree: 3, birds: true, flowers: [], resting: false, weather: 'clear' };
const layout = parkLayout(412, 915);
const clock = { value: 0 } as SharedValue<number>;
let mockReduce = false;
jest.mock('../src/hooks/useReduceMotion', () => ({ useReduceMotion: () => mockReduce }));
beforeEach(() => {
  mockReduce = false;
});

const world = (state: Partial<GardenState> = {}, light: ParkLight = 'day', untended: Set<string> = new Set()) =>
  render(<ParkWorld clock={clock} layout={layout} state={{ ...base, ...state }} light={light} untended={untended} />);

describe('<ParkWorld />', () => {
  it('the drawn ground is the base of the park', () => {
    expect(world().queryAllByTestId('ground-art')).toHaveLength(1);
  });

  it('the tree shows the drawing for its growth stage', () => {
    for (const stage of [0, 1, 2, 3, 4, 5] as const) {
      expect(world({ tree: stage, birds: false }).queryAllByTestId(`tree-stage-${stage}`)).toHaveLength(1);
    }
    const six = world({ tree: 6 });
    expect(six.queryAllByTestId('tree-stage-5')).toHaveLength(1);
    expect(six.queryAllByTestId('second-tree')).toHaveLength(1);
  });

  it('birds come with the tree once workouts bring them', () => {
    expect(world({ tree: 3, birds: true }).queryAllByTestId('birds')).toHaveLength(1);
    expect(world({ tree: 3, birds: false }).queryAllByTestId('birds')).toHaveLength(0);
  });

  it('a duck floats on the river once water brings it', () => {
    expect(world({ ducks: true }).queryAllByTestId('duck')).toHaveLength(1);
    expect(world({ ducks: false }).queryAllByTestId('duck')).toHaveLength(0);
  });

  it('a fawn stands by the river by day, sleeps at night or when resting, and marks cue-river only when untended', () => {
    const tendedDay = world({}, 'day', new Set());
    expect(tendedDay.queryAllByTestId('fawn')).toHaveLength(1);
    expect(tendedDay.queryAllByTestId('fawn-sleeping')).toHaveLength(0);
    expect(tendedDay.queryAllByTestId('cue-river')).toHaveLength(0);

    const untendedDay = world({}, 'day', new Set(['river']));
    expect(untendedDay.queryAllByTestId('fawn')).toHaveLength(1);
    expect(untendedDay.queryAllByTestId('cue-river')).toHaveLength(1);

    const nightWorld = world({}, 'night', new Set(['river']));
    expect(nightWorld.queryAllByTestId('fawn-sleeping')).toHaveLength(1);
    expect(nightWorld.queryAllByTestId('fawn')).toHaveLength(0);

    const restingWorld = world({ resting: true }, 'day');
    expect(restingWorld.queryAllByTestId('fawn-sleeping')).toHaveLength(1);

    mockReduce = true;
    const reducedUntended = world({}, 'day', new Set(['river']));
    expect(reducedUntended.queryAllByTestId('fawn')).toHaveLength(1);
    expect(reducedUntended.queryAllByTestId('cue-river')).toHaveLength(1);
  });

  it('a rabbit hops the meadow by day, sleeps at night, and sits still with Reduce Motion', () => {
    expect(world({}, 'day').queryAllByTestId('rabbit-hopping')).toHaveLength(1);
    expect(world({}, 'night').queryAllByTestId('rabbit-sleeping')).toHaveLength(1);
    expect(world({ resting: true }, 'day').queryAllByTestId('rabbit-sleeping')).toHaveLength(1);
    mockReduce = true;
    expect(world({}, 'day').queryAllByTestId('rabbit-sitting')).toHaveLength(1);
  });

  it('butterflies visit the flowerbed until the day has a check-in', () => {
    expect(world({}, 'day', new Set(['flowerbed'])).queryAllByTestId('butterfly')).toHaveLength(2);
    expect(world({}, 'day', new Set()).queryAllByTestId('butterfly')).toHaveLength(0);
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

  it('daylight needs no tint; dawn, dusk, night and rain each tint the scene', () => {
    expect(world({}, 'day').queryAllByTestId('light-tint')).toHaveLength(0);
    for (const l of ['dawn', 'dusk', 'night', 'rain'] as const) expect(world({}, l).queryAllByTestId('light-tint')).toHaveLength(1);
  });
});
