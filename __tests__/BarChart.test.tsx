import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { BarChart } from '../src/components/BarChart';

describe('<BarChart />', () => {
  it('keeps every label outside the bar area, so a full-height bar cannot push it into the text below', () => {
    const { getByText, getByTestId } = render(
      <BarChart data={[{ label: 'W1', value: 1 }, { label: 'W2', value: 4 }]} color="#000" unit="sessions / week" />,
    );
    const plot = getByTestId('bar-plot');
    // labels are not descendants of the fixed-height plot area
    expect(plot.findAll((n) => n.props.children === 'W2')).toHaveLength(0);
    expect(getByText('W2')).toBeTruthy();
    expect(getByText('sessions / week')).toBeTruthy();
  });

  it('never lets a bar grow past its plot', () => {
    const { getAllByTestId } = render(<BarChart data={[{ label: '1', value: 9 }]} color="#000" max={3} />);
    expect(StyleSheet.flatten(getAllByTestId('bar')[0]!.props.style).height).toBe('100%');
  });
});
