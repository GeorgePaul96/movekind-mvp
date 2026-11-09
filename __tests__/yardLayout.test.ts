import { rectsOverlap, yardLayout, type YardObject } from '../src/domain/yard/layout';

const SIZES: [number, number][] = [
  [360, 640],
  [390, 844],
  [430, 932],
];

const OBJECTS: YardObject[] = ['maple', 'water', 'food', 'ball', 'pudding'];

describe('yardLayout', () => {
  describe.each(SIZES)('phone %ix%i', (w, h) => {
    const layout = yardLayout(w, h);
    const minBandY = h * 0.29;
    const maxBandY = h * 0.51; // above an open sheet

    it('places Maple dead centre horizontally and about 32% of screen width tall', () => {
      expect(layout.spots.maple.x).toBe(Math.round(w * 0.5));
      expect(layout.mapleSize).toBe(Math.round(w * 0.32));
    });

    it.each(OBJECTS)('keeps %s spot and tap rect inside the screen and the 29%-51% band', (obj) => {
      const spot = layout.spots[obj];
      const rect = layout.rects[obj];

      expect(spot.x).toBeGreaterThanOrEqual(0);
      expect(spot.x).toBeLessThanOrEqual(w);
      expect(spot.y).toBeGreaterThanOrEqual(minBandY);
      expect(spot.y).toBeLessThanOrEqual(maxBandY);

      expect(rect.w).toBeGreaterThanOrEqual(48);
      expect(rect.h).toBeGreaterThanOrEqual(48);
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.w).toBeLessThanOrEqual(w);
      expect(rect.y).toBeGreaterThanOrEqual(minBandY);
      expect(rect.y + rect.h).toBeLessThanOrEqual(maxBandY);
    });

    it('has no overlapping tap rects', () => {
      for (let i = 0; i < OBJECTS.length; i++) {
        for (let j = i + 1; j < OBJECTS.length; j++) {
          const a = layout.rects[OBJECTS[i]!];
          const b = layout.rects[OBJECTS[j]!];
          expect(rectsOverlap(a, b)).toBe(false);
        }
      }
    });
  });
});