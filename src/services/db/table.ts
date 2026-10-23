import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@movekind/db/';

/** Every live store registers here so tests can simulate an app restart. */
const caches: { drop: () => void }[] = [];

export function __resetDbCacheForTests(): void {
  for (const c of caches) c.drop();
}

/**
 * A JSON value persisted under one AsyncStorage key, cached in memory after the
 * first read. All mutations run through a single promise chain, so overlapping
 * async writes (block complete + skip, two quick taps) can never lose data.
 * Unreadable stored data falls back to `fallback()` instead of crashing launch.
 */
function createStore<V>(name: string, fallback: () => V, isValid: (v: unknown) => v is V) {
  const key = PREFIX + name;
  let cache: V | undefined;
  let queue: Promise<unknown> = Promise.resolve();

  caches.push({ drop: () => { cache = undefined; } });

  async function load(): Promise<V> {
    if (cache !== undefined) return cache;
    let value: V | undefined;
    try {
      const raw = await AsyncStorage.getItem(key);
      const parsed: unknown = raw ? JSON.parse(raw) : undefined;
      if (isValid(parsed)) value = parsed;
    } catch {
      // corrupt or unreadable — start clean rather than crash the app
    }
    cache = value ?? fallback();
    return cache;
  }

  function mutate<R>(op: (current: V) => { next: V; result: R }): Promise<R> {
    const run = queue.then(async () => {
      const { next, result } = op(await load());
      await AsyncStorage.setItem(key, JSON.stringify(next));
      cache = next; // only after the write lands, so a failed save leaves no ghost row
      return result;
    });
    queue = run.catch(() => undefined); // a failed write must not block later ones
    return run;
  }

  async function read(): Promise<V> {
    await queue; // reads see every write issued before them
    return load();
  }

  async function clear(): Promise<void> {
    const run = queue.then(async () => {
      cache = undefined;
      await AsyncStorage.removeItem(key);
    });
    queue = run.catch(() => undefined);
    return run;
  }

  return { read, mutate, clear };
}

export interface Table<T extends { id: string }> {
  all(): Promise<T[]>;
  insert(row: T): Promise<T>;
  insertMany(rows: T[]): Promise<T[]>;
  update(id: string, patch: Partial<T>): Promise<T | null>;
  replaceAll(rows: T[]): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export function createTable<T extends { id: string }>(name: string): Table<T> {
  const store = createStore<T[]>(name, () => [], (v): v is T[] => Array.isArray(v));
  return {
    all: async () => [...(await store.read())],
    insert: (row) => store.mutate((rows) => ({ next: [...rows, row], result: row })),
    insertMany: (newRows) => store.mutate((rows) => ({ next: [...rows, ...newRows], result: newRows })),
    update: (id, patch) =>
      store.mutate((rows) => {
        let updated: T | null = null;
        const next = rows.map((r) => (r.id === id ? (updated = { ...r, ...patch }) : r));
        return { next, result: updated };
      }),
    replaceAll: (rows) => store.mutate(() => ({ next: rows, result: undefined })),
    remove: (id) => store.mutate((rows) => ({ next: rows.filter((r) => r.id !== id), result: undefined })),
    clear: () => store.clear(),
  };
}

export interface Doc<V extends object> {
  get(): Promise<V>;
  update(patch: Partial<V>): Promise<V>;
  clear(): Promise<void>;
}

/** A single persisted object (e.g. the profile). `create()` runs on first read and is saved. */
export function createDoc<V extends object>(name: string, create: () => V): Doc<V> {
  const store = createStore<V | null>(name, () => null, (v): v is V => typeof v === 'object' && v !== null && !Array.isArray(v));
  const ensure = () =>
    store.mutate((cur) => {
      const value = cur ?? create();
      return { next: value, result: value };
    });
  return {
    get: async () => (await store.read()) ?? ensure(),
    update: (patch) =>
      store.mutate((cur) => {
        const value = { ...(cur ?? create()), ...patch };
        return { next: value, result: value };
      }),
    clear: () => store.clear(),
  };
}
