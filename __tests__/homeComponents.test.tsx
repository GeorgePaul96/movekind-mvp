import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MoodTile } from '../src/components/MoodTile';
import { Chip } from '../src/components/Chip';

describe('<MoodTile />', () => {
  it('shows the plain-English label and fires onPress', () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = render(<MoodTile mood="overloaded" onPress={onPress} />);
    expect(getByText('Running on empty')).toBeTruthy();
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('<Chip />', () => {
  it('exposes its selected state', () => {
    const { getByRole } = render(<Chip label="😴 Poor" selected onPress={() => {}} />);
    expect(getByRole('button').props.accessibilityState).toMatchObject({ selected: true });
  });
});
