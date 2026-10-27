import { parkLayout } from '../src/domain/park/layout';
import { parkCourses, sampleSpline, smoothPath } from '../src/domain/park/shapes';

const W = 412;
const H = 915;
const layout = parkLayout(W, H);
const { worldH, objects } = layout;
const courses = parkCourses(layout);
const centre = (r: { x: number; y: number; w: number; h: number }) => [r.x + r.w / 2, r.y + r.h / 2];
const near = (pts: number[][], [x, y]: number[], tol: number) => pts.some(([px, py]) => Math.hypot(px! - x!, py! - y!) < tol);

describe('park shapes (traced from the painted ground)', () => {
  it('the river runs from the hilltop, through its tap target, off the bottom edge', () => {
    expect(courses.river[0]![1]).toBeLessThan(worldH * 0.4);
    expect(near(sampleSpline(courses.river, 12), centre(objects.river), 12)).toBe(true);
    expect(courses.river[courses.river.length - 1]![1]).toBeGreaterThan(worldH);
  });

  it('the footpath runs from the hilltop, through its tap target, off the bottom edge', () => {
    expect(courses.walkway[0]![1]).toBeLessThan(worldH * 0.4);
    expect(near(sampleSpline(courses.walkway, 12), centre(objects.path), 12)).toBe(true);
    expect(courses.walkway[courses.walkway.length - 1]![1]).toBeGreaterThan(worldH);
  });

  it('the path never crosses the river or the flowerbed', () => {
    const riverRight = Math.max(...sampleSpline(courses.river, 12).map((p) => p[0]));
    const pathLeft = Math.min(...sampleSpline(courses.walkway, 12).map((p) => p[0]));
    expect(pathLeft - riverRight).toBeGreaterThan(W * 0.08);
    expect(pathLeft).toBeGreaterThan(objects.flowerbed.x + objects.flowerbed.w);
  });

  it('smoothPath draws a curve through every point', () => {
    const d = smoothPath([[0, 0], [10, 5], [20, 0]]);
    expect(d.startsWith('M0 0')).toBe(true);
    expect(d).toContain('20 0');
    expect((d.match(/C/g) ?? []).length).toBe(2);
  });
});
