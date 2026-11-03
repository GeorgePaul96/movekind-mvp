import { parkLayout } from '../src/domain/park/layout';
import {
  FAWN_NOSE_DIP,
  fawnSpot,
  grassTufts,
  parkCourses,
  pathWidthAt,
  rabbitSpot,
  ribbonPath,
  riverWidthAt,
  sampleSpline,
  smoothPath,
} from '../src/domain/park/shapes';

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

  it('ribbonPath builds a closed tapering shape that widens from source to bottom edge', () => {
    expect(riverWidthAt(0)).toBeCloseTo(10, 1);
    expect(riverWidthAt(1)).toBeCloseTo(44, 1);
    const d = ribbonPath(courses.river, riverWidthAt);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });

  it('grassTufts never touch the river or the footpath', () => {
    const tufts = grassTufts(layout, courses);
    const riverSpine = sampleSpline(courses.river, 12);
    const walkSpine = sampleSpline(courses.walkway, 12);
    expect(tufts.length).toBeGreaterThan(8);

    for (const [tx, ty] of tufts) {
      riverSpine.forEach(([rx, ry], i) => {
        const half = riverWidthAt(i / (riverSpine.length - 1)) / 2;
        expect(Math.hypot(tx - rx, ty - ry)).toBeGreaterThanOrEqual(half + 10);
      });
      walkSpine.forEach(([wx, wy], i) => {
        const half = pathWidthAt(i / (walkSpine.length - 1)) / 2;
        expect(Math.hypot(tx - wx, ty - wy)).toBeGreaterThanOrEqual(half + 8);
      });
    }
  });

  it('at the bottom of a drink the nose lands in the water, on any phone', () => {
    for (const [w, h] of [[320, 568], [360, 800], [390, 844], [412, 915], [430, 932]] as const) {
      const l = parkLayout(w, h);
      const c = parkCourses(l);
      const { feet, size } = fawnSpot(l, c);
      const tip = [feet[0] + FAWN_NOSE_DIP[0] * size, feet[1] + FAWN_NOSE_DIP[1] * size];
      const spine = sampleSpline(c.river, 12);
      const inWater = spine.some(([x, y], i) => Math.hypot(x - tip[0]!, y - tip[1]!) < riverWidthAt(i / (spine.length - 1)) / 2);
      expect(inWater).toBe(true);
    }
  });

  it('the fawn stands on the bank, not in the water', () => {
    const { feet } = fawnSpot(layout, courses);
    const spine = sampleSpline(courses.river, 12);
    expect(near(spine, feet, riverWidthAt(1) / 2)).toBe(false);
  });

  it('the rabbit hops on open grass, clear of the river, the path and the flowerbed, on any phone', () => {
    for (const [w, h] of [[320, 568], [360, 800], [390, 844], [412, 915], [430, 932]] as const) {
      const l = parkLayout(w, h);
      const c = parkCourses(l);
      const river = sampleSpline(c.river, 12);
      const path = sampleSpline(c.walkway, 12);
      const { at: [cx, cy], rx: reachX, ry: reachY } = rabbitSpot(l);
      const bed = l.objects.flowerbed;
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const x = cx + Math.sin(a) * reachX;
        const y = cy + Math.sin(a * 2) * reachY;
        // The rabbit is drawn about 18pt either side of its middle.
        river.forEach(([px, py], j) => expect(Math.hypot(x - px, y - py)).toBeGreaterThan(riverWidthAt(j / (river.length - 1)) / 2 + 18));
        path.forEach(([px, py], j) => expect(Math.hypot(x - px, y - py)).toBeGreaterThan(pathWidthAt(j / (path.length - 1)) / 2 + 18));
        expect(y - 34).toBeGreaterThan(bed.y + bed.h);
      }
    }
  });

  it('fawnSpot places the fawn on the right bank with its nose on the river and the duck downstream', () => {
    const spot = fawnSpot(layout, courses);
    const riverSpine = sampleSpline(courses.river, 12);
    expect(spot.feet[0]).toBeGreaterThan(spot.water[0]);
    expect(near(riverSpine, spot.water, 4)).toBe(true);
    expect(spot.duck[1]).toBeGreaterThan(spot.water[1] + 20);
  });
});
