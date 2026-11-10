# Body and Insights: design

Date: 2026-11-10. Status: awaiting owner approval. Nothing here is built yet.

## Why

The owner wants MoveKind to show people where their current pace is taking them, in the way
gotall.app does for height, and wants it to look like the printout of an advanced body
composition (BIA) machine: real numbers, a simple body picture, a detailed report. It must be
built on published science and computed on the phone. No AI model, no paid API, no server.

The owner also asked for more features people need that cost almost nothing to provide.

## What the owner decided

- A visual of how the body would look "at this pace", nothing fancy. A detailed report as well.
- Use as much real science as possible. Not an AI wrapper.
- **Opt-in split.** The body features are off until the person switches them on. The yard,
  Maple, Pudding, Changes and the reminder never mention them.
- Camera heart rate is left out of this round.
- UI polish is not the priority. Function first.

Everything else in this document is Claude's call unless it says "owner".

## Goals

1. A person can enter a few tape measurements and get a body composition report.
2. After about two weeks of weigh-ins they can see a projection at 4, 12 and 26 weeks, as a
   range, with a now-and-later silhouette.
3. Four smaller insights from data the app already has: Patterns, Sleep balance, Steps and
   long-term health, Fitness estimate.
4. A full export of their data and report.
5. Every number shows which published formula it came from.

## Non-goals

- Calorie or food logging. Food stays "did you eat, which meals".
- Camera heart rate, photo morphing, 3D avatars.
- Reading weight from Apple Health / Health Connect (later; the data model allows it).
- Reminders to weigh in. Targets, goal weights, streaks, scores.
- Any server, account or network call.

## Anti-goals (would make this a failure even if it works)

- The yard or Changes ever referring to weight, body fat or a projection.
- A projection shown as one precise number, or shown with too little data.
- Numbers with no source, or coefficients typed from memory and never checked.
- Celebrating a projection that heads below a healthy weight.
- Body data in telemetry.

## Where it lives

The drawer gains one section, **Insights**, between Changes and Me.

- Always visible in Insights: **Patterns** and **Export**.
- Behind one switch in Me, "Body and numbers" (`settingsStore.bodyEnabled`, default off):
  **Body** (report, projection, silhouette), **Sleep balance**, **Steps and health**,
  **Fitness estimate**. These state numbers and shortfalls, which the calm app never does, so
  they share the opt-in.
- Switching it on shows a one-time notice: these are wellness estimates from published formulas,
  not a medical device or diagnosis; the formulas are for adults and are not valid in pregnancy.
- Adults only. If the birth year makes the person under 18 the Body section explains kindly that
  the formulas are for adults and shows nothing else.
- Switching it off hides everything again and keeps the data. "Erase all my data" removes it.

## Data model

Stored metric, on the phone, through `src/services/db` only. Keep `src/types/index.ts` and
`DATABASE.md` in sync.

- `body` (single doc): `{ sex: 'male' | 'female', birth_year: number, height_cm: number,
  sleep_need_hours: number (7 to 9, default 7.5) }`. `sex` is asked as "Which formula set should
  we use?" because every formula below has only male and female versions.
- `measurements` (table, one row per local day, saving again that day edits it):
  `{ id, day (localDayKey), weight_kg?, neck_cm?, waist_cm?, hip_cm?, created_at }`.
- `pulse` (table): `{ id, bpm, created_at }`. A resting pulse the person counted.
- `settingsStore`: `bodyEnabled: boolean`, `units: 'metric' | 'imperial'` (display and entry only).
- `db.eraseAll()` clears all three.
- Telemetry: `logged { kind: 'measurement' }` and `logged { kind: 'pulse' }`, never values.
  Add the new field names to the strip list in `telemetryPrivacy.ts`.

A new `bodyStore` (Zustand) owns loading and the log actions, the same shape as `gardenStore`.

## The science (all pure functions, `now` passed in, no I/O)

The builder must open each cited source and check every coefficient before coding it, and each
function gets a test against a worked reference value. Where this document gives numbers, treat
them as a starting point to verify, not as the authority.

### Body composition: `src/domain/body/composition.ts`

- **Body fat %**: US Navy circumference method (Hodgdon and Beckett, 1984), centimetres, log10.
  - Male: `495 / (1.0324 - 0.19077*log10(waist - neck) + 0.15456*log10(height)) - 450`
  - Female: `495 / (1.29579 - 0.35004*log10(waist + hip - neck) + 0.22100*log10(height)) - 450`
  - Shown as the value plus or minus 3.5 points (the method's standard error), clamped to 3 to 60.
- **Fat mass** = weight x BF%. **Lean mass** = weight - fat mass.
- **BMI** = kg / m^2. **Waist to height ratio** = waist / height.
- **Fat-free mass index** = lean mass / m^2.
- Each value is drawn on a simple scale with the reference band from its source (WHO for BMI,
  NICE 2022 for waist to height at 0.5). Words on the scale are neutral: "below the reference
  range", "in the reference range", "above the reference range". No "obese", no red.
- Needs height, weight, neck and waist (plus hip for the female formula). With only height and
  weight, show BMI alone and say what to measure for the rest. A short "how to measure" text for
  each tape site.

### Energy: `src/domain/body/energy.ts`

- **Resting burn**: Mifflin-St Jeor (1990). Male `10W + 6.25H - 5A + 5`, female `... - 161`.
- **Steps**: distance = steps x stride, stride = 0.414 x height. Net cost of walking about
  0.5 kcal per kg per km (from the ACSM walking equation).
- **Logged movement**: net kcal = (MET - 1) x kg x hours, MET per `WorkoutType` from the 2011
  Compendium of Physical Activities (builder picks the closest general code for each type and
  lists them in one table). When steps are available, `walk` and `run` entries add nothing, as the
  steps already contain them.
- **Daily burn** = resting burn x 1.2 (thermic effect of food plus ordinary non-walking living)
  + steps energy + movement energy. Shown as a range of plus or minus 10%.
- Activity is the average of the last 14 days. With no step access, use logged movement only and
  say the estimate is rougher.

### Projection: `src/domain/body/projection.ts`

The app does not know what people eat, so it cannot project from calories. It projects from the
person's own weight trend.

1. **Trend**: least squares line through the weigh-ins of the last 42 days. Requires at least
   4 weigh-ins spanning at least 14 days; until then the screen says how many more it needs.
   Keep the slope's 95% confidence interval.
2. **Implied intake**: slope converted to a daily energy gap (using the fat and lean split below),
   added to the average daily burn over the same window. This is "your pace": that intake and
   that activity, held steady.
3. **Simulate forward one day at a time** to 26 weeks (Hall's dynamic model, simplified):
   - recompute daily burn from the simulated weight each day, so change slows over time instead
     of running in a straight line;
   - split each day's change with the Forbes rule as restated by Hall (2007): the lean share is
     `10.4 / (10.4 + fat mass in kg)`;
   - energy densities 9,400 kcal per kg of fat and 1,800 kcal per kg of lean (Hall, 2008).
4. Run it three times: for the central slope and both ends of the confidence interval. Report
   weight, body fat %, fat mass and lean mass at 4, 12 and 26 weeks as "about X (between L and H)".
   If the interval includes no change, say plainly that the pace is holding steady.
5. **What if**: one control, "and with N more steps a day" (0 to 5,000 in 1,000s), which adds that
   step energy to the simulation. It is the person's own experiment; the app never suggests a value.
6. **Guardrails**: never display below BMI 18.5; if the central trend loses more than 1% of body
   weight a week or would cross BMI 18.5 inside 26 weeks, replace the celebration-free projection
   with a calm note that this pace is faster than is usually considered healthy and that a doctor
   is the right person to talk to. No silhouette in that case.
7. States plainly what it ignores: water shifts, metabolic adaptation, muscle gained by training.

### Silhouette: `src/domain/body/silhouette.ts` + `src/components/body/Silhouette.tsx`

- Projected waist comes from inverting the Navy formula at the projected body fat %, holding
  neck and height fixed (for the female formula, waist and hip change in their current proportion).
- A pure function turns `{ height, neck, waist, hip (estimated from waist when not measured),
  body fat % }` into the outline points of a plain front-view figure: head, neck, shoulders,
  chest, waist, hips, thighs, calves. Widths come from the circumferences; heights are fixed
  fractions of total height.
- Drawn with react-native-svg as one flat shape in a single token colour. No face, no skin, no
  clothing, no gendered styling beyond the outline the numbers produce.
- Two figures side by side, "Now" and "In 4 / 12 / 26 weeks" (a Chip set picks the span), with the
  numbers underneath. No animation needed. One accessibility label that reads the numbers.

### Patterns: `src/domain/insights/patterns.ts`

The person's own links between things they already log, over the last 60 days (steps: 14 days,
because steps are not stored):

- sleep of 7 hours or more versus less, and that day's mood;
- a day with movement logged versus without, and mood;
- steps above versus below their own median, and mood;
- water above versus below their own median, and mood.

A pattern is shown only when there are at least 14 days with both values, at least 5 days in each
group, and the difference is at least half a standard deviation. Sentences say "in your logs" and
"tends to", never "because". Only the direction is stated, no numbers. Fewer than that: "Patterns
appear after about two weeks of logging."

### Sleep balance: `src/domain/insights/sleepDebt.ts`

Over the last 14 nights, for logged nights only (a night not logged is skipped, never treated as
zero): the sum of `sleep_need_hours - hours`, floored at zero. Shown as "about N hours behind over
two weeks" or "level". Sleep need is the person's own setting within the adult 7 to 9 hour
recommendation (AASM and Sleep Research Society consensus, 2015). Needs at least 5 logged nights.

### Steps and health: `src/domain/insights/stepsHealth.ts`

The person's 14-day average steps placed on the dose-response curve from Paluch et al. (2022,
Lancet Public Health, 15 cohorts): risk falls as steps rise and levels off around 6,000 to 8,000
a day for people 60 and over, 8,000 to 10,000 for younger adults. The builder takes the curve's
points from the paper. Shown as a small curve with a dot, and one sentence that says this is an
association seen across large groups, not a promise for one person. Needs 7 days of steps.

### Fitness estimate: `src/domain/insights/fitness.ts`

Estimated VO2peak from the HUNT non-exercise model (Nes et al., 2011): age, waist, resting pulse
and an activity index built from frequency, intensity and duration. The app fills the index from
logged movement over the last 4 weeks and shows what it assumed. Resting pulse comes from a
30-second counter (tap start, count beats, enter the count) or a typed value; the latest reading
within 30 days is used. "Fitness age" is the age whose average VO2peak in the HUNT reference
tables equals the estimate. All coefficients and the reference table come from the papers at
build time. If they cannot be verified, ship VO2peak alone or leave the card out; do not guess.

### Export: `src/domain/insights/report.ts`

A pure function builds a plain text report (profile, latest composition, projection, insights,
sources) and a JSON dump of every table. Shared through the phone's share sheet. Use
`expo-sharing` and `expo-file-system` only if they are already installed; otherwise React
Native's `Share` with the text. No new native dependency in this round, so it keeps running in
Expo Go.

## Code layout

- `src/domain/body/` and `src/domain/insights/`: pure, one test file each in `__tests__/`.
- `src/constants/sources.ts`: one entry per formula (short name, authors, year, title), shown
  under each number as "Source: ...".
- `src/store/bodyStore.ts`; `src/services/db` gains `body`, `measurements`, `pulse`.
- `src/screens/main/InsightsView.tsx` (in the drawer) and `src/screens/main/BodyView.tsx`;
  components in `src/components/body/` (entry form, report rows with scale bars, Silhouette,
  pulse counter). Existing `Button`, `Chip`, `Card`, `Switch`; colours from tokens; copy in
  `copy.ts` (`BODY_COPY`, `INSIGHTS_COPY`); no em dashes; every control labelled.
- Docs: ROADMAP.md (replace the "Not doing: weight/BMI" line with "only inside the opt-in Body
  section"; add this work as a stage), CLAUDE.md, DATABASE.md, PROJECT_MAP.md, API_MAP.md.

## Build order

1. Data model, `bodyStore`, the Me switch, measurement entry, composition report.
2. Energy, projection, silhouette.
3. Patterns, Sleep balance, Steps and health, Fitness estimate with the pulse counter.
4. Export, docs.

Each step ends with `npm run typecheck` and `npm test` green.

## Left to the builder

Layout and wording of the screens, the exact scale-bar drawing, MET code choices, the silhouette's
proportions, and how the entry form validates ranges (reject values outside plausible human
limits, kindly).
