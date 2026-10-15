import type {
  CheckIn,
  Exercise,
  PostRating,
  Profile,
  Session,
  SessionBlock,
  UserExerciseStats,
} from '@/types';
import { EXERCISES, exerciseById } from '@/data/exercises';
import { applyRating } from '@/domain/sessions/applyRating';
import { createDoc, createTable } from './table';

export { __resetDbCacheForTests } from './table';

/**
 * MoveKind's only data layer. Everything lives on this phone (AsyncStorage);
 * nothing is sent to a server. Stores and screens call `db.*` — never
 * AsyncStorage directly — so moving to SQLite or adding sync later touches
 * this folder only.
 */

export type BlockWithExercise = SessionBlock & { exercise: Exercise };

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const nowIso = () => new Date().toISOString();
const newestFirst = <T extends { created_at: string }>(rows: T[]) =>
  [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));

const profileDoc = createDoc<Profile>('profile', () => ({
  id: newId(),
  name: null,
  is_premium: false,
  created_at: nowIso(),
}));
const checkInTable = createTable<CheckIn>('check_ins');
const sessionTable = createTable<Session>('sessions');
const blockTable = createTable<SessionBlock>('session_blocks');
const ratingTable = createTable<PostRating>('post_ratings');
const statsTable = createTable<UserExerciseStats>('user_exercise_stats');

const userId = async () => (await profileDoc.get()).id;

function withExercise(blocks: SessionBlock[]): BlockWithExercise[] {
  const out: BlockWithExercise[] = [];
  for (const b of blocks) {
    const exercise = exerciseById(b.exercise_id);
    if (exercise) out.push({ ...b, exercise }); // drop rows whose exercise was removed
  }
  return out;
}

export const db = {
  profile: {
    get: () => profileDoc.get(),
    update: (patch: Partial<Omit<Profile, 'id'>>) => profileDoc.update(patch),
  },

  checkIns: {
    add: async (input: Pick<CheckIn, 'energy_score' | 'sleep_quality' | 'intention' | 'engine_version'>) =>
      checkInTable.insert({ ...input, id: newId(), user_id: await userId(), created_at: nowIso() }),
    update: (id: string, patch: Partial<CheckIn>) => checkInTable.update(id, patch),
    all: async () => newestFirst(await checkInTable.all()),
    since: async (iso: string) => newestFirst((await checkInTable.all()).filter((c) => c.created_at >= iso)),
  },

  sessions: {
    add: async (input: Pick<Session, 'check_in_id' | 'state' | 'engine_version' | 'status'>) =>
      sessionTable.insert({ ...input, id: newId(), user_id: await userId(), created_at: nowIso() }),
    update: (id: string, patch: Partial<Session>) => sessionTable.update(id, patch),
    latestActive: async () =>
      newestFirst(await sessionTable.all()).find((s) => s.status === 'generated' || s.status === 'started') ?? null,
    list: async (opts: { since?: string; statuses?: Session['status'][] } = {}) =>
      newestFirst(await sessionTable.all()).filter(
        (s) => (!opts.since || s.created_at >= opts.since) && (!opts.statuses || opts.statuses.includes(s.status)),
      ),
    countCompleted: async (sinceIso?: string) =>
      (await sessionTable.all()).filter((s) => s.status === 'completed' && (!sinceIso || s.created_at >= sinceIso))
        .length,
  },

  blocks: {
    addMany: async (
      sessionId: string,
      rows: Pick<SessionBlock, 'exercise_id' | 'block_order' | 'target_duration'>[],
    ) => {
      const created = nowIso();
      const saved = await blockTable.insertMany(
        rows.map((r) => ({
          ...r,
          id: newId(),
          session_id: sessionId,
          actual_duration: null,
          status: 'pending' as const,
          created_at: created,
        })),
      );
      return withExercise(saved).sort((a, b) => a.block_order - b.block_order);
    },
    update: (id: string, patch: Partial<SessionBlock>) => blockTable.update(id, patch),
    forSession: async (sessionId: string) =>
      withExercise((await blockTable.all()).filter((b) => b.session_id === sessionId)).sort(
        (a, b) => a.block_order - b.block_order,
      ),
    /** Most recently completed exercise ids, newest first (anti-repetition input for the composer). */
    recentCompletedExerciseIds: async (limit: number) => {
      const sessionsNewest = newestFirst(await sessionTable.all());
      const blocks = await blockTable.all();
      const ids: string[] = [];
      for (const s of sessionsNewest) {
        const done = blocks
          .filter((b) => b.session_id === s.id && b.status === 'completed')
          .sort((a, b) => b.block_order - a.block_order);
        for (const b of done) {
          ids.push(b.exercise_id);
          if (ids.length >= limit) return ids;
        }
      }
      return ids;
    },
    /** Seconds actually moved per session id. */
    secondsBySession: async () => {
      const out: Record<string, number> = {};
      for (const b of await blockTable.all()) {
        out[b.session_id] = (out[b.session_id] ?? 0) + (b.actual_duration ?? 0);
      }
      return out;
    },
  },

  ratings: {
    /** Saves the rating and updates per-exercise stats (what the server trigger used to do). */
    add: async (input: Pick<PostRating, 'session_id' | 'rating_delta' | 'notes'>) => {
      const rating = await ratingTable.insert({ ...input, id: newId(), created_at: nowIso() });
      const completedIds = (await blockTable.all())
        .filter((b) => b.session_id === input.session_id && b.status === 'completed')
        .map((b) => b.exercise_id);
      const next = applyRating(await statsTable.all(), completedIds, input.rating_delta, new Date(), await userId());
      await statsTable.replaceAll(next);
      return rating;
    },
    list: async (sinceIso?: string) =>
      newestFirst((await ratingTable.all()).filter((r) => !sinceIso || r.created_at >= sinceIso)),
  },

  stats: {
    all: () => statsTable.all(),
  },

  exercises: {
    all: (): Exercise[] => EXERCISES,
  },

  /** Deletes everything this app stored, including the profile. */
  eraseAll: async () => {
    await Promise.all([
      profileDoc.clear(),
      checkInTable.clear(),
      sessionTable.clear(),
      blockTable.clear(),
      ratingTable.clear(),
      statsTable.clear(),
    ]);
  },
};
