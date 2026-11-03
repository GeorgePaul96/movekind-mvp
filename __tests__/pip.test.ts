import type { GardenState } from '../src/domain/garden/garden';
import { parkLayout } from '../src/domain/park/layout';
import { pipMood, pipNotices, pipSpot } from '../src/domain/park/pip';
import { parkCourses, pathWidthAt, riverWidthAt, sampleSpline } from '../src/domain/park/shapes';
import { PIP_COPY } from '../src/constants/copy';

const base: GardenState = { stream: 0, ducks: false, grass: 1, tree: 0, birds: false, flowers: [], resting: false, weather: 'clear' };

describe('pipMood', () => {
  it('naps when the garden rests or at night, whatever else is true', () => {
    expect(pipMood({ ...base, resting: true }, false, true)).toBe('sleepy');
    expect(pipMood({ ...base, weather: 'rain' }, true, true)).toBe('sleepy');
  });

  it('holds a leaf in the rain, cheers after a log, and is otherwise happy', () => {
    expect(pipMood({ ...base, weather: 'rain' }, false, true)).toBe('rainy');
    expect(pipMood(base, false, true)).toBe('cheer');
    expect(pipMood(base, false, false)).toBe('happy');
  });
});

describe('pipNotices', () => {
  it('on a quiet day Pip only says hello and enjoys the shade, never what is missing', () => {
    expect(pipNotices(base, new Set(['river', 'tree', 'flowerbed']), false)).toEqual(['hello', 'calm']);
  });

  it('mentions what has grown', () => {
    const grown: GardenState = { ...base, stream: 3, tree: 2, birds: true, grass: 3 };
    expect(pipNotices(grown, new Set(), false)).toEqual(['hello', 'riverFull', 'flowerToday', 'birds', 'grassTall', 'calm']);
    expect(pipNotices({ ...base, stream: 1, tree: 1 }, new Set(['flowerbed']), false)).toEqual(['hello', 'riverAwake', 'treeGrowing', 'calm']);
  });

  it('only rests or waits out the rain, matching how Pip looks', () => {
    expect(pipNotices({ ...base, stream: 4 }, new Set(), true)).toEqual(['sleepy']);
    expect(pipNotices({ ...base, weather: 'rain' }, new Set(), false)).toEqual(['rainy']);
  });

  it('every notice has a line, and no line names a shortfall', () => {
    for (const line of Object.values(PIP_COPY.lines)) {
      expect(line).not.toMatch(/\b(less|fewer|missed|should|need|haven't|forgot|streak|goal)\b/i);
    }
  });
});

describe('pipSpot', () => {
  it.each([
    [360, 740],
    [390, 844],
    [430, 932],
  ])('stands on the grass clear of the river and path, above the drawer, at %ix%i', (W, H) => {
    const layout = parkLayout(W, H);
    const courses = parkCourses(layout);
    const { feet, size } = pipSpot(layout);
    expect(size).toBeGreaterThanOrEqual(48);
    expect(feet[0] - size / 2).toBeGreaterThan(0);
    expect(feet[0] + size / 2).toBeLessThan(W);
    expect(feet[1]).toBeLessThan(H - 76);
    const clear = (spine: number[][], widthAt: (t: number) => number) =>
      spine.every(([x, y], i) => Math.hypot(x! - feet[0], y! - feet[1]) > widthAt(i / (spine.length - 1)) / 2 + 4);
    expect(clear(sampleSpline(courses.river, 12), riverWidthAt)).toBe(true);
    expect(clear(sampleSpline(courses.walkway, 12), pathWidthAt)).toBe(true);
  });
});
