import { parkLayout } from '../src/domain/park/layout';
import { parkCourses, ribbon, sampleSpline, smoothPath } from '../src/domain/park/shapes';

const W = 412;
const H = 915;
const layout = parkLayout(W, H);
const { worldW, worldH, objects } = layout;
const courses = parkCourses(layout);
const centre = (r: { x: number; y: number; w: number; h: number }) => [r.x + r.w / 2, r.y + r.h / 2];
const near = (pts: number[][], [x, y]: number[], tol: number) => pts.some(([px, py]) => Math.hypot(px! - x!, py! - y!) < tol);

describe('park shapes', () => {
  it('the back hill is one unbroken line across the whole park', () => {
    const xs = courses.hill.map((p) => p[0]);
    expect(Math.min(...xs)).toBeLessThanOrEqual(0);
    expect(Math.max(...xs)).toBeGreaterThanOrEqual(worldW);
  });

  it('the river rises on the hill crest and flows off the bottom edge', () => {
    expect(courses.hill).toContainEqual(courses.river[0]);
    expect(courses.river[courses.river.length - 1]![1]).toBeGreaterThan(worldH);
  });

  it('the river runs through its tap target', () => {
    expect(near(sampleSpline(courses.river, 12), centre(objects.river), 12)).toBe(true);
  });

  it('the path leads from the hammock to the bottom edge, through its tap target', () => {
    const [sx, sy] = courses.walkway[0]!;
    const hm = objects.hammock;
    expect(sx).toBeGreaterThanOrEqual(hm.x);
    expect(sx).toBeLessThanOrEqual(hm.x + hm.w);
    expect(sy).toBeCloseTo(hm.y + hm.h, 0);
    expect(courses.walkway[courses.walkway.length - 1]![1]).toBeGreaterThan(worldH);
    expect(near(sampleSpline(courses.walkway, 12), centre(objects.path), 12)).toBe(true);
  });

  it('the path never crosses the river or the flowerbed', () => {
    const river = sampleSpline(courses.river, 12);
    const path = sampleSpline(courses.walkway, 12);
    const riverRight = Math.max(...river.map((p) => p[0]));
    const pathLeft = Math.min(...path.map((p) => p[0]));
    expect(pathLeft - riverRight).toBeGreaterThan(W * 0.08);
    const fb = objects.flowerbed;
    expect(pathLeft).toBeGreaterThan(fb.x + fb.w);
  });

  it('a ribbon is a closed shape that widens from start to end', () => {
    const d = ribbon([[0, 0], [0, 50], [0, 100]], 2, 20);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    const xs = [...d.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    const at = (y: number) => xs.filter((p) => Math.abs(p[1]! - y) < 0.01).map((p) => Math.abs(p[0]!));
    expect(Math.max(...at(0))).toBeCloseTo(1, 1);
    expect(Math.max(...at(100))).toBeCloseTo(10, 1);
  });

  it('smoothPath draws a curve through every point', () => {
    const d = smoothPath([[0, 0], [10, 5], [20, 0]]);
    expect(d.startsWith('M0 0')).toBe(true);
    expect(d).toContain('20 0');
    expect((d.match(/C/g) ?? []).length).toBe(2);
  });
});
