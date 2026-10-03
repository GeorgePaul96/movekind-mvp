import { colors, stateColors } from '../src/constants/colors';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const TEXT = 4.5;
const UI = 3;

describe('Sunrise palette contrast', () => {
  const textPairs: [string, string, string][] = [
    ['textPrimary on background', colors.textPrimary, colors.background],
    ['textSecondary on background', colors.textSecondary, colors.background],
    ['textSecondary on surfaceSecondary', colors.textSecondary, colors.surfaceSecondary],
    ['textMuted on background', colors.textMuted, colors.background],
    ['textMuted on surface', colors.textMuted, colors.surface],
    ['textMuted on surfaceSecondary', colors.textMuted, colors.surfaceSecondary],
    ['onPrimary on primary', colors.onPrimary, colors.primary],
    ['onPrimary on primaryPressed', colors.onPrimary, colors.primaryPressed],
    ['primary text on background', colors.primary, colors.background],
    ['primary text on surface', colors.primary, colors.surface],
    ['secondaryText on primarySoft', colors.secondaryText, colors.primarySoft],
    ['success on background', colors.success, colors.background],
    ['warning on background', colors.warning, colors.background],
    ['error on background', colors.error, colors.background],
    ['info on background', colors.info, colors.background],
  ];

  it.each(textPairs)('%s clears 4.5:1', (_name, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(TEXT);
  });

  it('primary outline is visible against the canvas (3:1)', () => {
    expect(ratio(colors.primary, colors.background)).toBeGreaterThanOrEqual(UI);
  });

  describe.each(Object.entries(stateColors))('%s', (_state, c) => {
    it('ink text on soft tile clears 4.5:1', () => expect(ratio(c.ink, c.soft)).toBeGreaterThanOrEqual(TEXT));
    it('white on accent clears 4.5:1', () => expect(ratio('#FFFFFF', c.accent)).toBeGreaterThanOrEqual(TEXT));
    it('accent as text on background clears 4.5:1', () => expect(ratio(c.accent, colors.background)).toBeGreaterThanOrEqual(TEXT));
    it('ink tile border vs background clears 3:1', () => expect(ratio(c.ink, colors.background)).toBeGreaterThanOrEqual(UI));
    it('tint bar vs surface clears 3:1', () => expect(ratio(c.tint, colors.surface)).toBeGreaterThanOrEqual(UI));
  });
});
