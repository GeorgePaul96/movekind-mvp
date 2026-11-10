import { create } from 'zustand';
import { db } from '@/services/db';
import { telemetry } from '@/services/telemetry';
import { localDayKey } from '@/domain/garden/days';
import type { BodyProfile, Measurement, PulseLog } from '@/types';

export type MeasurementValues = Pick<Measurement, 'weight_kg' | 'neck_cm' | 'waist_cm' | 'hip_cm'>;

interface BodyStoreState {
  profile: BodyProfile | null;
  /** Oldest day first. */
  measurements: Measurement[];
  /** Newest first. */
  pulses: PulseLog[];
  loaded: boolean;
  load: () => Promise<void>;
  saveProfile: (patch: Partial<BodyProfile>) => Promise<void>;
  /** Saves today's weigh-in and/or tape measurements (saving again today edits the row). */
  logMeasurement: (values: MeasurementValues) => Promise<void>;
  removeMeasurement: (id: string) => Promise<void>;
  logPulse: (bpm: number) => Promise<void>;
  /** Forgets everything in memory (after "Erase all my data"). */
  clear: () => void;
}

/**
 * The opt-in Body section's data. Like the garden store, it owns the db calls and
 * reports only that something was logged, never a value.
 */
export const useBodyStore = create<BodyStoreState>((set) => ({
  profile: null,
  measurements: [],
  pulses: [],
  loaded: false,

  load: async () => {
    try {
      const [profile, measurements, pulses] = await Promise.all([
        db.body.get(),
        db.measurements.all(),
        db.pulse.all(),
      ]);
      set({ profile, measurements, pulses, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  saveProfile: async (patch) => {
    set({ profile: await db.body.update(patch) });
  },

  logMeasurement: async (values) => {
    await db.measurements.upsertDay(localDayKey(new Date()), values);
    set({ measurements: await db.measurements.all() });
    telemetry.capture('logged', { kind: 'measurement' });
  },

  removeMeasurement: async (id) => {
    await db.measurements.remove(id);
    set((s) => ({ measurements: s.measurements.filter((m) => m.id !== id) }));
  },

  logPulse: async (bpm) => {
    const row = await db.pulse.add(Math.round(bpm));
    set((s) => ({ pulses: [row, ...s.pulses] }));
    telemetry.capture('logged', { kind: 'pulse' });
  },

  clear: () => set({ profile: null, measurements: [], pulses: [], loaded: false }),
}));
