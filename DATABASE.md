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
| `check_ins` | `CheckIn` | `energy_score` 1–5 (tiles write 1/2/4/5), `sleep_quality` and `intention` (unused, always null now), `engine_version` (`'garden-1'` for new rows), `created_at`. **A day is one check-in:** re-picking today's mood updates the row. Each becomes a flower. |
| `water` | `WaterLog` | One row per glass: `id`, `created_at`. Glasses today fill the stream. `db.water.remove` undoes a glass. |
| `workouts` | `Workout` | Logged by hand: `type` (`walk\|run\|yoga\|gym\|cycle\|sport\|dance\|other`), `minutes`, `created_at`. All-time minutes grow the tree. Editable and deletable. |

**Legacy:** the guided-session app stored `sessions`, `session_blocks`, `post_ratings` and
`user_exercise_stats`. `db.dropLegacy()` removes them at every launch (idempotent).

Settings (reminder on/off, reduce motion, onboarded) live separately under `@movekind/settings`
([settingsStore](src/store/settingsStore.ts)).

## Derived, never stored

The garden (`gardenState`) and the Changes sentences (`weeklyChanges`, `flowersByWeek`) are pure
functions of the tables above. Nothing about the garden is persisted.

## Changing the data model

Touch three places together: the repository ([src/services/db/](src/services/db/index.ts)), the
types ([src/types/index.ts](src/types/index.ts)) and this file. Old stored rows simply lack new
fields, so make new fields optional or default them when reading.
