import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/hooks/useReduceMotion', () => ({ useReduceMotion: () => true }));

import { ParkTour, TOUR_STOPS, tourScrollX } from '../src/components/park/ParkTour';
import { parkLayout } from '../src/domain/park/layout';
import { useSettingsStore } from '../src/store/settingsStore';
import { TOUR_COPY } from '../src/constants/copy';

const W = 390;
const H = 844;
const layout = parkLayout(W, H);

beforeEach(async () => {
  await AsyncStorage.clear();
  useSettingsStore.setState({ parkTourSeen: false });
});

describe('<ParkTour />', () => {
  it('next walks through every object then the drawer', () => {
    const onDone = jest.fn();
    const { getByText, getByLabelText } = render(<ParkTour layout={layout} screenW={W} scrollTo={() => {}} onDone={onDone} />);
    for (const stop of TOUR_STOPS) {
      expect(getByText(TOUR_COPY.steps[stop])).toBeTruthy();
      fireEvent.press(getByLabelText(stop === 'drawer' ? TOUR_COPY.done : TOUR_COPY.next));
    }
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('the tour scrolls to each object', () => {
    const scrollTo = jest.fn();
    const { getByLabelText } = render(<ParkTour layout={layout} screenW={W} scrollTo={scrollTo} onDone={() => {}} />);
    for (let i = 0; i < TOUR_STOPS.length - 1; i++) fireEvent.press(getByLabelText(TOUR_COPY.next));
    const objects = TOUR_STOPS.filter((s) => s !== 'drawer');
    expect(scrollTo.mock.calls.map((c) => c[0])).toEqual(objects.map((o) => tourScrollX(layout, W, o)));
  });

  it('skip ends it and remembers', async () => {
    const onDone = jest.fn();
    const { getByLabelText } = render(<ParkTour layout={layout} screenW={W} scrollTo={() => {}} onDone={onDone} />);
    fireEvent.press(getByLabelText(TOUR_COPY.skip));
    expect(onDone).toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 0));
    expect(useSettingsStore.getState().parkTourSeen).toBe(true);
    expect(JSON.parse((await AsyncStorage.getItem('@movekind/settings'))!)).toMatchObject({ parkTourSeen: true });
  });

  it('tour stops keep every scroll position inside the park', () => {
    for (const o of TOUR_STOPS.filter((s) => s !== 'drawer')) {
      const x = tourScrollX(layout, W, o);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(layout.worldW - W);
    }
  });
});
