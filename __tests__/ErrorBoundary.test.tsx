import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ERROR_FALLBACK } from '../src/constants/copy';

function Bomb({ defused }: { defused?: boolean }): React.JSX.Element {
  if (!defused) throw new Error('boom');
  return <Text>all good</Text>;
}

describe('<ErrorBoundary />', () => {
  // React logs caught render errors loudly; keep test output calm.
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleError.mockRestore());

  it('renders children when nothing throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>content</Text>
      </ErrorBoundary>,
    );
    expect(getByText('content')).toBeTruthy();
  });

  it('shows the calm fallback when a child throws', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(getByText(ERROR_FALLBACK.title)).toBeTruthy();
    expect(getByText(ERROR_FALLBACK.body)).toBeTruthy();
    expect(queryByText('all good')).toBeNull();
  });

  it('recovers via "Start fresh" once the failure is gone', () => {
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    rerender(
      <ErrorBoundary>
        <Bomb defused />
      </ErrorBoundary>,
    );
    fireEvent.press(getByText(ERROR_FALLBACK.action));
    expect(getByText('all good')).toBeTruthy();
  });
});
