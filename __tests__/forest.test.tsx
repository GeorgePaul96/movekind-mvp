import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer } from 'expo-audio';
import { ForestScene } from '../src/components/home/ForestScene';
import { HOME_COPY } from '../src/constants/copy';
import { forestHeight, forestScene, forestSky } from '../src/domain/home/forest';
import { playNote, playSound } from '../src/services/sound';
import { useSettingsStore } from '../src/store/settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const none = { mood: false, water: false, food: false, movement: false, sleep: false };
const all = { mood: true, water: true, food: true, movement: true, sleep: true };
const scene = (over: Partial<Parameters<typeof forestScene>[0]> = {}) =>
  forestScene({ done: none, goodThing: false, closed: false, dayKey: '2026-11-18', width: 375, ...over });
const isForest = (role: string) => role === 'backdrop' || role === 'frame' || role === 'ground';

describe('the forest clearing', () => {
  it('is a whole forest even on an empty day, with no visitor yet', () => {
    const s = scene();
    expect(s.length).toBeGreaterThan(10);
    expect(s.every((p) => isForest(p.role))).toBe(true);
  });

  it('fills a wider screen with more trees and grass instead of stretching them', () => {
    const narrow = scene({ width: 320 }).filter((p) => p.role === 'backdrop').length;
    const wide = scene({ width: 800 }).filter((p) => p.role === 'backdrop').length;
    expect(wide).toBeGreaterThan(narrow);
    for (const p of scene({ width: 800 })) {
      expect(p.x).toBeGreaterThanOrEqual(-0.05);
      expect(p.x).toBeLessThanOrEqual(1.05);
    }
    expect(forestHeight(320)).toBe(300);
    expect(forestHeight(1000)).toBe(460);
    expect(forestHeight(375)).toBeGreaterThan(300);
  });

  it('each kind of care brings its own piece, which opens that page', () => {
    const s = scene({ done: all, goodThing: true });
    const kinds = s.filter((p) => p.role === 'care').map((p) => p.kind);
    expect(new Set(kinds)).toEqual(new Set(['sleep', 'water', 'food', 'mood', 'movement']));
    expect(s.map((p) => p.id)).toEqual(expect.arrayContaining(['tent', 'pond', 'mushrooms', 'flowersTall', 'deer', 'lantern']));
    expect(s.filter((p) => p.role === 'visitor')).toHaveLength(1);
  });

  it('only ever gains things: more care never removes anything', () => {
    const kinds = Object.keys(none) as (keyof typeof none)[];
    let before = scene().map((p) => p.key);
    const done = { ...none };
    for (const k of kinds) {
      done[k] = true;
      const after = scene({ done: { ...done } }).map((p) => p.key);
      for (const key of before) expect(after).toContain(key);
      before = after;
    }
  });

  it('never shows anything bare or dead', () => {
    const ids = scene({ done: all, goodThing: true, width: 900 }).map((p) => p.id);
    expect(ids.join(' ')).not.toMatch(/bare|dead|dry/i);
  });

  it('the same day always looks the same, and the night brings a bunny', () => {
    expect(scene({ done: { ...none, water: true } })).toEqual(scene({ done: { ...none, water: true } }));
    const night = scene({ done: { ...none, water: true }, closed: true });
    expect(night.find((p) => p.role === 'night')!.id).toBe('bunny');
    expect(night.some((p) => p.role === 'visitor')).toBe(false);
  });

  it('draws back to front, with unique keys', () => {
    const s = scene({ done: all, goodThing: true });
    for (let k = 1; k < s.length; k++) expect(s[k].depth).toBeGreaterThanOrEqual(s[k - 1].depth);
    expect(new Set(s.map((p) => p.key)).size).toBe(s.length);
  });

  it('follows the time of day, and is night once the day is closed', () => {
    expect(forestSky('dawn', false)).toBe('morning');
    expect(forestSky('day', false)).toBe('day');
    expect(forestSky('dusk', false)).toBe('morning');
    expect(forestSky('night', false)).toBe('night');
    expect(forestSky('day', true)).toBe('night');
  });
});

describe('the forest on screen', () => {
  const noon = new Date(2026, 10, 18, 12);

  it('tells a screen reader what is there', () => {
    render(<ForestScene done={{ ...none, water: true, sleep: true }} goodThing={false} closed={false} dayKey="d" now={noon} />);
    const label = screen.getByRole('image').props.accessibilityLabel as string;
    expect(label).toContain(HOME_COPY.forestThings.pond);
    expect(label).toContain(HOME_COPY.forestThings.tent);
  });

  it('tapping what care brought opens its page', () => {
    const onOpen = jest.fn();
    render(<ForestScene done={{ ...none, water: true }} goodThing={false} closed={false} dayKey="d" now={noon} onOpen={onOpen} />);
    fireEvent.press(screen.getByLabelText(HOME_COPY.forestOpen(HOME_COPY.forestThings.pond, HOME_COPY.care.water)));
    expect(onOpen).toHaveBeenCalledWith('water');
  });

  it('the visitor says hello when tapped, then goes quiet again', () => {
    jest.useFakeTimers();
    try {
      render(<ForestScene done={{ ...none, food: true }} goodThing={false} closed={false} dayKey="2026-11-18" now={noon} />);
      const visitor = screen.getByLabelText(/Say hello\.$/);
      fireEvent.press(visitor);
      expect(screen.getByText(HOME_COPY.forestHello[0])).toBeTruthy();
      act(() => jest.advanceTimersByTime(3000));
      expect(screen.queryByText(HOME_COPY.forestHello[0])).toBeNull();
    } finally {
      jest.useRealTimers();
    }
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
