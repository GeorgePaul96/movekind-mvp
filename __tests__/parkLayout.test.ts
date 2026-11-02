import { PARALLAX, parkLayout, type ParkObject, type Rect } from '../src/domain/park/layout';

const centreX = (r: Rect) => r.x + r.w / 2;
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('parkLayout', () => {
  it('the park is exactly one screen', () => {
    const l = parkLayout(390, 844);
    expect(l.worldW).toBe(390);
    expect(l.worldH).toBe(844);
  });

  it('objects are ordered left to right: flowerbed, tree, path, river, hammock', () => {
    const { objects } = parkLayout(390, 844);
    const order = (Object.keys(objects) as ParkObject[]).sort((a, b) => centreX(objects[a]) - centreX(objects[b]));
    expect(order).toEqual(['flowerbed', 'tree', 'path', 'river', 'hammock']);
  });

  it('hotspots stay at least 44pt on small and large phones', () => {
    for (const [w, h] of [[320, 568], [430, 932]] as const) {
      for (const r of Object.values(parkLayout(w, h).objects)) {
        expect(r.w).toBeGreaterThanOrEqual(44);
        expect(r.h).toBeGreaterThanOrEqual(44);
        expect(r.w).toBeLessThanOrEqual(0.45 * w);
      }
    }
  });

  it('no two hotspots overlap', () => {
    for (const [w, h] of [[320, 568], [390, 844], [430, 932]] as const) {
      const rects = Object.values(parkLayout(w, h).objects);
      for (let i = 0; i < rects.length; i++)
        for (let j = i + 1; j < rects.length; j++) expect(overlaps(rects[i]!, rects[j]!)).toBe(false);
    }
  });

  it('startX is within scroll range', () => {
    const l = parkLayout(390, 844);
    expect(l.startX).toBeGreaterThanOrEqual(0);
    expect(l.startX).toBeLessThanOrEqual(l.worldW - 390);
  });

  it('far layers move less than near ones, and the ground stays put', () => {
    expect(PARALLAX.sky).toBeLessThan(PARALLAX.far);
    expect(PARALLAX.far).toBeLessThan(PARALLAX.mid);
    expect(PARALLAX.world).toBe(0);
  });
});
