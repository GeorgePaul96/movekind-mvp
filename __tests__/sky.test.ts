import { skyPhase } from '../src/domain/garden/sky';

const at = (h: number, m = 0) => new Date(2026, 9, 20, h, m);

describe('skyPhase', () => {
  it('follows the phone clock through the day', () => {
    expect(skyPhase(at(4, 59))).toBe('night');
    expect(skyPhase(at(5))).toBe('dawn');
    expect(skyPhase(at(7, 59))).toBe('dawn');
    expect(skyPhase(at(8))).toBe('day');
    expect(skyPhase(at(16, 59))).toBe('day');
    expect(skyPhase(at(17))).toBe('dusk');
    expect(skyPhase(at(19, 59))).toBe('dusk');
    expect(skyPhase(at(20))).toBe('night');
    expect(skyPhase(at(0))).toBe('night');
  });
});
