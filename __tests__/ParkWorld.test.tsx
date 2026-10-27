import React from 'react';
import { render } from '@testing-library/react-native';
import type { GardenState } from '../src/domain/garden/garden';
import { parkLayout } from '../src/domain/park/layout';
import { ParkWorld } from '../src/components/park/ParkWorld';

const base: GardenState = { stream: 1, ducks: false, grass: 2, tree: 3, birds: true, flowers: [], resting: false, weather: 'clear' };
const layout = parkLayout(412, 915);
const world = (state: Partial<GardenState> = {}) => render(<ParkWorld layout={layout} state={{ ...base, ...state }} light="day" />);

describe('<ParkWorld />', () => {
  it('the tree grows through its stages', () => {
    expect(world({ tree: 0, birds: false }).queryAllByTestId('sprout')).toHaveLength(1);
    expect(world({ tree: 1, birds: false }).queryAllByTestId('sapling')).toHaveLength(1);
    const full = world({ tree: 3 });
    expect(full.queryAllByTestId('tree')).toHaveLength(1);
    expect(full.queryAllByTestId('trunk')).toHaveLength(1);
    expect(full.queryAllByTestId('bird')).toHaveLength(2);
    expect(full.queryAllByTestId('blossom')).toHaveLength(0);
    expect(world({ tree: 4 }).queryAllByTestId('blossom').length).toBeGreaterThan(0);
    expect(world({ tree: 5 }).queryAllByTestId('fruit').length).toBeGreaterThan(0);
    expect(world({ tree: 6 }).queryAllByTestId('second-tree')).toHaveLength(1);
  });

  it('the flowerbed is there before any flowers, then holds one per day', () => {
    const empty = world();
    expect(empty.queryAllByTestId('flowerbed-soil')).toHaveLength(1);
    expect(empty.queryAllByTestId('flower')).toHaveLength(0);
    const two = world({ flowers: [{ day: '2026-10-26', mood: 'regulated' }, { day: '2026-10-27', mood: 'activated' }] as GardenState['flowers'] });
    expect(two.queryAllByTestId('flower')).toHaveLength(2);
  });

  it('the river and the walkway are each one unbroken shape', () => {
    const w = world();
    expect(w.queryAllByTestId('river-water')).toHaveLength(1);
    expect(w.queryAllByTestId('walkway')).toHaveLength(1);
  });
});
