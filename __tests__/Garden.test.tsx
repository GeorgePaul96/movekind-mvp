import React from 'react';
import { act, render } from '@testing-library/react-native';
import type { GardenState } from '../src/domain/garden/garden';
import { GARDEN_COPY } from '../src/constants/copy';

let mockReducedMotion = false;
jest.mock('../src/hooks/useReduceMotion', () => ({
  useReduceMotion: () => mockReducedMotion,
}));

import { Garden } from '../src/components/garden/Garden';

const base: GardenState = { stream: 0, ducks: false, grass: 1, tree: 0, birds: false, flowers: [], resting: false };

beforeEach(() => {
  jest.useFakeTimers();
  mockReducedMotion = false;
});
afterEach(() => jest.useRealTimers());

describe('<Garden />', () => {
  it('has a spoken summary', () => {
    const state = { ...base, stream: 2 as const, ducks: true, tree: 3 as const, birds: true };
    const { getByLabelText } = render(<Garden state={state} />);
    expect(getByLabelText(GARDEN_COPY.a11ySummary(state))).toBeTruthy();
  });

  it('summary never uses negative words', () => {
    const banned = /dry|dead|dying|wilt|brown|missed|lost/i;
    for (const stream of [0, 1, 2, 3, 4] as const)
      for (const grass of [1, 2, 3, 4] as const)
        for (const tree of [0, 1, 2, 3, 4, 5, 6] as const)
          for (const resting of [true, false]) {
            const s = { ...base, stream, grass, tree, resting, ducks: stream >= 2, birds: tree >= 3 };
            expect(GARDEN_COPY.a11ySummary(s)).not.toMatch(banned);
          }
  });

  it('ducks appear at stream 2', () => {
    expect(render(<Garden state={{ ...base, stream: 1 }} />).queryAllByTestId('duck')).toHaveLength(0);
    expect(render(<Garden state={{ ...base, stream: 2, ducks: true }} />).queryAllByTestId('duck').length).toBeGreaterThan(0);
  });

  it('fruit appears at tree 5', () => {
    expect(render(<Garden state={{ ...base, tree: 4 }} />).queryAllByTestId('fruit')).toHaveLength(0);
    expect(render(<Garden state={{ ...base, tree: 5, birds: true }} />).queryAllByTestId('fruit').length).toBeGreaterThan(0);
  });

  it('resting shows the moon', () => {
    expect(render(<Garden state={base} />).queryAllByTestId('moon')).toHaveLength(0);
    expect(render(<Garden state={{ ...base, resting: true }} />).queryAllByTestId('moon')).toHaveLength(1);
  });

  it('one flower per entry', () => {
    const flowers = (['overloaded', 'recovering', 'regulated', 'activated', 'regulated'] as const).map((mood, i) => ({
      day: `2026-10-0${i + 1}`,
      mood,
    }));
    expect(render(<Garden state={{ ...base, flowers }} />).queryAllByTestId('flower')).toHaveLength(5);
  });

  it('a trickle is still drawn at stream 0', () => {
    expect(render(<Garden state={base} />).queryAllByTestId('stream')).toHaveLength(1);
  });

  const tipX = (tree: ReturnType<typeof render>) => tree.getAllByTestId('grass-blade')[0]!.props.x2;

  it('sways gently over time', () => {
    const tree = render(<Garden state={base} />);
    const start = tipX(tree);
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(tipX(tree)).not.toBeCloseTo(start, 3);
  });

  it('holds still with reduce motion', () => {
    mockReducedMotion = true;
    const tree = render(<Garden state={base} />);
    const start = tipX(tree);
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(tipX(tree)).toBeCloseTo(start, 5);
  });
});
