import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { QuickActions } from '../src/components/garden/QuickActions';
import { colors } from '../src/constants/colors';
import { GARDEN_COPY } from '../src/constants/copy';

describe('<QuickActions />', () => {
  it('every log card has dark, readable text on a light card (no white-on-green)', () => {
    const { getByText } = render(
      <QuickActions glassesToday={2} stepsToday={null} onWater={() => {}} onUndoWater={() => {}} onWorkout={() => {}} />,
    );
    for (const title of [GARDEN_COPY.water, GARDEN_COPY.workout, GARDEN_COPY.steps]) {
      expect(StyleSheet.flatten(getByText(title).props.style).color).toBe(colors.textSecondary);
    }
    expect(StyleSheet.flatten(getByText('2').props.style).color).toBe(colors.textPrimary);
    expect(getByText(GARDEN_COPY.glassesUnit(2))).toBeTruthy();
  });

  it('water says what the stream is doing once there is some', () => {
    const { getByText, queryByText, rerender } = render(
      <QuickActions glassesToday={0} stepsToday={null} onWater={() => {}} onUndoWater={() => {}} onWorkout={() => {}} />,
    );
    expect(getByText(GARDEN_COPY.waterTap)).toBeTruthy();
    rerender(<QuickActions glassesToday={3} stepsToday={null} onWater={() => {}} onUndoWater={() => {}} onWorkout={() => {}} />);
    expect(queryByText(GARDEN_COPY.waterTap)).toBeNull();
    expect(getByText(GARDEN_COPY.waterNote)).toBeTruthy();
  });
});
