# Body and Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An opt-in Body section (composition report, "at this pace" projection, silhouette) plus Patterns, Sleep balance, Steps and health, Fitness estimate and Export, all computed on the phone from published formulas.

**Architecture:** Pure functions in `src/domain/body/` and `src/domain/insights/` (no I/O, `now` passed in) do all the maths. A new `bodyStore` owns three new `db` collections. Two thin views (`InsightsView`, `BodyView`) sit in the yard drawer between Changes and Me.

**Tech Stack:** Expo SDK 58, React Native, TypeScript strict, Zustand, AsyncStorage via `src/services/db`, react-native-svg, Jest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-10-body-and-insights-design.md`

## Global Constraints

- No new npm dependency; everything keeps running in Expo Go.
- No network call, no server, no AI model.
- All data access through `src/services/db`; stored metric; keep `src/types/index.ts` and `DATABASE.md` in sync.
- Domain code is pure: no I/O, no React, no clock (`now: Date` is a parameter).
- Colours only from tokens in `src/constants/colors.ts`; weights via `font.*`; min font 13; 44pt targets; every control labelled.
- User-facing strings in `src/constants/copy.ts`; no em dashes.
- Controls: `Button`, `Chip`, `Card`, RN `Switch`; no hand-rolled `Pressable` buttons in screens.
- Telemetry sends `logged { kind }` only, never values.
- Every coefficient is checked against its cited source before it is coded; each formula has a test against a worked reference value. If a source cannot be verified, the feature that depends on it is reduced or left out and that is reported.
- The yard, Maple, Pudding, Changes and the reminder never mention body numbers.
- Body numbers are hidden unless `settingsStore.bodyEnabled` is true (default false). Adults only.
- Verify with `npm run typecheck` and `npm test`.
- Work on branch `feat/body-insights`. Commit only when the owner asks.

## Review Focus

1. Waist not larger than neck (or other impossible tape values): composition returns `null`, never `NaN` or a crash.
2. Weigh-ins all on one day or too few: projection returns `{ status: 'need-more', ... }`, never a line through one point.
3. A trend that heads under BMI 18.5 or loses more than 1% a week: status `'too-fast'`, no numbers below the floor.
4. Nights or days not logged: skipped in Sleep balance and Patterns, never counted as zero.
5. Birth year that makes the person under 18, or missing profile fields: every body function returns `null` / the view shows the adults-only or "add your details" state.

---

### Task 1: Data model, store and switch

**Files:**
- Modify: `src/types/index.ts`, `src/services/db/index.ts`, `src/store/settingsStore.ts`, `src/services/telemetryPrivacy.ts`, `DATABASE.md`
- Create: `src/store/bodyStore.ts`
- Test: `__tests__/bodyStore.test.ts`, extend `__tests__/settingsStore.test.ts`, `__tests__/telemetryPrivacy.test.ts`

**Interfaces (produces):**

```ts
// types
export type FormulaSex = 'male' | 'female';
export interface BodyProfile { sex: FormulaSex | null; birth_year: number | null; height_cm: number | null; sleep_need_hours: number; } // default 7.5
export interface Measurement { id: string; day: string; weight_kg?: number; neck_cm?: number; waist_cm?: number; hip_cm?: number; created_at: string; }
export interface PulseLog { id: string; bpm: number; created_at: string; }
// db
db.body.get(): Promise<BodyProfile>; db.body.update(patch: Partial<BodyProfile>): Promise<BodyProfile>
db.measurements.all(): Promise<Measurement[]>  // oldest first by day
db.measurements.upsertDay(day: string, values: Pick<Measurement,'weight_kg'|'neck_cm'|'waist_cm'|'hip_cm'>): Promise<Measurement> // merges into that day's row
db.measurements.remove(id: string): Promise<void>
db.pulse.add(bpm: number): Promise<PulseLog>; db.pulse.all(): Promise<PulseLog[]> // newest first
// settings
bodyEnabled: boolean (default false); units: 'metric' | 'imperial' (default 'metric'); setBodyEnabled(v); setUnits(v)
// bodyStore
useBodyStore: { profile: BodyProfile | null; measurements: Measurement[]; pulses: PulseLog[]; loaded: boolean;
  load(): Promise<void>; saveProfile(patch: Partial<BodyProfile>): Promise<void>;
  logMeasurement(values): Promise<void>; removeMeasurement(id): Promise<void>; logPulse(bpm: number): Promise<void>; }
```

- [ ] Tests: upserting twice on one day leaves one merged row; `eraseAll` clears body, measurements, pulse; settings default `bodyEnabled === false` and survive hydrate; `sanitizeProperties` strips `weight_kg`, `waist_cm`, `neck_cm`, `hip_cm`, `height_cm`, `bpm`, `birth_year`, `sex`; `logMeasurement` captures `logged { kind: 'measurement' }` only.
- [ ] Implement; `profileStore.eraseAll` also resets `bodyStore`.
- [ ] `npm run typecheck` and `npm test` green.

### Task 2: Composition and energy

**Files:** Create `src/domain/body/composition.ts`, `src/domain/body/energy.ts`, `src/constants/sources.ts`. Test: `__tests__/composition.test.ts`, `__tests__/energy.test.ts`.

**Interfaces (produces):**

```ts
export function ageFrom(birthYear: number, now: Date): number;
export function navyBodyFat(i: { sex: FormulaSex; height_cm: number; neck_cm: number; waist_cm: number; hip_cm?: number }): number | null; // %, clamped 3..60
export interface Composition { weight_kg: number; bmi: number; bodyFatPct: number | null; fatMass_kg: number | null; leanMass_kg: number | null; ffmi: number | null; waistToHeight: number | null; }
export function composition(profile: BodyProfile, latest: MergedMeasurement): Composition | null; // null without height or weight
export function latestMeasurement(rows: Measurement[]): MergedMeasurement | null; // newest value of each field
export type Band = 'below' | 'within' | 'above';
export function bmiBand(bmi: number): Band; // 18.5..24.9 within
export function waistToHeightBand(r: number): Band; // 0.4..0.5 within
export const BODY_FAT_ERROR = 3.5;

export function restingBurn(sex: FormulaSex, weight_kg: number, height_cm: number, age: number): number;
export function stepsEnergy(steps: number, height_cm: number, weight_kg: number): number; // stride 0.414*height, 0.5 kcal/kg/km
export const WORKOUT_MET: Record<WorkoutType, number>;
export function workoutEnergy(type: WorkoutType, minutes: number, weight_kg: number, stepsAvailable: boolean): number; // walk/run add 0 when steps available
export function dailyBurn(i: { sex; weight_kg; height_cm; age; avgSteps: number | null; avgWorkoutKcal: number }): number; // resting*1.2 + steps + workouts
export function averageActivity(workouts: Workout[], stepsByDay: Record<string, number> | undefined, weight_kg: number, height_cm: number, now: Date): { avgSteps: number | null; avgWorkoutKcal: number }; // last 14 days
```

- [ ] Verify Navy, Mifflin-St Jeor, the walking cost and the MET codes against their sources (web), record citations in `sources.ts`.
- [ ] Tests: male 178 cm, neck 38, waist 90 gives 20.1 to 20.2%; waist <= neck gives `null`; female without hip gives `null`; male 80 kg, 178 cm, 35 y resting burn `1742.5`; female 65 kg, 165 cm, 30 y `1370.25`; walk workout adds 0 when steps are available; under-18 birth year gives `composition` `null`.
- [ ] Implement; typecheck and tests green.

### Task 3: Projection and silhouette maths

**Files:** Create `src/domain/body/projection.ts`, `src/domain/body/silhouette.ts`. Test: `__tests__/projection.test.ts`, `__tests__/silhouette.test.ts`.

**Interfaces (produces):**

```ts
export interface Trend { slopeKgPerWeek: number; low: number; high: number; n: number; spanDays: number; }
export function weightTrend(rows: Measurement[], now: Date): Trend | { needWeighIns: number; needDays: number }; // last 42 days; needs >= 4 weigh-ins over >= 14 days; 95% CI
export interface BodyPoint { weeks: number; weight_kg: number; bodyFatPct: number; fatMass_kg: number; leanMass_kg: number; }
export interface Projection { status: 'ok' | 'steady' | 'too-fast'; central: BodyPoint[]; low: BodyPoint[]; high: BodyPoint[]; } // weeks 4, 12, 26
export function project(i: { sex; age; height_cm; start: { weight_kg; bodyFatPct }; trend: Trend; avgSteps: number | null; avgWorkoutKcal: number; extraSteps: number }): Projection;
export function waistAtBodyFat(i: { sex; height_cm; neck_cm; bodyFatPct; waist_cm: number; hip_cm?: number }): { waist_cm: number; hip_cm?: number }; // Navy inverted
export interface Outline { path: string; width: number; height: number; }
export function silhouette(i: { height_cm; neck_cm; waist_cm; hip_cm?: number; bodyFatPct: number }, box: { width: number; height: number }): Outline;
```

Algorithm for `project` (the signature does not determine it): implied intake = `dailyBurn(start)` + slope/7 x density, where density = `9400*(1-p) + 1800*p`, `p = 10.4/(10.4 + fatMass)`. Then each simulated day: burn from the current simulated weight (plus `extraSteps`), balance = intake - burn, weight change = balance / density with `p` recomputed, split into fat and lean by `p`. `'steady'` when the trend interval contains 0. `'too-fast'` when the central slope loses more than 1% of body weight per week or any central point is under BMI 18.5; all displayed points are floored at BMI 18.5.

- [ ] Verify the Forbes/Hall lean share and energy densities against Hall 2007/2008.
- [ ] Tests: 3 weigh-ins gives `needWeighIns: 1`; 5 weigh-ins on one day gives `needDays: 14`; a perfect -0.5 kg/week series returns slope -0.5; loss at 26 weeks is smaller than 26 x the weekly slope (it slows); flat series gives `'steady'`; -1.2 kg/week at 70 kg gives `'too-fast'`; `extraSteps: 3000` ends lighter than `0`; `waistAtBodyFat` at the current body fat returns the current waist within 0.1 cm; a larger waist gives a wider outline at the waist row; outline path contains no `NaN`.
- [ ] Implement; typecheck and tests green.

### Task 4: Insights maths

**Files:** Create `src/domain/insights/patterns.ts`, `sleepDebt.ts`, `stepsHealth.ts`, `fitness.ts`. Tests: one file each in `__tests__/`.

**Interfaces (produces):**

```ts
export type PatternKind = 'sleep-mood' | 'movement-mood' | 'steps-mood' | 'water-mood';
export interface Pattern { kind: PatternKind; direction: 'up' | 'down'; }
export function patterns(i: { checkIns: CheckIn[]; sleep: SleepLog[]; workouts: Workout[]; water: WaterLog[]; stepsByDay?: Record<string, number> }, now: Date): Pattern[]; // >= 14 paired days, >= 5 per group, |d| >= 0.5
export function sleepBalance(sleep: SleepLog[], needHours: number, now: Date): { hoursBehind: number; nights: number } | null; // last 14 nights, >= 5 logged
export function stepsHealth(stepsByDay: Record<string, number>, age: number, now: Date): { average: number; relativeRisk: number; plateau: [number, number] } | null; // >= 7 days
export function activityIndex(workouts: Workout[], now: Date): { index: number; perWeek: number; avgMinutes: number };
export function vo2peak(i: { sex; age; waist_cm; restingPulse; activityIndex: number }): number;
export function fitnessAge(sex: FormulaSex, vo2: number): number | null;
export function restingPulse(pulses: PulseLog[], now: Date): number | null; // latest within 30 days
```

- [ ] Verify Paluch 2022 curve points, Nes 2011 coefficients and activity index, and the HUNT reference VO2peak table from the papers. If Nes or the reference table cannot be confirmed, drop `fitnessAge` (or the whole fitness card) and report it.
- [ ] Tests: 20 days where 7h+ nights have energy 4 and short nights energy 2 gives `sleep-mood` `up`; 10 days gives `[]`; identical groups gives `[]`; 6 nights of 6.5 h with need 7.5 gives `hoursBehind: 6`; 4 logged nights gives `null`; an unlogged night changes nothing; steps average on 6 days gives `null`; higher steps give lower `relativeRisk` until the plateau; `vo2peak` matches a worked example from the paper; higher resting pulse gives lower VO2peak.
- [ ] Implement; typecheck and tests green.

### Task 5: Screens

**Files:**
- Create: `src/screens/main/InsightsView.tsx`, `src/screens/main/BodyView.tsx`, `src/components/body/MeasureForm.tsx`, `ScaleBar.tsx`, `Silhouette.tsx`, `PulseCounter.tsx`, `SourceLine.tsx`, `src/domain/body/units.ts`
- Modify: `src/components/yard/YardDrawer.tsx` (Insights section between Changes and Me), `src/screens/main/MeView.tsx` ("Body and numbers" switch with the one-time notice, units choice), `src/constants/copy.ts` (`BODY_COPY`, `INSIGHTS_COPY`), `src/constants/colors.ts` only if a token is missing (then add its pair to `__tests__/colors.test.ts`), `App.tsx` or wherever stores load at launch (load `bodyStore`)
- Test: `__tests__/InsightsView.test.tsx`, `__tests__/BodyView.test.tsx`, `__tests__/units.test.ts`, extend `__tests__/MeView.test.tsx`

**Interfaces:** consumes everything from Tasks 1 to 4. `units.ts`: `toDisplayLength(cm, units)`, `fromDisplayLength(value, units)`, `toDisplayWeight(kg, units)`, `fromDisplayWeight(value, units)`.

- [ ] Tests: with `bodyEnabled` false, Insights shows Patterns and Export and no body text; switching on shows the notice once; with no profile BodyView shows the details form; under-18 shows the adults-only text and no numbers; with profile and measurements the report rows and a "Source:" line render; with 2 weigh-ins the projection area says how many more are needed; `'too-fast'` shows the doctor note and no silhouette; form rejects weight 5 kg and waist 500 cm with a kind message; imperial entry of 180 lb stores 81.6 kg.
- [ ] Implement. Entry ranges: height 120 to 230 cm, weight 30 to 300 kg, neck 20 to 70 cm, waist 40 to 200 cm, hip 50 to 200 cm, pulse 30 to 200 bpm, birth year 1900 to this year.
- [ ] Typecheck and tests green (including `noEmDash` and `colors`).

### Task 6: Export and docs

**Files:** Create `src/domain/insights/report.ts`; test `__tests__/report.test.ts`. Modify `InsightsView.tsx` (Export button, React Native `Share`), `ROADMAP.md`, `CLAUDE.md`, `DATABASE.md`, `PROJECT_MAP.md`, `API_MAP.md`.

**Interfaces (produces):** `buildReport(data: ReportInput, now: Date): { text: string; json: string }` where `ReportInput` holds the profile name, every garden table, and (only when `bodyEnabled`) body profile, measurements, pulses, composition and projection.

- [ ] Tests: report text contains no em dash; with `bodyEnabled` false the text and JSON contain no weight or measurement; JSON round-trips through `JSON.parse`; sources are listed for each number present.
- [ ] Implement; update docs (ROADMAP "Not doing" line becomes: body numbers only inside the opt-in Body section).
- [ ] Final `npm run typecheck` and `npm test` green.
