import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InkBoard, PairsBoard, PatternBoard, SequenceBoard, SwitchBoard } from '../src/components/games/boards';
import { GameScreen } from '../src/components/games/GameScreen';
import { HOME_COPY, PLAY_COPY } from '../src/constants/copy';
import { localDayKey } from '../src/domain/garden/days';
import {
  GAME_IDS,
  GAME_RULES,
  INKS,
  PATTERN_MAX,
  START,
  inkRound,
  pairsDeck,
  patternRound,
  seededRng,
  sequenceRound,
  stairStep,
  switchRound,
} from '../src/domain/games/games';
import HomeScreen from '../src/screens/main/HomeScreen';
import { __resetDbCacheForTests } from '../src/services/db';
import { telemetry } from '../src/services/telemetry';
import { useGardenStore } from '../src/store/gardenStore';
import { useSettingsStore } from '../src/store/settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../src/services/telemetry', () => ({
  telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() },
}));
jest.mock('../src/services/steps', () => ({
  stepsStatus: async () => 'ask',
  requestStepsAccess: async () => false,
  stepsByDay: async () => ({}),
}));
jest.mock('../src/services/notifications', () => ({
  enableDailyReminder: jest.fn(async () => true),
  disableDailyReminder: jest.fn(),
}));

describe('the gentle staircase', () => {
  it('two clean rounds step up, one miss steps down, and it never leaves its range', () => {
    let s = START;
    s = stairStep(s, true, 5);
    expect(s).toEqual({ level: 1, streak: 1 });
    s = stairStep(s, true, 5);
    expect(s).toEqual({ level: 2, streak: 0 });
    s = stairStep(s, false, 5);
    expect(s).toEqual({ level: 1, streak: 0 });
    expect(stairStep(s, false, 5).level).toBe(1); // never below the first level: there is no losing
    expect(stairStep({ level: 5, streak: 1 }, true, 5).level).toBe(5);
    // A miss clears the run, so one lucky round after it does not step up.
    expect(stairStep(stairStep({ level: 3, streak: 1 }, false, 5), true, 5)).toEqual({ level: 2, streak: 1 });
  });
});

describe('round makers', () => {
  it('are repeatable from the same seed', () => {
    expect(patternRound(3, seededRng(7))).toEqual(patternRound(3, seededRng(7)));
    expect(sequenceRound(2, seededRng(7))).toEqual(sequenceRound(2, seededRng(7)));
    expect(pairsDeck(1, seededRng(7))).toEqual(pairsDeck(1, seededRng(7)));
  });

  it('pattern rounds grow with the level and never repeat a tile', () => {
    for (let level = 1; level <= PATTERN_MAX; level++) {
      const r = patternRound(level, seededRng(level));
      expect(new Set(r.targets).size).toBe(r.targets.length);
      expect(Math.max(...r.targets)).toBeLessThan(r.size * r.size);
    }
    expect(patternRound(1, seededRng(1)).targets).toHaveLength(3);
    expect(patternRound(PATTERN_MAX, seededRng(1))).toMatchObject({ size: 5 });
    expect(patternRound(99, seededRng(1)).targets).toHaveLength(8); // clamped
  });

  it('sequences are three long at first and never light the same tile twice running', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const order = sequenceRound(4, seededRng(seed));
      expect(order).toHaveLength(6);
      order.forEach((tile, k) => {
        expect(tile).toBeGreaterThanOrEqual(0);
        expect(tile).toBeLessThan(9);
        if (k) expect(tile).not.toBe(order[k - 1]);
      });
    }
    expect(sequenceRound(1, seededRng(3))).toHaveLength(3);
  });

  it('ink rounds always offer the right answer, and clash more at higher levels', () => {
    const clashes = (level: number) => {
      let n = 0;
      const rng = seededRng(11);
      for (let k = 0; k < 400; k++) {
        const r = inkRound(level, rng);
        expect(r.options).toHaveLength(INKS.length);
        expect(r.options).toContain(r.ink);
        if (r.word !== r.ink) n++;
      }
      return n;
    };
    expect(clashes(5)).toBeGreaterThan(clashes(1));
    expect(inkRound(1, seededRng(2)).options).toEqual([...INKS]); // buttons stay put early on
  });

  it('the rule switches more often at higher levels, and the answer follows the rule', () => {
    const switches = (level: number) => {
      let n = 0;
      let prev = switchRound(level, null, seededRng(5)).rule;
      const rng = seededRng(5);
      for (let k = 0; k < 400; k++) {
        const r = switchRound(level, prev, rng);
        expect(r.answer).toBe(r.rule === 'shape' ? r.shape : r.shade);
        if (r.rule !== prev) n++;
        prev = r.rule;
      }
      return n;
    };
    expect(switches(5)).toBeGreaterThan(switches(1));
  });

  it('a pairs board holds every picture exactly twice', () => {
    for (const [level, cards] of [[1, 12], [2, 16], [3, 20]] as const) {
      const deck = pairsDeck(level, seededRng(level));
      expect(deck).toHaveLength(cards);
      const counts = new Map<string, number>();
      deck.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1));
      expect([...counts.values()].every((n) => n === 2)).toBe(true);
    }
  });
});

describe('honesty', () => {
  it('says plainly that these are games, and claims nothing for the brain', () => {
    expect(PLAY_COPY.honest).toMatch(/make no such promise/);
    const flatten = (v: unknown): string[] =>
      typeof v === 'string' ? [v] : typeof v === 'function' ? [] : v && typeof v === 'object' ? Object.values(v).flatMap(flatten) : [];
    const selling = flatten({ ...PLAY_COPY, honest: '' });
    for (const text of selling) {
      expect(text).not.toMatch(/\b(train|training|sharpen|sharper|smarter|IQ|boost|improves?|cognitive|brain|memory|focus|dementia|decline)\b/i);
    }
  });

  it('keeps no score and names every game', () => {
    expect(GAME_IDS).toHaveLength(5);
    for (const id of GAME_IDS) {
      expect(PLAY_COPY.games[id].name.length).toBeGreaterThan(2);
      expect(GAME_RULES[id].rounds).toBeGreaterThan(0);
    }
  });
});

describe('the boards', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const tileLabel = (index: number, size: number) => PLAY_COPY.tile(Math.floor(index / size) + 1, (index % size) + 1);

  it('Light the tiles: tapping every lit tile is a clean round', () => {
    const onResult = jest.fn();
    const round = patternRound(1, seededRng(42));
    render(<PatternBoard level={1} onResult={onResult} rng={seededRng(42)} />);
    expect(screen.getByText(PLAY_COPY.watch)).toBeTruthy();
    // Taps during the showing are ignored.
    fireEvent.press(screen.getByLabelText(tileLabel(round.targets[0], round.size)));
    act(() => jest.advanceTimersByTime(2000));
    expect(screen.getByText(PLAY_COPY.yourTurn)).toBeTruthy();
    round.targets.forEach((t) => fireEvent.press(screen.getByLabelText(tileLabel(t, round.size))));
    expect(screen.getByText(PLAY_COPY.clean)).toBeTruthy();
    act(() => jest.advanceTimersByTime(800));
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it('Light the tiles: a wrong tile ends the round softly', () => {
    const onResult = jest.fn();
    const round = patternRound(1, seededRng(42));
    const wrong = [0, 1, 2, 3, 4, 5, 6, 7, 8].find((k) => !round.targets.includes(k))!;
    render(<PatternBoard level={1} onResult={onResult} rng={seededRng(42)} />);
    act(() => jest.advanceTimersByTime(2000));
    fireEvent.press(screen.getByLabelText(tileLabel(wrong, round.size)));
    expect(screen.getByText(PLAY_COPY.easing)).toBeTruthy();
    act(() => jest.advanceTimersByTime(1500));
    expect(onResult).toHaveBeenCalledWith(false);
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('In order: the same order is clean, a different one is a soft miss', () => {
    const order = sequenceRound(1, seededRng(9));
    const clean = jest.fn();
    const first = render(<SequenceBoard level={1} onResult={clean} rng={seededRng(9)} />);
    act(() => jest.advanceTimersByTime(5000));
    order.forEach((t) => fireEvent.press(screen.getByLabelText(tileLabel(t, 3))));
    act(() => jest.advanceTimersByTime(800));
    expect(clean).toHaveBeenCalledWith(true);
    first.unmount();

    const miss = jest.fn();
    render(<SequenceBoard level={1} onResult={miss} rng={seededRng(9)} />);
    act(() => jest.advanceTimersByTime(5000));
    fireEvent.press(screen.getByLabelText(tileLabel((order[0] + 1) % 9, 3)));
    act(() => jest.advanceTimersByTime(1300));
    expect(miss).toHaveBeenCalledWith(false);
  });

  it('Ink: the ink is the answer, not the word', () => {
    // Find a seed where word and ink differ, so the test proves which one counts.
    let seed = 1;
    while (inkRound(5, seededRng(seed)).word === inkRound(5, seededRng(seed)).ink) seed++;
    const round = inkRound(5, seededRng(seed));
    const onInk = jest.fn();
    render(<InkBoard level={5} onResult={onInk} rng={seededRng(seed)} />);
    fireEvent.press(screen.getByRole('button', { name: PLAY_COPY.inks[round.ink] }));
    act(() => jest.advanceTimersByTime(500));
    expect(onInk).toHaveBeenCalledWith(true);
  });

  it('Ink: tapping the word instead is a soft miss that names the ink', () => {
    let seed = 1;
    while (inkRound(5, seededRng(seed)).word === inkRound(5, seededRng(seed)).ink) seed++;
    const round = inkRound(5, seededRng(seed));
    const onResult = jest.fn();
    render(<InkBoard level={5} onResult={onResult} rng={seededRng(seed)} />);
    fireEvent.press(screen.getByRole('button', { name: PLAY_COPY.inks[round.word] }));
    expect(screen.getByText(PLAY_COPY.inkWas(PLAY_COPY.inks[round.ink]))).toBeTruthy();
    act(() => jest.advanceTimersByTime(1200));
    expect(onResult).toHaveBeenCalledWith(false);
  });

  it('Shape or shade: the buttons follow the rule', () => {
    const round = switchRound(1, null, seededRng(4));
    const onResult = jest.fn();
    const onRule = jest.fn();
    render(<SwitchBoard level={1} onResult={onResult} onRule={onRule} rng={seededRng(4)} />);
    expect(screen.getByText(PLAY_COPY.rule[round.rule])).toBeTruthy();
    expect(onRule).toHaveBeenCalledWith(round.rule);
    const label =
      round.rule === 'shape'
        ? PLAY_COPY.shapes[round.shape]
        : PLAY_COPY.shades[round.shade];
    fireEvent.press(screen.getByText(label));
    act(() => jest.advanceTimersByTime(400));
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it('Pairs: matching cards stay up, others turn back, and the board ends when all are found', () => {
    const deck = pairsDeck(1, seededRng(3));
    const onResult = jest.fn();
    render(<PairsBoard level={1} onResult={onResult} rng={seededRng(3)} />);
    // Turn over two that do not match: they go back down.
    const other = deck.findIndex((c) => c !== deck[0]);
    fireEvent.press(screen.getByLabelText(PLAY_COPY.cardDown(1)));
    fireEvent.press(screen.getByLabelText(PLAY_COPY.cardDown(other + 1)));
    expect(screen.getByLabelText(PLAY_COPY.cardUp(1, PLAY_COPY.pairNames[deck[0]]))).toBeTruthy();
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByLabelText(PLAY_COPY.cardDown(1))).toBeTruthy();
    // Now find every pair.
    const seen = new Set<number>();
    deck.forEach((icon, k) => {
      if (seen.has(k)) return;
      const partner = deck.findIndex((c, j) => j !== k && c === icon);
      seen.add(k).add(partner);
      fireEvent.press(screen.getByLabelText(PLAY_COPY.cardDown(k + 1)));
      fireEvent.press(screen.getByLabelText(PLAY_COPY.cardDown(partner + 1)));
    });
    expect(screen.getByText(PLAY_COPY.pairsDone)).toBeTruthy();
    act(() => jest.advanceTimersByTime(1300));
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it('a set ends by itself, saves no score, and offers another', () => {
    render(<GameScreen id="ink" onClose={jest.fn()} />);
    expect(screen.getByText(new RegExp(PLAY_COPY.round(1, 12)))).toBeTruthy();
    for (let k = 0; k < 12; k++) {
      fireEvent.press(screen.getByRole('button', { name: PLAY_COPY.inks.red }));
      act(() => jest.advanceTimersByTime(1200));
    }
    expect(screen.getByText(PLAY_COPY.setDone)).toBeTruthy();
    expect(telemetry.capture).toHaveBeenCalledWith('played', { game: 'ink' });
    expect(JSON.stringify((telemetry.capture as jest.Mock).mock.calls)).not.toMatch(/level|score|correct/);
    fireEvent.press(screen.getByText(PLAY_COPY.again));
    expect(screen.getByText(new RegExp(PLAY_COPY.round(1, 12)))).toBeTruthy();
  });
});

describe('the Play tab', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    __resetDbCacheForTests();
    useGardenStore.setState({ loaded: false });
    await useSettingsStore.getState().reset();
    await useSettingsStore.getState().markFlowSeen(localDayKey(new Date()));
  });

  it('lists the games with the honest note, opens one, and closes back', async () => {
    render(<HomeScreen />);
    await waitFor(() => expect(useGardenStore.getState().loaded).toBe(true));
    await act(async () => fireEvent.press(screen.getByLabelText(HOME_COPY.tabA11y(HOME_COPY.tabs.play))));
    expect(screen.getByText(PLAY_COPY.honest)).toBeTruthy();
    for (const id of GAME_IDS) expect(screen.getByText(PLAY_COPY.games[id].name)).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByLabelText(PLAY_COPY.playA11y(PLAY_COPY.games.pairs.name))));
    expect(screen.getByLabelText(PLAY_COPY.cardDown(1))).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByLabelText(PLAY_COPY.closeA11y)));
    expect(screen.getByText(PLAY_COPY.honestTitle)).toBeTruthy();
  });
});
