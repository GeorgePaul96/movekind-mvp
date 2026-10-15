# API_MAP.md — Data access by caller

There is no network API: every read and write goes through the local repository
[`db`](src/services/db/index.ts). This maps each caller to the repository methods it uses.

## `src/store/sessionStore.ts`

| Action | Repository calls |
|---|---|
| `loadStatsAndHistory()` | `db.stats.all()` · `db.checkIns.since(localMidnight)` (today's check-in) · `db.sessions.latestActive()` · `db.blocks.forSession(id)` |
| `logCheckIn(mood)` | `db.checkIns.add(...)` — or `updateCheckIn({energy_score})` when today's check-in exists. **Never touches the paywall.** |
| `updateCheckIn(patch)` | `db.checkIns.update(todayId, patch)` |
| `startTodaysSession()` | `db.profile.get()` (premium) · `db.sessions.countCompleted()` (free limit → paywall) · `db.exercises.all()` · `db.blocks.recentCompletedExerciseIds(10)` · `db.sessions.add` · `db.blocks.addMany` |
| `safeHarborBypass()` | `db.exercises.all()` · `db.sessions.add` · `db.blocks.addMany` |
| `startSession()` | `db.sessions.update(id, {status:'started'})` |
| `completeBlock()` / `skipBlock()` | `db.blocks.update(id, …)` |
| `completeSession()` | `db.ratings.add(...)` (also updates stats) · `db.sessions.update(id, {status:'completed'})` · `db.stats.all()` · `loadWeek()` |
| `abandonSession()` | `db.sessions.update(id, {status:'abandoned'})` |
| `loadWeek()` | `db.checkIns.since(lastMonday−7d)` · `db.sessions.list({since, statuses:['completed']})` · `db.blocks.secondsBySession()` |
| `getFreeSessionsCount()` | `db.sessions.countCompleted()` |

## `src/store/profileStore.ts`

| Action | Repository calls |
|---|---|
| `hydrate()` | `db.profile.get()` |
| `setName()` / `setPremium()` | `db.profile.update(...)` |
| `eraseAll()` | `db.eraseAll()` + `settingsStore.reset()` |

## Services, screens, components

| Caller | Repository calls |
|---|---|
| `services/behavioralProfile.ts` | `db.sessions.list({since: 90d, statuses: completed/abandoned})` · `db.checkIns.since` · `db.ratings.list` |
| `screens/main/JourneyScreen.tsx` | `db.checkIns.all()` · `db.stats.all()` · `db.sessions.countCompleted()` · `db.ratings.list()` |
| `components/Paywall.tsx` | `db.ratings.list()` · `db.stats.all()` · beta upgrade → `profileStore.setPremium(true)` |
| `components/SessionComplete.tsx` | `db.sessions.countCompleted(thisMonday)` (weekly win) |

`settingsStore` keeps its own AsyncStorage key (`@movekind/settings`) for app preferences and the
onboarding flag — it is not user activity data.
