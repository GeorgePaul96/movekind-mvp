import {
  enqueueRating,
  getPendingRatings,
  syncPendingRatings,
} from '../src/services/outbox';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Configurable supabase mock. `mock`-prefixed so jest allows the factory to close over it.
let mockInsertImpl: () => any;
let mockUpdateImpl: () => any;

jest.mock('../src/services/supabase', () => ({
  supabase: {
    from: (_table: string) => ({
      insert: (_row: unknown) => mockInsertImpl(),
      update: (_row: unknown) => ({
        eq: (_col: string, _val: unknown) => mockUpdateImpl(),
      }),
    }),
  },
}));

const AsyncStorage = require('@react-native-async-storage/async-storage');

beforeEach(async () => {
  await AsyncStorage.clear();
  mockInsertImpl = () => Promise.resolve({ error: null });
  mockUpdateImpl = () => Promise.resolve({ error: null });
});

describe('outbox enqueue/read', () => {
  it('persists a queued rating', async () => {
    await enqueueRating({ sessionId: 's1', ratingDelta: 1, notes: null });
    const pending = await getPendingRatings();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ sessionId: 's1', ratingDelta: 1, notes: null });
    expect(typeof pending[0]!.queuedAt).toBe('string');
  });

  it('de-dupes on sessionId (latest wins)', async () => {
    await enqueueRating({ sessionId: 's1', ratingDelta: 1, notes: 'first' });
    await enqueueRating({ sessionId: 's1', ratingDelta: 2, notes: 'second' });
    const pending = await getPendingRatings();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ ratingDelta: 2, notes: 'second' });
  });
});

describe('syncPendingRatings', () => {
  it('flushes all entries when online and clears the queue', async () => {
    await enqueueRating({ sessionId: 's1', ratingDelta: 1, notes: null });
    await enqueueRating({ sessionId: 's2', ratingDelta: 2, notes: 'nice' });

    const result = await syncPendingRatings();

    expect(result).toEqual({ flushed: 2, remaining: 0 });
    expect(await getPendingRatings()).toHaveLength(0);
  });

  it('keeps entries queued when the network is still down', async () => {
    await enqueueRating({ sessionId: 's1', ratingDelta: 1, notes: null });
    mockInsertImpl = () => Promise.reject(new TypeError('Network request failed'));

    const result = await syncPendingRatings();

    expect(result).toEqual({ flushed: 0, remaining: 1 });
    expect(await getPendingRatings()).toHaveLength(1);
  });

  it('drops entries that fail permanently so the queue never wedges', async () => {
    await enqueueRating({ sessionId: 's1', ratingDelta: 1, notes: null });
    mockInsertImpl = () => Promise.resolve({ error: { message: 'session not found' } });

    const result = await syncPendingRatings();

    expect(result).toEqual({ flushed: 0, remaining: 0 });
    expect(await getPendingRatings()).toHaveLength(0);
  });

  it('is a no-op with an empty queue', async () => {
    expect(await syncPendingRatings()).toEqual({ flushed: 0, remaining: 0 });
  });
});
