# DATABASE.md — Local data model

MoveKind is **local-first**: every byte of user data lives on the device. There is no backend,
no account and no sync. The only data layer is [src/services/db/](src/services/db/index.ts);
TS types live in [src/types/index.ts](src/types/index.ts). The former Supabase schema is kept for
reference only at [docs/archive/supabase-schema.sql](docs/archive/supabase-schema.sql).

## Storage

- **Engine:** AsyncStorage (works in Expo Go and dev/store builds). Each table is **one JSON
  document** under the key `@movekind/db/<table>`, cached in memory after the first read.
- **Writes are serialized per table** (a promise chain), so overlapping async writes (five quick
  taps on Water) never lose rows. The cache updates only after a write lands.
- **Corrupt or unreadable data** falls back to an empty table instead of crashing launch.
- **Size:** a few rows a day; years of use stay in the low hundreds of KB.
- **Backups:** iOS and Android device backups include app data. Uninstalling deletes it.

## Tables

| Key | Type | Notes |
|---|---|---|
| `profile` (single doc) | `Profile` | `id` (random install id, also the anonymous telemetry id and every check-in's `user_id`), `name` (optional, from onboarding), `created_at` (install day, used for `app_opened.day_index`). Created on first read. |
| `check_ins` | `CheckIn` | `energy_score` 1–5 (tiles write 1/2/4/5), `sleep_quality` and `intention` (unused, always null now), `engine_version` (`'garden-1'` for new rows), `created_at`. **A day is one check-in:** re-picking today's mood updates the row. Each becomes a flower. Optional `unwell` (true = feeling unwell today, gentle rain in the garden; absent on older rows; never sent to analytics). Optional `mood`: the yard mood (`tired\|low\|frustrated\|steady\|buzzing`), written with a matching `energy_score` (1/2/3/4/5) so the garden and Changes keep working. Older rows lack it; `yardMoodOf` derives it from `energy_score`. The old four-mood picker clears it. |
| `water` | `WaterLog` | One row per glass: `id`, `created_at`. Glasses today fill the stream. `db.water.remove` undoes a glass. |
| `workouts` | `Workout` | Logged by hand: `type` (`walk\|run\|yoga\|gym\|cycle\|sport\|dance\|other`), `minutes`, `created_at`. All-time minutes grow the tree. Editable and deletable. |
| `meals` | `MealLog` | One row per meal eaten: `meal` (`breakfast\|lunch\|dinner\|snack`), `created_at`. **Only which meal**, never what, how much or how it felt. `setMealsToday` makes today's rows match the ticked set (one row per meal per day). |
| `sleep` | `SleepLog` | One row per morning: `night_of` (localDayKey of the morning after), `hours` (half hours, 0 to 24), `feel` (`restless\|okay\|deep` or null), `created_at`. Logging again that morning edits the row. |
| `good_things` | `GoodThing` | "One good thing": one short note per local day (`day` = localDayKey, `text` up to 280 characters). `db.goodThings.setDay` replaces that day's note; empty text removes it. The words never go to telemetry (only `logged { kind: 'good_thing' }`). |
| `calories` | `CalorieLog` | Optional. One number per local day (`day`, `kcal`), typed on the food page only if the person wants to. `db.calories.setDay` replaces it; null removes it. Never judged, no target, value never sent to telemetry (only `logged { kind: 'calories' }`). |
| `day_states` | `DayState` | One row per local day: `pause` (`unwell\|overwhelmed\|travelling\|resting` or null) and `closed` (the day was closed for the night). `db.dayStates.setDay` merges a patch. The pause kind is private and never sent to telemetry; closing sends only `day_closed`. |
| `body` (single doc) | `BodyProfile` | Opt-in Body section only. `sex` (`male\|female`: which published formula set to use), `birth_year`, `height_cm` (all null until filled in), `sleep_need_hours` (7 to 9, default 7.5). |
| `measurements` | `Measurement` | Opt-in Body section only. One row per local day (`day` = localDayKey); `db.measurements.upsertDay` merges into that day's row. Optional `weight_kg`, `neck_cm`, `waist_cm`, `hip_cm`. **Always metric**; imperial is converted at entry and display (`domain/body/units.ts`). |
| `pulse` | `PulseLog` | Opt-in Body section only. A resting pulse the person counted: `bpm`, `created_at`. |

The three body collections are cleared by `db.eraseAll()`. Their values are never sent to telemetry
(only `logged { kind: 'measurement' \| 'pulse' }`), and the field names are on the telemetry strip list.

**Legacy:** the guided-session app stored `sessions`, `session_blocks`, `post_ratings` and
`user_exercise_stats`. `db.dropLegacy()` removes them at every launch (idempotent).

Settings (reminder on/off, reduce motion, onboarded, `bodyEnabled`, `bodyNoticeSeen`, `units`, `yardHome`, `flowSeenDay`) live separately under `@movekind/settings`
([settingsStore](src/store/settingsStore.ts)).

## Steps are read, not stored

Steps come from the phone's own counter each time (`src/services/steps.ts`: iOS pedometer,
Android Health Connect) for the last 14 days. MoveKind keeps no copy, so revoking access in the
phone's settings removes them from the app too.

## Derived, never stored

The garden (`gardenState`) and the Changes sentences (`weeklyChanges`, `flowersByWeek`) are pure
functions of the tables above. Nothing about the garden is persisted. The same holds for the Body
report, the projection, the silhouette and every insight (`src/domain/body/`, `src/domain/insights/`):
they are recomputed from the tables each time and never stored.

## Changing the data model

Touch three places together: the repository ([src/services/db/](src/services/db/index.ts)), the
types ([src/types/index.ts](src/types/index.ts)) and this file. Old stored rows simply lack new
fields, so make new fields optional or default them when reading.
