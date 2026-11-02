import { parkLayout } from '../src/domain/park/layout';
import { parkCourses, sampleSpline, smoothPath } from '../src/domain/park/shapes';

const W = 412;
const H = 915;
const layout = parkLayout(W, H);
const { worldH, objects } = layout;
const courses = parkCourses(layout);
const centre = (r: { x: number; y: number; w: number; h: number }) => [r.x + r.w / 2, r.y + r.h / 2];
const near = (pts: number[][], [x, y]: number[], tol: number) => pts.some(([px, py]) => Math.hypot(px! - x!, py! - y!) < tol);

describe('park shapes', () => {
  it('the river runs from the hill, through its tap target, off the bottom edge', () => {
    expect(courses.river[0]![1]).toBeLessThan(worldH * 0.5);
    expect(near(sampleSpline(courses.river, 12), centre(objects.river), 12)).toBe(true);
    expect(courses.river[courses.river.length - 1]![1]).toBeGreaterThan(worldH);
  });

  it('the footpath runs from the tree, through its tap target, off the bottom edge', () => {
    expect(courses.walkway[0]![1]).toBeLessThan(worldH * 0.6);
    expect(near(sampleSpline(courses.walkway, 12), centre(objects.path), 12)).toBe(true);
    expect(courses.walkway[courses.walkway.length - 1]![1]).toBeGreaterThan(worldH);
  });

  it('the path never crosses the river or the flowerbed', () => {
    const river = sampleSpline(courses.river, 12);
    const path = sampleSpline(courses.walkway, 12);
    const bed = objects.flowerbed;
    for (const p of path) {
      // Half the path's width, then the bed as drawn (1.15 times its target, half as tall as wide).
      expect(near(river, p, 31 + 8)).toBe(false);
      const clearX = Math.abs(p[0] - (bed.x + bed.w / 2)) > (bed.w * 1.15) / 2 + 14;
      const clearY = Math.abs(p[1] - (bed.y + bed.h / 2)) > (bed.w * 1.15 * 0.5) / 2 + 14;
      expect(clearX || clearY).toBe(true);
    }
  });

  it('the river and the path each wind in an S, turning back on themselves at least twice', () => {
    const turns = (pts: number[][]) => {
      const dirs = pts.slice(1).map((p, i) => Math.sign(p[0]! - pts[i]![0]!)).filter(Boolean);
      return dirs.slice(1).filter((d, i) => d !== dirs[i]).length;
    };
    expect(turns(sampleSpline(courses.river, 12))).toBeGreaterThanOrEqual(2);
    expect(turns(sampleSpline(courses.walkway, 12))).toBeGreaterThanOrEqual(2);
  });

  it('the tree stands left of centre, and its path starts at its foot', () => {
    const tree = objects.tree;
    expect(tree.x + tree.w / 2).toBeLessThan(W * 0.4);
    expect(Math.abs(courses.walkway[0]![0] - (tree.x + tree.w / 2))).toBeLessThan(W * 0.05);
    expect(Math.abs(courses.walkway[0]![1] - (tree.y + tree.h))).toBeLessThan(H * 0.02);
  });

  it('smoothPath draws a curve through every point', () => {
    const d = smoothPath([[0, 0], [10, 5], [20, 0]]);
    expect(d.startsWith('M0 0')).toBe(true);
    expect(d).toContain('20 0');
    expect((d.match(/C/g) ?? []).length).toBe(2);
  });
});
