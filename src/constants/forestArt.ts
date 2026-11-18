import type { ImageSourcePropType } from 'react-native';

/**
 * The forest's pictures, all CC0:
 * - Trees, bushes, grass and rocks: KayKit Forest Nature Pack by Kay Lousberg (kaylousberg.com).
 * - Tent, pond, flowers, mushrooms, lantern, rocks and the animals: Kenney's Mini Forest, Fantasy
 *   Town, Platformer and Cube Pets kits (kenney.nl).
 * - Skies: cropped from Kenney's skyboxes.
 * The 3D models were rendered once to transparent PNGs, cropped so each stands on its bottom
 * edge. `w` and `h` are the PNG's pixel size, so the scene keeps each picture's shape.
 */
export const FOREST_SPRITES = {
  oak: { src: require('../../assets/forest/kay-tree-1.png'), w: 309, h: 398 },
  blockTree: { src: require('../../assets/forest/kay-tree-2.png'), w: 266, h: 414 },
  pine: { src: require('../../assets/forest/kay-round.png'), w: 206, h: 387 },
  tallPine: { src: require('../../assets/forest/kay-round-c.png'), w: 146, h: 387 },
  umbrella: { src: require('../../assets/forest/kay-pine.png'), w: 324, h: 363 },
  bush: { src: require('../../assets/forest/kay-bush-1.png'), w: 310, h: 307 },
  bushTall: { src: require('../../assets/forest/kay-bush-2.png'), w: 374, h: 400 },
  bushLow: { src: require('../../assets/forest/kay-bush-3.png'), w: 324, h: 195 },
  grass: { src: require('../../assets/forest/kay-grass-1.png'), w: 342, h: 294 },
  grassTall: { src: require('../../assets/forest/kay-grass-2.png'), w: 343, h: 342 },
  grassBlades: { src: require('../../assets/forest/kay-grass-3.png'), w: 324, h: 393 },
  boulder: { src: require('../../assets/forest/kay-rock-1.png'), w: 327, h: 390 },
  stack: { src: require('../../assets/forest/kay-rock-3.png'), w: 362, h: 368 },
  rocks: { src: require('../../assets/forest/rocks.png'), w: 380, h: 289 },
  tent: { src: require('../../assets/forest/tent.png'), w: 410, h: 354 },
  lantern: { src: require('../../assets/forest/lantern.png'), w: 74, h: 405 },
  pond: { src: require('../../assets/forest/fountain.png'), w: 306, h: 163 },
  flowers: { src: require('../../assets/forest/flowers.png'), w: 317, h: 153 },
  flowersTall: { src: require('../../assets/forest/flowers-tall.png'), w: 284, h: 296 },
  mushrooms: { src: require('../../assets/forest/mushrooms.png'), w: 292, h: 252 },
  bunny: { src: require('../../assets/forest/bunny.png'), w: 298, h: 413 },
  deer: { src: require('../../assets/forest/deer.png'), w: 322, h: 400 },
  fox: { src: require('../../assets/forest/fox.png'), w: 260, h: 311 },
  bee: { src: require('../../assets/forest/bee.png'), w: 296, h: 447 },
  chick: { src: require('../../assets/forest/chick.png'), w: 375, h: 306 },
  hedgehog: { src: require('../../assets/forest/hedgehog.png'), w: 325, h: 373 },
} satisfies Record<string, { src: ImageSourcePropType; w: number; h: number }>;

export type SpriteId = keyof typeof FOREST_SPRITES;

export const FOREST_SKIES = {
  morning: require('../../assets/forest/sky-morning.jpg'),
  day: require('../../assets/forest/sky-day.jpg'),
  night: require('../../assets/forest/sky-night.jpg'),
} satisfies Record<string, ImageSourcePropType>;

export type SkyId = keyof typeof FOREST_SKIES;
