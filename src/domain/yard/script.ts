import { YARD_COPY } from '@/constants/copy';
import type { Point, YardLayout } from './layout';

export type ScriptTarget = 'water' | 'food' | 'ball' | 'pudding';
export type SheetKind = 'water' | 'food' | 'movement' | 'sleep' | 'mood' | 'steps';
export type DogAction = 'idle' | 'walk' | 'drink' | 'eat' | 'play' | 'snore' | 'hop';

export interface ScriptStep {
  kind: 'wakePudding' | 'walk' | 'action' | 'openSheet' | 'returnHome';
  mapleAction?: DogAction;
  puddingAction?: 'sleep' | 'wake' | 'walk' | 'eat' | 'snore';
  sheet?: SheetKind;
  delayMs?: number;
  initialLine?: { speaker: 'Maple' | 'Pudding'; text: string };
}

export interface TapScript {
  target: ScriptTarget;
  sheet: SheetKind;
  wakesPudding: boolean;
  openDelayMs: number;
  initialBubble: { speaker: 'Maple' | 'Pudding'; text: string } | null;
  steps: ScriptStep[];
}

export interface ScriptCompletion {
  saved: boolean;
  mapleHop: boolean;
  puddingRoll: boolean;
  bloomFlower: boolean;
  bubble: { speaker: 'Maple' | 'Pudding'; text: string } | null;
  walkHome: boolean;
}

export const OPEN_SHEET_DELAY_MS = 900;

/**
 * Pure step list for each tap in the yard (or from the drawer).
 */
export function yardScript(target: ScriptTarget): TapScript {
  switch (target) {
    case 'water':
      return {
        target: 'water',
        sheet: 'water',
        wakesPudding: false,
        openDelayMs: OPEN_SHEET_DELAY_MS,
        initialBubble: null,
        steps: [
          { kind: 'walk', mapleAction: 'walk', puddingAction: 'sleep' },
          { kind: 'action', mapleAction: 'drink', puddingAction: 'sleep', delayMs: OPEN_SHEET_DELAY_MS },
          { kind: 'openSheet', sheet: 'water', mapleAction: 'drink', puddingAction: 'sleep' },
          { kind: 'returnHome', mapleAction: 'walk', puddingAction: 'sleep' },
        ],
      };

    case 'food':
      return {
        target: 'food',
        sheet: 'food',
        wakesPudding: true,
        openDelayMs: OPEN_SHEET_DELAY_MS,
        initialBubble: { speaker: 'Pudding', text: YARD_COPY.waking.puddingFood },
        steps: [
          {
            kind: 'wakePudding',
            mapleAction: 'walk',
            puddingAction: 'wake',
            initialLine: { speaker: 'Pudding', text: YARD_COPY.waking.puddingFood },
          },
          { kind: 'walk', mapleAction: 'walk', puddingAction: 'walk' },
          { kind: 'action', mapleAction: 'eat', puddingAction: 'eat', delayMs: OPEN_SHEET_DELAY_MS },
          { kind: 'openSheet', sheet: 'food', mapleAction: 'eat', puddingAction: 'eat' },
          { kind: 'returnHome', mapleAction: 'walk', puddingAction: 'walk' },
        ],
      };

    case 'ball':
      return {
        target: 'ball',
        sheet: 'movement',
        wakesPudding: false,
        openDelayMs: OPEN_SHEET_DELAY_MS,
        initialBubble: null,
        steps: [
          { kind: 'walk', mapleAction: 'walk', puddingAction: 'sleep' },
          { kind: 'action', mapleAction: 'play', puddingAction: 'sleep', delayMs: OPEN_SHEET_DELAY_MS },
          { kind: 'openSheet', sheet: 'movement', mapleAction: 'play', puddingAction: 'sleep' },
          { kind: 'returnHome', mapleAction: 'walk', puddingAction: 'sleep' },
        ],
      };

    case 'pudding':
      return {
        target: 'pudding',
        sheet: 'sleep',
        wakesPudding: false,
        openDelayMs: OPEN_SHEET_DELAY_MS,
        initialBubble: { speaker: 'Pudding', text: YARD_COPY.waking.puddingSleepTap },
        steps: [
          {
            kind: 'action',
            mapleAction: 'idle',
            puddingAction: 'snore',
            delayMs: OPEN_SHEET_DELAY_MS,
            initialLine: { speaker: 'Pudding', text: YARD_COPY.waking.puddingSleepTap },
          },
          { kind: 'openSheet', sheet: 'sleep', mapleAction: 'idle', puddingAction: 'snore' },
          { kind: 'returnHome', mapleAction: 'idle', puddingAction: 'sleep' },
        ],
      };
  }
}

/**
 * Pure outcome when a sheet closes (either saved or dismissed).
 * Dismissing without saving never shows a line or sad face.
 */
export function scriptOutcome(target: ScriptTarget, saved: boolean): ScriptCompletion {
  if (!saved) {
    return {
      saved: false,
      mapleHop: false,
      puddingRoll: false,
      bloomFlower: false,
      bubble: null,
      walkHome: target !== 'pudding',
    };
  }

  switch (target) {
    case 'water':
      return {
        saved: true,
        mapleHop: true,
        puddingRoll: false,
        bloomFlower: true,
        bubble: { speaker: 'Maple', text: YARD_COPY.afterSave.water },
        walkHome: true,
      };
    case 'food':
      return {
        saved: true,
        mapleHop: true,
        puddingRoll: false,
        bloomFlower: true,
        bubble: { speaker: 'Pudding', text: YARD_COPY.afterSave.food },
        walkHome: true,
      };
    case 'ball':
      return {
        saved: true,
        mapleHop: true,
        puddingRoll: false,
        bloomFlower: true,
        bubble: { speaker: 'Maple', text: YARD_COPY.afterSave.ball },
        walkHome: true,
      };
    case 'pudding':
      return {
        saved: true,
        mapleHop: false,
        puddingRoll: true,
        bloomFlower: true,
        bubble: { speaker: 'Pudding', text: YARD_COPY.afterSave.pudding },
        walkHome: false,
      };
  }
}

/** Walk duration in ms: 5 ms per point of distance, capped at 1400 ms (0 ms if reduced motion). */
export function walkDurationMs(from: Point, to: Point, reduceMotion = false): number {
  if (reduceMotion) return 0;
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  if (dist < 2) return 0;
  return Math.min(1400, Math.max(320, Math.round(dist * 5)));
}

/** Generates 4 bounce spots inside the 30%-58% band for Maple's ball play loop. */
export function playBounceSpots(layout: YardLayout, count = 4): Point[] {
  const minX = Math.round(layout.width * 0.16);
  const maxX = Math.round(layout.width * 0.62);
  const minY = layout.bandTop + 28;
  const maxY = layout.bandBottom - 32;
  const ratios = [
    [0.25, 0.35],
    [0.75, 0.62],
    [0.42, 0.28],
    [0.60, 0.72],
  ];
  return Array.from({ length: count }, (_, i) => {
    const [rx, ry] = ratios[i % ratios.length]!;
    return {
      x: Math.round(minX + (maxX - minX) * rx),
      y: Math.round(minY + (maxY - minY) * ry),
    };
  });
}