import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@movekind/';

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // swallow
  }
}

export async function clearCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {
    // swallow
  }
}

export const cacheKeys = {
  activities: 'activities',
  reflections: 'reflections',
  goals: 'goals',
  profile: 'profile',
  insight: 'insight',
};
