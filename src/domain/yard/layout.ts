export type YardObject = 'maple' | 'water' | 'food' | 'ball' | 'pudding';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface YardLayout {
  width: number;
  height: number;
  horizonY: number;
  fenceY: number;
  bandTop: number;
  bandBottom: number;
  mapleSize: number;
  puddingSize: number;
  treeSpot: Point;
  cushionSpot: Point;
  spots: Record<YardObject, Point>;
  /** Where Maple stands when interacting with each yard object. */
  mapleActionSpots: {
    home: Point;
    rainHome: Point;
    water: Point;
    food: Point;
    ball: Point;
  };
  /** Where Pudding stands when waking for the food bowl. */
  puddingActionSpots: {
    home: Point;
    food: Point;
  };
  /** Flower bloom anchors near each object. */
  flowerAnchors: Record<'water' | 'food' | 'ball' | 'pudding' | 'mood', Point[]>;
  rects: Record<YardObject, Rect>;
}

const MIN_TOUCH = 48;

function makeRect(center: Point, w: number, h: number): Rect {
  const rw = Math.max(MIN_TOUCH, Math.round(w));
  const rh = Math.max(MIN_TOUCH, Math.round(h));
  return {
    x: Math.round(center.x - rw / 2),
    y: Math.round(center.y - rh / 2),
    w: rw,
    h: rh,
  };
}

/**
 * Pure portrait-first layout for Maple's yard.
 * Every tappable object and its tap rect sits within 29% to 51% of screen height, so the dogs stay
 * visible above an open sheet (sheets reach up to about half the screen),
 * with no overlapping tap rects on any phone from 360x640 to 430x932.
 */
export function yardLayout(width: number, height: number): YardLayout {
  const w = Math.max(320, width);
  const h = Math.max(560, height);

  const horizonY = Math.round(h * 0.25);
  const fenceY = Math.round(h * 0.27);
  const bandTop = Math.ceil(h * 0.29);
  const bandBottom = Math.floor(h * 0.51);

  // Maple is about 32% of the screen width tall, sitting dead centre.
  const mapleSize = Math.round(w * 0.32);
  const puddingSize = Math.round(w * 0.25);

  // Upper tier in the band (around 34% height): Ball (left) and Pudding on cushion (right)
  const upperY = Math.round(h * 0.34);
  const ballSpot: Point = { x: Math.round(w * 0.19), y: upperY };
  const puddingSpot: Point = { x: Math.round(w * 0.78), y: upperY };

  // Middle tier in the band (around 41.5% height): Maple sitting dead centre
  const mapleSpot: Point = { x: Math.round(w * 0.50), y: Math.round(h * 0.415) };

  // Lower tier in the band (around 47% height): Water bowl (left) and Food bowl (right)
  const lowerY = Math.round(h * 0.47);
  const waterSpot: Point = { x: Math.round(w * 0.21), y: lowerY };
  const foodSpot: Point = { x: Math.round(w * 0.79), y: lowerY };

  const treeSpot: Point = { x: Math.round(w * 0.84), y: Math.round(h * 0.29) };
  const cushionSpot: Point = { x: puddingSpot.x, y: puddingSpot.y + 4 };

  const rects: Record<YardObject, Rect> = {
    ball: makeRect(ballSpot, 56, 50),
    pudding: makeRect(puddingSpot, 84, 52),
    maple: makeRect(mapleSpot, 76, 68),
    water: makeRect(waterSpot, 72, 50),
    food: makeRect(foodSpot, 72, 50),
  };

  return {
    width: w,
    height: h,
    horizonY,
    fenceY,
    bandTop,
    bandBottom,
    mapleSize,
    puddingSize,
    treeSpot,
    cushionSpot,
    spots: {
      maple: mapleSpot,
      ball: ballSpot,
      pudding: puddingSpot,
      water: waterSpot,
      food: foodSpot,
    },
    mapleActionSpots: {
      home: mapleSpot,
      rainHome: { x: Math.round(w * 0.66), y: Math.round(h * 0.37) },
      water: { x: waterSpot.x + 36, y: waterSpot.y - 6 },
      food: { x: foodSpot.x - 38, y: foodSpot.y - 6 },
      ball: { x: ballSpot.x + 32, y: ballSpot.y + 8 },
    },
    puddingActionSpots: {
      home: puddingSpot,
      food: { x: foodSpot.x + 28, y: foodSpot.y + 4 },
    },
    flowerAnchors: {
      water: [
        { x: Math.round(w * 0.12), y: Math.round(h * 0.59) },
        { x: Math.round(w * 0.28), y: Math.round(h * 0.61) },
        { x: Math.round(w * 0.16), y: Math.round(h * 0.65) },
      ],
      food: [
        { x: Math.round(w * 0.86), y: Math.round(h * 0.59) },
        { x: Math.round(w * 0.71), y: Math.round(h * 0.62) },
        { x: Math.round(w * 0.82), y: Math.round(h * 0.66) },
      ],
      ball: [
        { x: Math.round(w * 0.11), y: Math.round(h * 0.42) },
        { x: Math.round(w * 0.29), y: Math.round(h * 0.41) },
        { x: Math.round(w * 0.14), y: Math.round(h * 0.47) },
      ],
      pudding: [
        { x: Math.round(w * 0.89), y: Math.round(h * 0.42) },
        { x: Math.round(w * 0.67), y: Math.round(h * 0.41) },
      ],
      mood: [
        { x: Math.round(w * 0.40), y: Math.round(h * 0.62) },
        { x: Math.round(w * 0.60), y: Math.round(h * 0.63) },
      ],
    },
    rects,
  };
}

/** Pure helper checking if two Rects overlap. */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}