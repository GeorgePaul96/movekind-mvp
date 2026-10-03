import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../src/components/Button';
import { colors } from '../src/constants/colors';

const flat = (node: any) => StyleSheet.flatten(node.props.style);

describe('<Button />', () => {
  it('renders its label', () => {
    const { getByText } = render(<Button label="Save" onPress={() => {}} />);
    expect(getByText('Save')).toBeTruthy();
  });

  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap me" onPress={onPress} />);
    fireEvent.press(getByText('Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button label="Disabled" onPress={onPress} disabled />,
    );
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('primary is a solid primary fill', () => {
    const { getByRole } = render(<Button label="Go" onPress={() => {}} />);
    expect(flat(getByRole('button')).backgroundColor).toBe(colors.primary);
  });

  it('secondary has a visible 2px primary outline', () => {
    const { getByRole } = render(<Button label="Later" variant="secondary" onPress={() => {}} />);
    const s = flat(getByRole('button'));
    expect(s.borderWidth).toBe(2);
    expect(s.borderColor).toBe(colors.primary);
  });

  it('link is underlined primary text with a 44pt touch target', () => {
    const { getByRole, getByText } = render(<Button label="Skip" variant="link" onPress={() => {}} />);
    expect(flat(getByRole('button')).minHeight).toBeGreaterThanOrEqual(44);
    const t = StyleSheet.flatten(getByText('Skip').props.style);
    expect(t.textDecorationLine).toBe('underline');
    expect(t.color).toBe(colors.primary);
  });
});
