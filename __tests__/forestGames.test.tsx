import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  BerryPatchBoard,
  CanopyLeafBoard,
  CarvedStonesBoard,
  DuskFirefliesBoard,
  FireflyFlightBoard,
  StreamBalanceBoard,
} from '../src/components/games/forestBoards';
import { PLAY_COPY } from '../src/constants/copy';
import {
  berryPatchRound,
  canopyLeafRound,
  carvedStonesRound,
  duskFirefliesRound,
  evaluate,
  fireflyFlightRound,
  placeNode,
  streamBalanceRound,
} from '../src/domain/games/forestGames';
import { GAME_IDS, GAME_RULES, seededRng } from '../src/domain/games/games';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const LEVELS = [1, 2, 3, 4, 5, 6];

describe('forest game rounds', () => {
  it('are registered with a name, a description and a set length', () => {
    for (const id of ['leaf', 'fireflies', 'stones', 'berries', 'balance', 'flight'] as const) {
      expect(GAME_IDS).toContain(id);
      expect(PLAY_COPY.games[id].name.length).toBeGreaterThan(3);
      expect(GAME_RULES[id]).toEqual({ rounds: expect.any(Number), maxLevel: 6 });
    }
  });

  it('are repeatable from the same seed', () => {
    for (const make of [canopyLeafRound, duskFirefliesRound, carvedStonesRound, berryPatchRound, streamBalanceRound, fireflyFlightRound]) {
      expect(make(3, seededRng(9))).toEqual(make(3, seededRng(9)));
    }
  });

  it('Canopy leaf: exactly one leaf differs, and the clearing fills up with level', () => {
    for (const level of LEVELS) {
      for (let seed = 1; seed <= 10; seed++) {
        const r = canopyLeafRound(level, seededRng(seed * level));
        const targets = r.leaves.filter((l) => l.isTarget);
        expect(targets).toHaveLength(1);
        expect(targets[0].shape).toBe(r.targetShape);
        expect(r.targetShape).not.toBe(r.distractorShape);
        expect(r.leaves.filter((l) => !l.isTarget).every((l) => l.shape === r.distractorShape)).toBe(true);
      }
    }
    expect(canopyLeafRound(1, seededRng(1)).leaves).toHaveLength(6);
    expect(canopyLeafRound(6, seededRng(1)).leaves).toHaveLength(24);
    expect(canopyLeafRound(99, seededRng(1)).leaves).toHaveLength(24);
  });

  it('Dusk fireflies: slower at the start, and both kinds turn up', () => {
    expect(duskFirefliesRound(1, seededRng(1)).durationMs).toBeGreaterThan(duskFirefliesRound(6, seededRng(1)).durationMs);
    const kinds = new Set(Array.from({ length: 60 }, (_, k) => duskFirefliesRound(3, seededRng(k + 1)).type));
    expect(kinds).toEqual(new Set(['gold', 'blue']));
  });

  it('Carved stones: more points with level, turns in 45 degree steps, and a mirror is never just a turn', () => {
    expect(carvedStonesRound(1, seededRng(1)).nodeCount).toBeLessThan(carvedStonesRound(6, seededRng(1)).nodeCount);
    for (const level of LEVELS) {
      for (let seed = 1; seed <= 20; seed++) {
        const r = carvedStonesRound(level, seededRng(seed));
        expect(r.rotationDegrees % 45).toBe(0);
        expect(r.rotationDegrees).toBeGreaterThan(0);
        if (!r.isMirrored) continue;
        // No turn of the original lands exactly on the mirrored stone, so the right answer is unambiguous.
        const mirrored = r.nodes.map((n) => placeNode(n, r));
        for (let turn = 0; turn < 360; turn += 45) {
          const turned = r.nodes.map((n) => placeNode(n, { rotationDegrees: turn, isMirrored: false }));
          const same = turned.every((p, k) => Math.abs(p.x - mirrored[k].x) < 0.5 && Math.abs(p.y - mirrored[k].y) < 0.5);
          expect(same).toBe(false);
        }
      }
    }
  });

  it('Berry patch: one side always has more, and from level 3 the berry area stays about equal', () => {
    for (const level of LEVELS) {
      for (let seed = 1; seed <= 20; seed++) {
        const r = berryPatchRound(level, seededRng(seed * 7));
        expect(r.leftCount).not.toBe(r.rightCount);
        expect(r.correctSide).toBe(r.leftCount > r.rightCount ? 'left' : 'right');
        expect(r.leftBerries).toHaveLength(r.leftCount);
        expect(r.rightBerries).toHaveLength(r.rightCount);
        if (level >= 3) {
          const area = (bs: { radius: number }[]) => bs.reduce((s, b) => s + b.radius * b.radius, 0);
          const ratio = area(r.leftBerries) / area(r.rightBerries);
          expect(ratio).toBeGreaterThan(0.75);
          expect(ratio).toBeLessThan(1.33);
        }
      }
    }
  });

  it('Stream balance: every stone is a whole number from 1, every sum adds up, and the answer is right', () => {
    for (const level of LEVELS) {
      for (let seed = 1; seed <= 200; seed++) {
        const r = streamBalanceRound(level, seededRng(seed));
        for (const expr of [r.leftExpression, r.rightExpression]) {
          for (const n of expr.split(' ').filter((p) => p !== '+' && p !== '-')) {
            expect(Number.isInteger(Number(n))).toBe(true);
            expect(Number(n)).toBeGreaterThanOrEqual(1);
          }
          expect(expr).not.toMatch(/-\s*-|\+\s*-/);
        }
        expect(evaluate(r.leftExpression)).toBe(r.leftTotal);
        expect(evaluate(r.rightExpression)).toBe(r.rightTotal);
        expect(r.correctAnswer).toBe(r.leftTotal === r.rightTotal ? 'balanced' : r.leftTotal > r.rightTotal ? 'left' : 'right');
      }
    }
  });

  it('Firefly flight: the way back is the path reversed, and it gets longer', () => {
    for (const level of LEVELS) {
      const r = fireflyFlightRound(level, seededRng(level * 19));
      expect(r.reverseSequence).toEqual([...r.sequence].reverse());
      r.sequence.forEach((id, k) => {
        expect(id).toBeLessThan(r.lanterns.length);
        if (k) expect(id).not.toBe(r.sequence[k - 1]);
      });
    }
    expect(fireflyFlightRound(1, seededRng(1)).sequence.length).toBeLessThan(fireflyFlightRound(6, seededRng(1)).sequence.length);
  });
});

describe('forest game boards', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('Canopy leaf: the odd leaf is a clean round; another leaf reveals it softly', () => {
    const r = canopyLeafRound(1, seededRng(5));
    const target = r.leaves.findIndex((l) => l.isTarget);
    const ok = jest.fn();
    const a = render(<CanopyLeafBoard level={1} onResult={ok} rng={seededRng(5)} />);
    fireEvent.press(screen.getByLabelText(PLAY_COPY.leafA11y(target + 1, PLAY_COPY.leafShapes[r.targetShape])));
    act(() => jest.advanceTimersByTime(500));
    expect(ok).toHaveBeenCalledWith(true);
    a.unmount();

    const miss = jest.fn();
    render(<CanopyLeafBoard level={1} onResult={miss} rng={seededRng(5)} />);
    const other = r.leaves.findIndex((l) => !l.isTarget);
    fireEvent.press(screen.getByLabelText(PLAY_COPY.leafA11y(other + 1, PLAY_COPY.leafShapes[r.distractorShape])));
    expect(screen.getByText(PLAY_COPY.leafWas)).toBeTruthy();
    act(() => jest.advanceTimersByTime(1200));
    expect(miss).toHaveBeenCalledWith(false);
  });

  it('Dusk fireflies: tapping gold, or letting blue pass, is clean; a gold one drifting away is a soft miss', () => {
    let gold = 1;
    while (duskFirefliesRound(1, seededRng(gold)).type !== 'gold') gold++;
    let blue = 1;
    while (duskFirefliesRound(1, seededRng(blue)).type !== 'blue') blue++;

    const a = jest.fn();
    const first = render(<DuskFirefliesBoard level={1} onResult={a} rng={seededRng(gold)} />);
    fireEvent.press(screen.getByLabelText(PLAY_COPY.catchA11y));
    act(() => jest.advanceTimersByTime(400));
    expect(a).toHaveBeenCalledWith(true);
    first.unmount();

    const b = jest.fn();
    const second = render(<DuskFirefliesBoard level={1} onResult={b} rng={seededRng(blue)} />);
    fireEvent.press(screen.getByText(PLAY_COPY.letPass));
    act(() => jest.advanceTimersByTime(400));
    expect(b).toHaveBeenCalledWith(true);
    second.unmount();

    const c = jest.fn();
    render(<DuskFirefliesBoard level={1} onResult={c} rng={seededRng(gold)} />);
    act(() => jest.advanceTimersByTime(3700));
    expect(screen.getByText(PLAY_COPY.goldMissed)).toBeTruthy();
    act(() => jest.advanceTimersByTime(1200));
    expect(c).toHaveBeenCalledWith(false);
    expect(c).toHaveBeenCalledTimes(1);
  });

  it('Carved stones, Berry patch and Stream balance: the right choice is clean', () => {
    const stones = carvedStonesRound(2, seededRng(3));
    const s = jest.fn();
    const one = render(<CarvedStonesBoard level={2} onResult={s} rng={seededRng(3)} />);
    fireEvent.press(screen.getByText(stones.isMirrored ? PLAY_COPY.mirrored : PLAY_COPY.same));
    act(() => jest.advanceTimersByTime(500));
    expect(s).toHaveBeenCalledWith(true);
    one.unmount();

    const berries = berryPatchRound(2, seededRng(4));
    const b = jest.fn();
    const two = render(<BerryPatchBoard level={2} onResult={b} rng={seededRng(4)} />);
    fireEvent.press(screen.getByLabelText(PLAY_COPY.patchA11y(berries.correctSide === 'left' ? PLAY_COPY.left : PLAY_COPY.right)));
    expect(screen.getByText(PLAY_COPY.berryCount(berries.leftCount))).toBeTruthy();
    act(() => jest.advanceTimersByTime(800));
    expect(b).toHaveBeenCalledWith(true);
    two.unmount();

    const stream = streamBalanceRound(3, seededRng(6));
    const m = jest.fn();
    render(<StreamBalanceBoard level={3} onResult={m} rng={seededRng(6)} />);
    const a11y = { left: PLAY_COPY.moreLeftA11y, balanced: PLAY_COPY.balancedA11y, right: PLAY_COPY.moreRightA11y }[stream.correctAnswer];
    fireEvent.press(screen.getByLabelText(a11y));
    act(() => jest.advanceTimersByTime(500));
    expect(m).toHaveBeenCalledWith(true);
  });

  it('Firefly flight: watching is not tappable; the reverse path is clean', () => {
    const r = fireflyFlightRound(1, seededRng(8));
    const onResult = jest.fn();
    render(<FireflyFlightBoard level={1} onResult={onResult} rng={seededRng(8)} />);
    expect(screen.getByText(PLAY_COPY.flightWatch)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(PLAY_COPY.lanternA11y(r.sequence[0] + 1)));
    act(() => jest.advanceTimersByTime(5000));
    expect(screen.getByText(PLAY_COPY.flightAsk)).toBeTruthy();
    r.reverseSequence.forEach((id) => fireEvent.press(screen.getByLabelText(PLAY_COPY.lanternA11y(id + 1))));
    act(() => jest.advanceTimersByTime(600));
    expect(onResult).toHaveBeenCalledWith(true);
  });
});
