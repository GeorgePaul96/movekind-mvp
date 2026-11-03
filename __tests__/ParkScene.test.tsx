import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { GardenState } from '../src/domain/garden/garden';
import type { ParkObject } from '../src/domain/park/layout';
import { PARK_COPY, PIP_COPY } from '../src/constants/copy';

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

  it('Pip is a labelled button that says something it noticed, then goes quiet', () => {
    const { getByRole, getByTestId, queryByTestId, getByText } = scene();
    expect(getByTestId('pip-happy')).toBeTruthy();
    fireEvent.press(getByRole('button', { name: PIP_COPY.label }));
    expect(getByText(PIP_COPY.lines.hello)).toBeTruthy();
    fireEvent.press(getByRole('button', { name: PIP_COPY.label }));
    expect(getByText(PIP_COPY.lines.riverAwake)).toBeTruthy();
    act(() => jest.advanceTimersByTime(5000));
    expect(queryByTestId('pip-says')).toBeNull();
  });

  it('Pip naps at night, holds a leaf in the rain, and cheers when something is logged', () => {
    expect(scene({ phase: 'night' }).getByTestId('pip-sleepy')).toBeTruthy();
    expect(scene({ state: { ...base, weather: 'rain' } }).getByTestId('pip-rainy')).toBeTruthy();
    const view = scene({ logged: 1 });
    view.rerender(
      <ParkScene state={base} phase="day" untended={new Set()} onObject={() => {}} width={390} height={844} logged={2} />,
    );
    expect(view.getByTestId('pip-cheer')).toBeTruthy();
    act(() => jest.advanceTimersByTime(3000));
    expect(view.getByTestId('pip-happy')).toBeTruthy();
  });

  it('the park is one screen wide, so the ground never slides', () => {
    const { getByTestId } = scene();
    expect(getByTestId('park-world').props.style).toEqual(expect.objectContaining({ width: 390 }));
  });
});
