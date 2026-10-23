import type { TabParamList } from '../src/navigation/types';

describe('tabs', () => {
  it('tabs are Garden, Changes, Me', () => {
    const tabs: Record<keyof TabParamList, true> = { Garden: true, Changes: true, Me: true };
    expect(Object.keys(tabs)).toEqual(['Garden', 'Changes', 'Me']);
  });
});
