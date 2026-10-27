import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { GardenState } from '../src/domain/garden/garden';
import type { ParkObject } from '../src/domain/park/layout';
import { PARK_COPY } from '../src/constants/copy';

let mockReducedMotion = false;
jest.mock('../src/hooks/useReduceMotion', () => ({ useReduceMotion: () => mockReducedMotion }));

import { ParkScene } from '../src/components/park/ParkScene';

const base: GardenState = { stream: 1, ducks: false, grass: 2, tree: 3, birds: true, flowers: [], resting: false, weather: 'clear' };
const OBJECTS: ParkObject[] = ['river', 'tree', 'flowerbed', 'hammock', 'path'];

function scene(props: Partial<React.ComponentProps<typeof ParkScene>> = {}) {
  return render(
    <ParkScene
      state={base}
      phase="day"
      untended={new Set()}
      onObject={() => {}}
      width={390}
      height={844}
      {...props}
    />,
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  mockReducedMotion = false;
});
afterEach(() => jest.useRealTimers());

describe('<ParkScene />', () => {
  it('every object is a labelled button', () => {
    const { getByRole } = scene();
    for (const o of OBJECTS) expect(getByRole('button', { name: PARK_COPY.objects[o].label })).toBeTruthy();
  });

  it('tapping an object reports which one', () => {
    const onObject = jest.fn();
    const { getByRole } = scene({ onObject });
    fireEvent.press(getByRole('button', { name: PARK_COPY.objects.tree.label }));
    expect(onObject).toHaveBeenCalledWith('tree');
  });

  it('untended objects move to invite a tap, tended ones rest; no white haze', () => {
    const { queryAllByTestId } = scene({ untended: new Set(['river', 'tree']) });
    expect(queryAllByTestId('cue-river')).toHaveLength(1);
    expect(queryAllByTestId('cue-tree')).toHaveLength(1);
    expect(queryAllByTestId('cue-flowerbed')).toHaveLength(0);
    expect(queryAllByTestId(/^shimmer-/)).toHaveLength(0);
  });

  it('with Reduce Motion nothing moves, but untended objects still show a still cue', () => {
    mockReducedMotion = true;
    const { queryAllByTestId } = scene({ untended: new Set(['tree']) });
    expect(queryAllByTestId('cue-tree')).toHaveLength(1);
  });

  it('rain and night still draw', () => {
    expect(scene({ state: { ...base, weather: 'rain' } }).queryAllByTestId('rain').length).toBeGreaterThan(0);
    expect(scene({ phase: 'night' }).queryAllByTestId('moon').length).toBeGreaterThan(0);
    expect(scene({ phase: 'day' }).queryAllByTestId('moon')).toHaveLength(0);
    expect(scene({ phase: 'day' }).queryAllByTestId('sky-art')).toHaveLength(1);
    expect(scene({ phase: 'night' }).queryAllByTestId('sky-art')).toHaveLength(0);
  });

  it('the park is wider than the screen so it can pan', () => {
    const { getByTestId } = scene();
    expect(getByTestId('park-world').props.style).toEqual(expect.objectContaining({ width: Math.round(390 * 2.2) }));
  });

  // react-native-svg turns a transform string into a matrix prop on the drawn element.
  const mistShift = (t: ReturnType<typeof scene>) => {
    const n = t.getAllByTestId('mist')[0]!;
    return n.props.matrix ?? n.props.transform;
  };

  it('mist drifts slowly', () => {
    const t = scene();
    const start = JSON.stringify(mistShift(t));
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(JSON.stringify(mistShift(t))).not.toBe(start);
  });

  it('holds still with reduce motion', () => {
    mockReducedMotion = true;
    const t = scene();
    const start = JSON.stringify(mistShift(t));
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(JSON.stringify(mistShift(t))).toBe(start);
  });
});
