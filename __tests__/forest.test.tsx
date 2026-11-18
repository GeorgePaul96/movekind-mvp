import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer } from 'expo-audio';
import { ForestScene } from '../src/components/home/ForestScene';
import { HOME_COPY } from '../src/constants/copy';
import { forestScene, forestSky } from '../src/domain/home/forest';
import { playNote, playSound } from '../src/services/sound';
import { useSettingsStore } from '../src/store/settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const none = { mood: false, water: false, food: false, movement: false, sleep: false };
const all = { mood: true, water: true, food: true, movement: true, sleep: true };

describe('the forest clearing', () => {
  it('always has its trees, even on an empty day, and no visitor yet', () => {
    const scene = forestScene({ done: none, goodThing: false, closed: false, dayKey: '2026-11-18' });
    expect(scene.length).toBeGreaterThan(0);
    expect(scene.every((p) => p.reason === 'always')).toBe(true);
  });

  it('each kind of care brings its own thing in', () => {
    const scene = forestScene({ done: all, goodThing: true, closed: false, dayKey: '2026-11-18' });
    const ids = scene.map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining(['tent', 'pond', 'mushrooms', 'flowersTall', 'deer', 'lantern']));
    expect(scene.filter((p) => p.reason === 'visitor')).toHaveLength(1);
    // The deer is already here for movement, so the visitor is someone else.
    expect(scene.find((p) => p.reason === 'visitor')!.id).not.toBe('deer');
  });

  it('only ever gains things: more care never removes anything', () => {
    const kinds = Object.keys(none) as (keyof typeof none)[];
    let before = forestScene({ done: none, goodThing: false, closed: false, dayKey: 'd' }).map((p) => p.id);
    const done = { ...none };
    for (const k of kinds) {
      done[k] = true;
      const after = forestScene({ done: { ...done }, goodThing: false, closed: false, dayKey: 'd' }).map((p) => p.id);
      for (const id of before.filter((x) => !['fox', 'hedgehog', 'chick', 'bee', 'deer'].includes(x))) expect(after).toContain(id);
      expect(after.length).toBeGreaterThanOrEqual(before.length);
      before = after;
    }
  });

  it('the same day always gets the same visitor, and the night brings a bunny', () => {
    const a = forestScene({ done: { ...none, water: true }, goodThing: false, closed: false, dayKey: '2026-11-18' });
    const b = forestScene({ done: { ...none, water: true }, goodThing: false, closed: false, dayKey: '2026-11-18' });
    expect(a).toEqual(b);
    const night = forestScene({ done: { ...none, water: true }, goodThing: false, closed: true, dayKey: '2026-11-18' });
    expect(night.find((p) => p.reason === 'night')!.id).toBe('bunny');
    expect(night.some((p) => p.reason === 'visitor')).toBe(false);
  });

  it('draws back to front', () => {
    const scene = forestScene({ done: all, goodThing: true, closed: false, dayKey: 'x' });
    for (let k = 1; k < scene.length; k++) expect(scene[k].depth).toBeGreaterThanOrEqual(scene[k - 1].depth);
  });

  it('follows the time of day, and is night once the day is closed', () => {
    expect(forestSky('dawn', false)).toBe('morning');
    expect(forestSky('day', false)).toBe('day');
    expect(forestSky('dusk', false)).toBe('morning');
    expect(forestSky('night', false)).toBe('night');
    expect(forestSky('day', true)).toBe('night');
  });

  it('tells a screen reader what is there', () => {
    render(<ForestScene done={{ ...none, water: true, sleep: true }} goodThing={false} closed={false} dayKey="d" now={new Date(2026, 10, 18, 12)} />);
    const label = screen.getByRole('image').props.accessibilityLabel as string;
    expect(label).toContain(HOME_COPY.forestThings.pond);
    expect(label).toContain(HOME_COPY.forestThings.tent);
    render(<ForestScene done={none} goodThing={false} closed={false} dayKey="d" now={new Date(2026, 10, 18, 12)} />);
    expect(screen.getByLabelText(HOME_COPY.forestA11y([]))).toBeTruthy();
  });
});

describe('sounds', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await useSettingsStore.getState().reset();
  });

  it('are on by default, and the switch silences them and is remembered', async () => {
    await useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().soundsOn).toBe(true);
    await useSettingsStore.getState().setSoundsOn(false);
    useSettingsStore.setState({ soundsOn: true });
    await useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().soundsOn).toBe(false);
  });

  it('never throw, whatever the audio module does', () => {
    expect(() => playSound('water')).not.toThrow();
    expect(() => playNote(-3)).not.toThrow();
    expect(() => playNote(42)).not.toThrow();
    expect(typeof createAudioPlayer).toBe('function');
  });
});
