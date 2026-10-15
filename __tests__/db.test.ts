import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, __resetDbCacheForTests } from '../src/services/db';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetDbCacheForTests();
});

const ci = (energy = 4) => ({
  energy_score: energy,
  sleep_quality: null,
  intention: null,
  engine_version: 'v3.0',
});

describe('local repository', () => {
  it('persists across an app restart (cache reset)', async () => {
    const saved = await db.checkIns.add(ci());
    __resetDbCacheForTests();
    expect(await db.checkIns.all()).toEqual([saved]);
  });

  it('concurrent inserts never lose rows', async () => {
    await Promise.all([db.checkIns.add(ci(1)), db.checkIns.add(ci(2)), db.checkIns.add(ci(5))]);
    __resetDbCacheForTests();
    expect(await db.checkIns.all()).toHaveLength(3);
  });

  it('a failed write leaves no ghost row behind (memory matches disk)', async () => {
    await db.profile.get(); // create the profile first so the failure hits the check-in write
    // setItem is already a jest.fn in the AsyncStorage mock: use a one-shot implementation
    // (spyOn + mockRestore would wipe its real behavior for every later test).
    (AsyncStorage.setItem as jest.Mock).mockImplementationOnce(async () => {
      throw new Error('disk full');
    });
    await expect(db.checkIns.add(ci())).rejects.toThrow('disk full');
    expect(await db.checkIns.all()).toEqual([]);
    // and the table still works afterwards
    await db.checkIns.add(ci());
    expect(await db.checkIns.all()).toHaveLength(1);
  });

  it('survives corrupt stored data with an empty table', async () => {
    await AsyncStorage.setItem('@movekind/db/check_ins', '{not json');
    expect(await db.checkIns.all()).toEqual([]);
  });

  it('profile id is created once and stays stable', async () => {
    const a = await db.profile.get();
    __resetDbCacheForTests();
    const b = await db.profile.get();
    expect(b.id).toBe(a.id);
    expect(b).toMatchObject({ name: null, is_premium: false });
  });

  it('updates a row by id', async () => {
    const row = await db.checkIns.add(ci());
    await db.checkIns.update(row.id, { sleep_quality: 'poor' });
    expect((await db.checkIns.all())[0]?.sleep_quality).toBe('poor');
  });

  it('joins blocks to the exercise library and finds the active session', async () => {
    const s = await db.sessions.add({ check_in_id: null, state: 'regulated', engine_version: 'v3.0', status: 'generated' });
    const blocks = await db.blocks.addMany(s.id, [{ exercise_id: 'ex-regulate-1', block_order: 0, target_duration: 60 }]);
    expect(blocks[0]?.exercise.name).toBe('Box Breathing');
    expect((await db.sessions.latestActive())?.id).toBe(s.id);
  });

  it('a rating updates per-exercise stats for completed blocks only', async () => {
    const s = await db.sessions.add({ check_in_id: null, state: 'regulated', engine_version: 'v3.0', status: 'started' });
    const [b1, b2] = await db.blocks.addMany(s.id, [
      { exercise_id: 'ex-regulate-1', block_order: 0, target_duration: 60 },
      { exercise_id: 'ex-move-1', block_order: 1, target_duration: 60 },
    ]);
    await db.blocks.update(b1!.id, { status: 'completed', actual_duration: 60 });
    await db.blocks.update(b2!.id, { status: 'skipped' });
    await db.ratings.add({ session_id: s.id, rating_delta: 2, notes: null });
    const stats = await db.stats.all();
    expect(stats).toEqual([
      expect.objectContaining({ exercise_id: 'ex-regulate-1', times_completed: 1, average_energy_delta: 2 }),
    ]);
  });

  it('eraseAll removes everything, including the profile', async () => {
    const before = await db.profile.get();
    await db.checkIns.add(ci());
    await db.eraseAll();
    __resetDbCacheForTests();
    expect(await db.checkIns.all()).toEqual([]);
    expect((await db.profile.get()).id).not.toBe(before.id);
  });
});
