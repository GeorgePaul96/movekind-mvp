import type { ImageSourcePropType } from 'react-native';

/**
 * The forest's pictures: Kenney's CC0 low-poly models (Mini Forest, Fantasy Town, Platformer
 * and Cube Pets kits), rendered once to transparent PNGs and cropped so each stands on its
 * bottom edge, plus three skies cropped from Kenney's skyboxes. Credit: Kenney (kenney.nl).
 * `w` and `h` are the PNG's pixel size, so the scene can keep each picture's shape.
 */
export const FOREST_SPRITES = {
  tree: { src: require('../../assets/forest/tree.png'), w: 224, h: 408 },
  treeTall: { src: require('../../assets/forest/tree-tall.png'), w: 168, h: 401 },
  treeRound: { src: require('../../assets/forest/tree-round.png'), w: 158, h: 403 },
  treeCrooked: { src: require('../../assets/forest/tree-crooked.png'), w: 180, h: 400 },
  pine: { src: require('../../assets/forest/pine.png'), w: 204, h: 410 },
  plant: { src: require('../../assets/forest/plant.png'), w: 315, h: 187 },
  rocks: { src: require('../../assets/forest/rocks.png'), w: 380, h: 289 },
  stones: { src: require('../../assets/forest/stones.png'), w: 345, h: 217 },
  tent: { src: require('../../assets/forest/tent.png'), w: 410, h: 354 },
  fence: { src: require('../../assets/forest/fence.png'), w: 404, h: 237 },
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
