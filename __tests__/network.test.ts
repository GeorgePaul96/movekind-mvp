import {
  isNetworkError,
  friendlyErrorMessage,
  NETWORK_ERROR_MESSAGE,
} from '../src/services/network';

describe('isNetworkError', () => {
  it('recognizes React Native fetch transport failures', () => {
    const err = new TypeError('Network request failed');
    expect(isNetworkError(err)).toBe(true);
  });

  it('recognizes browser fetch failures and timeouts', () => {
    expect(isNetworkError(new Error('Failed to fetch'))).toBe(true);
    expect(isNetworkError(new Error('The request timed out'))).toBe(true);
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    expect(isNetworkError(abort)).toBe(true);
  });

  it('recognizes plain supabase-style error objects', () => {
    expect(isNetworkError({ message: 'network error' })).toBe(true);
  });

  it('does not flag ordinary application/database errors', () => {
    expect(isNetworkError(new Error('duplicate key value violates unique constraint'))).toBe(false);
    expect(isNetworkError({ message: 'row-level security policy' })).toBe(false);
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});

describe('friendlyErrorMessage', () => {
  it('returns the calm offline copy for network errors', () => {
    expect(friendlyErrorMessage(new TypeError('Network request failed'))).toBe(
      NETWORK_ERROR_MESSAGE,
    );
  });

  it('passes through a real error message otherwise', () => {
    expect(friendlyErrorMessage(new Error('Unauthenticated'))).toBe('Unauthenticated');
  });

  it('has a safe fallback for non-error throwables', () => {
    expect(friendlyErrorMessage('weird string')).toMatch(/went wrong/i);
  });
});
