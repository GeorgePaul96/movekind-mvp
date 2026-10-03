import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MoodTile } from '../src/components/MoodTile';
import { Chip } from '../src/components/Chip';
import { WeekCard } from '../src/components/WeekCard';

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

describe('<WeekCard />', () => {
  it('shows an empty state when there is no week yet', () => {
    const { getByText } = render(<WeekCard week={null} />);
    expect(getByText('Your week will appear here.')).toBeTruthy();
  });

  it('compares this week with last week', () => {
    const { getByText, getByLabelText } = render(
      <WeekCard
        week={{
          thisWeek: { days: 4, minutes: 23 },
          lastWeek: { days: 3, minutes: 15 },
          daily: ['recovering', 'regulated', null, 'overloaded', null, null, null],
        }}
      />,
    );
    expect(getByText('This week vs last')).toBeTruthy();
    expect(getByLabelText('Check-ins: 4 this week, 3 last week, up')).toBeTruthy();
    expect(getByLabelText('Minutes moved: 23 this week, 15 last week, up')).toBeTruthy();
  });
});
