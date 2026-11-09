import { YARD_COPY } from '../src/constants/copy';
import { scriptOutcome, yardScript } from '../src/domain/yard/script';

describe('yardScript', () => {
  it('water goes walk, drink, water sheet, return home', () => {
    const script = yardScript('water');
    expect(script.wakesPudding).toBe(false);
    expect(script.sheet).toBe('water');
    expect(script.steps.map((s) => s.kind)).toEqual(['walk', 'action', 'openSheet', 'returnHome']);
    expect(script.steps[1]?.mapleAction).toBe('drink');
  });

  it('food wakes Pudding with "Food?!", walks both dogs to eat, and opens food sheet', () => {
    const script = yardScript('food');
    expect(script.wakesPudding).toBe(true);
    expect(script.initialBubble).toEqual({ speaker: 'Pudding', text: YARD_COPY.waking.puddingFood });
    expect(script.steps[0]?.kind).toBe('wakePudding');
    expect(script.steps[2]?.mapleAction).toBe('eat');
    expect(script.steps[2]?.puddingAction).toBe('eat');
  });

  it('pudding stays asleep, snores, and opens sleep sheet', () => {
    const script = yardScript('pudding');
    expect(script.wakesPudding).toBe(false);
    expect(script.initialBubble).toEqual({ speaker: 'Pudding', text: YARD_COPY.waking.puddingSleepTap });
    expect(script.steps[0]?.puddingAction).toBe('snore');
    expect(script.sheet).toBe('sleep');
  });

  it('saving produces a happy hop, line, and flower; dismissing produces no line', () => {
    const savedWater = scriptOutcome('water', true);
    expect(savedWater.mapleHop).toBe(true);
    expect(savedWater.bloomFlower).toBe(true);
    expect(savedWater.bubble?.text).toBe(YARD_COPY.afterSave.water);

    const dismissedWater = scriptOutcome('water', false);
    expect(dismissedWater.mapleHop).toBe(false);
    expect(dismissedWater.bloomFlower).toBe(false);
    expect(dismissedWater.bubble).toBeNull();
  });
});