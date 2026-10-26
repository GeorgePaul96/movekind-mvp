import { gardenBadges, treeCaption, workoutGrowthLine } from '../src/domain/garden/badges';
import type { GardenState } from '../src/domain/garden/garden';

const base: GardenState = { stream: 0, ducks: false, grass: 1, tree: 0, birds: false, flowers: [], resting: false };
const banned = /dry|dead|dying|wilt|brown|missed|lost|behind|only|fail/i;

describe('gardenBadges', () => {
  it('a garden with no workouts yet has a young sprout', () => {
    expect(gardenBadges(base)).toEqual({ sky: 'Soft breeze', tree: 'Young sprout' });
  });

  it('names what the water and tree have become', () => {
    expect(gardenBadges({ ...base, stream: 2, ducks: true, tree: 3, birds: true })).toEqual({
      sky: 'Ducks visiting',
      tree: 'Birds nesting',
    });
    expect(gardenBadges({ ...base, tree: 5 }).tree).toBe('Fruit ripening');
  });

  it('a resting garden rests under the moon', () => {
    expect(gardenBadges({ ...base, resting: true, tree: 4 }).sky).toBe('Resting under the moon');
  });

  it('never uses a negative word, whatever the state', () => {
    for (const stream of [0, 1, 2, 3, 4] as const)
      for (const tree of [0, 1, 2, 3, 4, 5, 6] as const)
        for (const resting of [true, false]) {
          const b = gardenBadges({ ...base, stream, tree, resting, ducks: stream >= 2 });
          expect(`${b.sky} ${b.tree} ${treeCaption(tree)}`).not.toMatch(banned);
        }
  });
});

describe('treeCaption', () => {
  it('describes the tree for the then-and-now cards', () => {
    expect(treeCaption(0)).toBe('A tiny sprout');
    expect(treeCaption(5)).toBe('A tree full of fruit');
  });
});

describe('workoutGrowthLine', () => {
  it('names the next stage when this workout reaches it', () => {
    expect(workoutGrowthLine(0, 10)).toBe('This will turn your sprout into a sapling.');
    expect(workoutGrowthLine(50, 20)).toBe('This will grow your sapling into a young tree.');
  });

  it('is still encouraging when no new stage is reached', () => {
    expect(workoutGrowthLine(70, 10)).toBe('This helps your tree grow a little more.');
  });

  it('the fullest garden still grows', () => {
    expect(workoutGrowthLine(5000, 30)).toBe('This keeps your two trees thriving.');
  });
});
