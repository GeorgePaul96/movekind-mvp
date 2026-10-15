import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * End-to-end store flow against the REAL local repository (AsyncStorage jest
 * mock underneath): check-in → composed session → rating → week view.
 * Only side-effect services are mocked.
 */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({
  telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() },
}));
jest.mock('../src/services/notifications', () => ({
  scheduleAdaptiveNudge: jest.fn(async () => {}),
  initNotifications: jest.fn(async () => {}),
}));
// null → composer uses baseline composition, keeping this test about orchestration.
jest.mock('../src/services/behavioralProfile', () => ({
  fetchBehavioralProfile: jest.fn(async () => null),
}));

import { db, __resetDbCacheForTests } from '../src/services/db';
import { useSessionStore } from '../src/store/sessionStore';

describe('session flow on the local repository', () => {
  // completeSession dynamically imports the nudge module, which Jest's VM can't run;
  // the store catches it. Silence the expected warn.
  let warnSpy: jest.SpyInstance;
  beforeAll(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterAll(() => warnSpy.mockRestore());

  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetDbCacheForTests();
    await db.profile.update({ is_premium: true });
    useSessionStore.setState({
      currentCheckIn: null,
      currentSession: null,
      composedBlocks: [],
      activeBlockIndex: 0,
      userStats: [],
      loading: false,
      error: null,
      paywallVisible: false,
      paywallDismissedThisSession: false,
      homeStep: 'done',
      week: null,
    });
  });

  it('logs a one-tap check-in without composing or touching the paywall', async () => {
    await db.profile.update({ is_premium: false });
    for (let i = 0; i < 5; i++) {
      await db.sessions.add({ check_in_id: null, state: 'regulated', engine_version: 'v3.0', status: 'completed' });
    }
    await useSessionStore.getState().logCheckIn('regulated');
    const s = useSessionStore.getState();
    expect(s.currentCheckIn).toMatchObject({ energy_score: 4, sleep_quality: null, intention: null });
    expect(s.homeStep).toBe('logged');
    expect(s.currentSession).toBeNull();
    expect(s.paywallVisible).toBe(false);
    expect(await db.checkIns.all()).toHaveLength(1);
  });

  it("composes today's session from the logged mood", async () => {
    await useSessionStore.getState().logCheckIn('regulated');
    await useSessionStore.getState().startTodaysSession();
    const s = useSessionStore.getState();
    expect(s.error).toBeNull();
    expect(s.currentSession).toMatchObject({ state: 'regulated', check_in_id: s.currentCheckIn!.id });
    // regulated → mobilize, strengthen, move, downshift
    expect(s.composedBlocks.map((b) => b.exercise.category)).toEqual(['mobilize', 'strengthen', 'move', 'downshift']);
    expect((await db.sessions.latestActive())?.id).toBe(s.currentSession!.id);
  });

  it('shows the paywall only when starting a session past the free limit', async () => {
    await db.profile.update({ is_premium: false });
    for (let i = 0; i < 5; i++) {
      await db.sessions.add({ check_in_id: null, state: 'regulated', engine_version: 'v3.0', status: 'completed' });
    }
    await useSessionStore.getState().logCheckIn('recovering');
    expect(useSessionStore.getState().paywallVisible).toBe(false);
    await useSessionStore.getState().startTodaysSession();
    expect(useSessionStore.getState().paywallVisible).toBe(true);
    expect(useSessionStore.getState().currentSession).toBeNull();
  });

  it('completes the session, resets state and returns Home to the week view', async () => {
    await useSessionStore.getState().logCheckIn('regulated');
    await useSessionStore.getState().startTodaysSession();
    await useSessionStore.getState().completeSession(2, 'felt great');
    const s = useSessionStore.getState();
    expect(s.error).toBeNull();
    expect(s.currentSession).toBeNull();
    expect(s.composedBlocks).toEqual([]);
    expect(s.activeBlockIndex).toBe(0);
    expect(s.loading).toBe(false);
    expect(s.homeStep).toBe('done');
    expect(await db.sessions.countCompleted()).toBe(1);
  });

  it('a rating updates per-exercise stats for the blocks you completed', async () => {
    await useSessionStore.getState().logCheckIn('regulated');
    await useSessionStore.getState().startTodaysSession();
    const first = useSessionStore.getState().composedBlocks[0]!;
    await useSessionStore.getState().completeBlock(first.dbBlockId, 120);
    await useSessionStore.getState().completeSession(1, null);
    expect(await db.stats.all()).toEqual([
      expect.objectContaining({ exercise_id: first.exercise.id, times_completed: 1, average_energy_delta: 1 }),
    ]);
    expect(useSessionStore.getState().week?.thisWeek.minutes).toBe(2);
  });

  it("adds sleep and a trimmed note to today's check-in", async () => {
    await useSessionStore.getState().logCheckIn('overloaded');
    await useSessionStore.getState().updateCheckIn({ sleep_quality: 'poor', intention: '  move gently  ' });
    expect(useSessionStore.getState().currentCheckIn).toMatchObject({ sleep_quality: 'poor', intention: 'move gently' });
    expect((await db.checkIns.all())[0]).toMatchObject({ sleep_quality: 'poor', intention: 'move gently' });
  });

  it('stores null for a blank note', async () => {
    await useSessionStore.getState().logCheckIn('overloaded');
    await useSessionStore.getState().updateCheckIn({ intention: '   ' });
    expect(useSessionStore.getState().currentCheckIn?.intention).toBeNull();
  });

  it("changing today's mood updates the existing row instead of inserting", async () => {
    await useSessionStore.getState().logCheckIn('overloaded');
    useSessionStore.getState().changeTodaysCheckIn();
    expect(useSessionStore.getState().homeStep).toBe('pick');
    await useSessionStore.getState().logCheckIn('activated');
    expect(await db.checkIns.all()).toHaveLength(1);
    expect(useSessionStore.getState().currentCheckIn?.energy_score).toBe(5);
    expect(useSessionStore.getState().homeStep).toBe('logged');
  });

  it('keeps nothing and rethrows when the check-in cannot be saved', async () => {
    const spy = jest.spyOn(db.checkIns, 'add').mockRejectedValueOnce(new Error('disk full'));
    await expect(useSessionStore.getState().logCheckIn('regulated')).rejects.toThrow('disk full');
    expect(useSessionStore.getState().currentCheckIn).toBeNull();
    expect(useSessionStore.getState().homeStep).toBe('done');
    spy.mockRestore();
  });

  it("yesterday's check-in is not today's after a restart", async () => {
    const ci = await db.checkIns.add({ energy_score: 4, sleep_quality: null, intention: null, engine_version: 'v3.0' });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await db.checkIns.update(ci.id, { created_at: yesterday.toISOString() });
    await useSessionStore.getState().loadStatsAndHistory();
    expect(useSessionStore.getState().currentCheckIn).toBeNull();
  });

  it('restores an in-progress session after a restart', async () => {
    await useSessionStore.getState().logCheckIn('regulated');
    await useSessionStore.getState().startTodaysSession();
    const sessionId = useSessionStore.getState().currentSession!.id;
    useSessionStore.setState({ currentSession: null, composedBlocks: [], currentCheckIn: null });
    __resetDbCacheForTests();
    await useSessionStore.getState().loadStatsAndHistory();
    const s = useSessionStore.getState();
    expect(s.currentSession?.id).toBe(sessionId);
    expect(s.composedBlocks).toHaveLength(4);
    expect(s.currentCheckIn?.energy_score).toBe(4);
  });

  it('dismissForToday moves Home to the week view', async () => {
    await useSessionStore.getState().logCheckIn('recovering');
    useSessionStore.getState().dismissForToday();
    expect(useSessionStore.getState().homeStep).toBe('done');
  });

  it('loadWeek yields a comparison', async () => {
    await useSessionStore.getState().loadWeek();
    expect(useSessionStore.getState().week).toEqual({
      thisWeek: { days: 0, minutes: 0 },
      lastWeek: { days: 0, minutes: 0 },
      daily: [null, null, null, null, null, null, null],
    });
  });
});
