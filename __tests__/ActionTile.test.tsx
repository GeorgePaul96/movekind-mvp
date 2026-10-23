import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { QuickActions } from '../src/components/garden/QuickActions';
import { colors } from '../src/constants/colors';
import { GARDEN_COPY } from '../src/constants/copy';

describe('<QuickActions />', () => {
  it('every log button has dark, readable text on a light tile (no white-on-green)', () => {
    const { getByText } = render(
      <QuickActions glassesToday={2} stepsToday={null} onWater={() => {}} onUndoWater={() => {}} onWorkout={() => {}} />,
    );
    for (const label of [GARDEN_COPY.water, GARDEN_COPY.workout, GARDEN_COPY.steps]) {
      expect(StyleSheet.flatten(getByText(label).props.style).color).toBe(colors.textPrimary);
    }
    expect(StyleSheet.flatten(getByText(GARDEN_COPY.glasses(2)).props.style).color).toBe(colors.textSecondary);
  });
});
