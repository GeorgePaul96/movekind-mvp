import { clampScore, percentChange } from '@/utils/analytics';

describe('Analytics Utility Functions', () => {
  describe('clampScore', () => {
    it('should clamp scores between 0 and 100', () => {
      expect(clampScore(-10)).toBe(0);
      expect(clampScore(110)).toBe(100);
      expect(clampScore(50)).toBe(50);
      expect(clampScore(NaN)).toBe(0);
      expect(clampScore(Infinity)).toBe(0);
    });
  });

  describe('percentChange', () => {
    it('calculates the correct percent change', () => {
      expect(percentChange([100, 150])).toBe(50);
      expect(percentChange([100, 50])).toBe(-50);
      expect(percentChange([0, 100])).toBe(100);
      expect(percentChange([100, 100])).toBe(0);
      expect(percentChange([100])).toBe(0);
      expect(percentChange([])).toBe(0);
    });
  });
});
