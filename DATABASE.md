# DATABASE.md — Local data model

MoveKind is **local-first**: every byte of user data lives on the device. There is no backend,
no account and no sync. The only data layer is [src/services/db/](src/services/db/index.ts);
TS types live in [src/types/index.ts](src/types/index.ts). The former Supabase schema is kept for
reference only at [docs/archive/supabase-schema.sql](docs/archive/supabase-schema.sql).

## Storage

- **Engine:** AsyncStorage (works in Expo Go and dev/store builds). Each table is **one JSON
  document** under the key `@movekind/db/<table>`, cached in memory after the first read.
- **Writes are serialized per table** (a promise chain), so overlapping async writes — e.g. a
  block completing while another is skipped — never lose rows.
- **Corrupt or unreadable data** falls back to an empty table instead of crashing launch.
- **Size:** a few rows a day — years of use stay in the low hundreds of KB.
- **Backups:** iOS and Android device backups include app data. Uninstalling deletes it.
  "Export my data" is a ROADMAP item.

## Tables

| Key | Type | Notes |
|---|---|---|
| `profile` (single doc) | `Profile` | `id` (random install id — also the anonymous telemetry id and every row's `user_id`), `name` (optional, from onboarding), `is_premium`, `created_at`. Created on first read. |
| `check_ins` | `CheckIn` | `energy_score` 1–5 (tiles write 1/2/4/5), `sleep_quality` (`good\|fair\|poor\|null`), `intention` (optional note), `engine_version`, `created_at`. **A day is one check-in:** re-picking today's mood updates the row. |
| `water` | `WaterLog` | One row per glass: `id`, `created_at`. Feeds the garden's stream (glasses today). `db.water.remove` undoes a glass. |
| `workouts` | `Workout` | Logged by hand: `type` (`walk\|run\|yoga\|gym\|cycle\|sport\|dance\|other`), `minutes`, `created_at`. All-time minutes grow the garden's tree. Editable and deletable. |
| `sessions` | `Session` | `check_in_id` (null for the gentle reset), `state`, `status` (`generated\|started\|completed\|abandoned`), `engine_version`, `created_at`. |
| `session_blocks` | `SessionBlock` | `session_id`, `exercise_id`, `block_order`, `target_duration` (s), `actual_duration` (s, nullable), `status` (`pending\|completed\|skipped\|swapped`), `created_at`. Read back joined to the exercise library (`BlockWithExercise`). |
| `post_ratings` | `PostRating` | `session_id`, `rating_delta` −1…2, `notes`, `created_at`. |
| `user_exercise_stats` | `UserExerciseStats` | Per exercise: `times_completed`, `average_energy_delta`, `last_completed_at`. **Written only by `db.ratings.add`.** |

## The exercise library

Not stored: it ships in the app as [src/data/exercises.ts](src/data/exercises.ts). **Ids are stable**
(`ex-<category>-<n>`) because stats are keyed by them — never renumber; add new exercises with the next
free index.

**Safety contract:** every exercise has `source` (authoritative page we cite — instructions are our own
words), optional `cautions` (the source's skip-this-if advice, shown and spoken in the player) and
`review`. Only `review: 'sourced'` exercises are returned by `db.exercises.all()` and can ever be
composed; `pending_review` ones (awaiting a physiotherapist) are hidden. `exerciseById` still finds
every entry so old history renders. Rationale and per-exercise sources:
[docs/exercise-source-review.md](docs/exercise-source-review.md).

## The stats engine

`db.ratings.add()` saves the rating, then runs the pure
[`applyRating`](src/domain/sessions/applyRating.ts) over that session's **completed** blocks — an
exact port of the former Postgres trigger: first time → `n=1, avg=delta`; otherwise
`avg = (avg·n + delta)/(n+1)`, `n+1`. The composer reads these stats to personalize sessions.

## Changing the data model

Touch three places together: the repository ([src/services/db/](src/services/db/index.ts)), the
types ([src/types/index.ts](src/types/index.ts)) and this file. Old stored rows simply lack new
fields, so make new fields optional or default them when reading.
