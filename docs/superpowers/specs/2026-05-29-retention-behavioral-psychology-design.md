# MoveKind — Behavioral Psychology & Retention Architecture

**Version:** 1.0  
**Date:** 2026-05-29  
**Status:** Approved — proceed to Phase 2 implementation  

---

## Problem Statement

Most retention frameworks fail wellness apps because they model users as rational agents who respond to rewards and lose interest from lack of stimulation. MoveKind's target users are not bored — they are exhausted, self-critical, and have been failed by previous apps that promised transformation and delivered shame.

The retention architecture must solve a different problem:

> **How do you create accountability and momentum for people whose previous experiences of accountability created damage?**

The answer is not to remove accountability. It is to make it **adaptive, earned, and emotionally timed**.

---

## Target Audience

- Burnout recovery (over-exercisers who crashed)
- Chronic illness / chronic fatigue / fibromyalgia
- Postpartum recovery
- Anxiety and depression
- Toxic gym culture recovery
- People who have completely lost motivation

These users do not need permission to rest. They have too much of it. They need **a structured path back to self-trust** — accountability without shame, momentum without pressure, identity without performance.

---

## System Architecture Overview

The engine has five interlocking layers. Each requires the previous one.

```
Layer 1 — SAFETY         Weeks 1–2    "This app will not hurt me"
Layer 2 — RITUAL         Weeks 2–6    "This app fits my life"
Layer 3 — IDENTITY       Weeks 6–12   "I am someone who moves"
Layer 4 — MASTERY        Months 3–6   "I am genuinely progressing"
Layer 5 — DEPTH          Months 6+    "I would feel real loss if this disappeared"
```

**Key constraint:** Features belonging to Layer 4 must not appear in Layer 1. A user who skips to challenge systems before establishing safety will abandon when the challenge fails.

---

## 1. The Rhythm System (Replacing Streaks)

### Why Streaks Fail This Audience

The Duolingo streak works because the stakes are low, the audience opted in to structured learning, and breaking a streak signals only "I forgot" — not "I am broken."

For MoveKind's user, a broken streak signals **I failed again** — exactly the emotional state they are trying to escape. Traditional streak mechanics are incompatible with this audience.

### The Rhythm Score

Replace streaks with a **28-day rolling consistency score** expressed as a percentage and a semantic label.

```
Rhythm Score = (active days in last 28) / 28 × 100
```

| Score | Label | Palette |
|---|---|---|
| 0–20% | Finding Your Way | Sky / calm |
| 21–40% | Early Rhythm | Sage light |
| 41–60% | Growing Consistency | Sage mid |
| 61–80% | Steady Rhythm | Sage dark |
| 81–100% | Deep Rhythm | Rich green |

**Why this works:**

1. **No cliff edge.** Missing one day moves from 75% to 71.4% — noticeable, not catastrophic. Duolingo's streak goes from alive to dead.
2. **Decay is gradual and visible.** Users can watch their rhythm slide and feel motivated to stop it without binary terror.
3. **Recovery is visible.** Three good days moves the number. Recovery feels earned.
4. **No single point of failure.** Mon/Wed/Fri movement equals the same 4-week rhythm as Mon–Fri one week. Both patterns are honored.

### Rhythm Insurance Tokens (Safety Layer only)

In `BUILDING` mode:
- 1 token earned per logged session
- Maximum 3 tokens banked
- A light week auto-uses a token; rhythm continues as a "supported" line (dotted, not broken)
- Framing: "Your rhythm held with support this week"
- Tokens phase out as the user reaches `STEADY` — their rhythm is robust enough without them

### Rhythm Wave Visualization

On the Progress screen, replace the W1/W2/W3/W4 bar chart with a **12-week wave graph**:
- X-axis: weeks
- Y-axis: sessions per week
- Peaks = active weeks; troughs = rest or recovery weeks
- Callouts for notable events: "Return", "Personal best week", "Recovery period"

A wave with troughs is not broken. It is honest. This is the emotional opposite of a streak counter.

---

## 2. Identity Progression System

### The Current Problem

Identity in the current app is **reactive and weekly** — it reflects what happened this week. There is no arc, no becoming, no sense that anything is permanently changing.

Long-term retention requires **durable identity evolution** — a sense that who you are as a mover is genuinely different from who you were 3 months ago.

### Permanent Identity Tiers

Tiers are earned over months and **never revoked**. They represent accumulation, not current-week state.

| Tier | Trigger | Name | Meaning |
|---|---|---|---|
| 0 | Sign up | First Steps | Beginning the journey |
| 1 | 2 complete active weeks | Regular Mover | Movement is becoming a habit |
| 2 | 8 active weeks total | Rhythm Keeper | Consistency is real and established |
| 3 | 2+ significant returns from break | Resilient Mover | Proven ability to come back |
| 4 | 6 months, 60%+ average rhythm | Movement Native | Movement is part of who you are |
| 5+ | Specialization path (user chooses) | (varies) | Deep identity along a chosen path |

**Tier 5 Specialization Paths (user selects one):**
- **Recovery Guide** — 70%+ of activity in recovery/low-effort types over 3+ months
- **Endurance Builder** — Consistent long-session pattern over 3+ months
- **Strength Seeker** — Consistent strength training pattern (also unlocks Intensity Mode)
- **Mindful Mover** — Combines movement + consistent weekly reflection over 3+ months

### Identity Transition Moments

When a user crosses a tier threshold, deliver a dedicated full-screen transition on next app open:

1. **Full-screen dedicated moment** — not a toast, not a banner
2. **Specific language** referencing actual user data: "You have logged movement in 16 of the last 20 weeks. That is not a habit anymore — that is who you are."
3. **Updated identity card** on ProfileScreen permanently reflects the new tier
4. **Timeline entry** — "Became a Rhythm Keeper" appears in the user's movement history

### Weekly Identity (contextual, not permanent)

Keep the reactive weekly identity (Back in Motion, Building Consistency, etc.) in the MovementStateCard, clearly labeled "This week." The permanent tier lives on ProfileScreen. These are distinct — contextual state vs. earned identity.

---

## 3. The Adaptive Accountability Engine

The core differentiator. **Pressure adapts to the user's actual state**, not to a uniform engagement funnel.

### State → Response Matrix

| Mode | Days Since Last | Response Type | Tone |
|---|---|---|---|
| `building` | 0–2 | Momentum nudge | "You moved 2 days ago. Keep the rhythm going." |
| `building` | 3–4 | Soft re-engagement | "It's been a few days. What does your body need today?" |
| `resting` | any | Validation + anticipation | "Rest noted. What are you looking forward to next week?" |
| `returning` | 4–9 | Zero pressure | "You came back. That is enough for today." |
| `inactive` | 10–13 | Direct invitation | "{N} days since your last session. One thing, 5 minutes." |
| `inactive` | 14–20 | Honest check-in | "Two weeks. What has been getting in the way?" |
| `inactive` | 21–29 | Start Fresh offer | "Three weeks. Want to begin a new chapter?" |
| `inactive` | 30+ | Monthly letter only | No push notifications. Monthly movement letter only. |

### Adaptive Pressure Calibration

The same message lands differently depending on the user's physiological state. Modify the base response tier:

- High-stress reflection (stress ≥ 7) → lower all prompts one tier
- Low motivation + low energy → lower all prompts one tier
- High energy + high motivation → escalate one tier is available

The AI coaching edge function must receive the user's current `MovementMode` and most recent wellness reflection as primary inputs — not just scores.

### The Honest Question System

At critical junctures (14+ days inactive, declining rhythm), ask a direct question instead of delivering a message:

- "What has been getting in the way of movement lately?"
- Options: Too tired / Life is busy / Lost motivation / Injury or pain / Other

Response is adaptive:
- Too tired → "Let's bring the effort floor down. Ten minutes is real."
- Life is busy → "What is one existing routine movement could attach to?"
- Lost motivation → "That is the signal to go smaller, not harder. What is the smallest possible thing?"
- Injury or pain → Recovery mode activated. No movement goals until user signals readiness.

This turns a churn risk into a trust-building conversation.

### The 2-Day Rule (Private, Internal)

Implemented silently in the notification system. Never shown as a rule or UI element.

- Track consecutive days without movement internally
- If day 2 without movement: "Tomorrow is worth protecting. Just ten minutes is enough."
- One missed day = acceptable variation. Two missed days = beginning of a decline pattern.
- Research basis: Lally et al. (2010) — habit disruption compounds after 2 missed days, not after 1.

---

## 4. Challenge System

### Design Principle

Challenges are **invitations, not requirements**. They expand possibility for stable users without punishing those who decline. Challenges do not appear before Layer 3 (identity phase).

### Weekly Micro-Challenges (Layer 3+)

Generated by AI based on current mode and personal pattern. Delivered Sunday evening for the coming week. User explicitly opts in or out. Always specific and achievable.

| Mode | Challenge Type | Example |
|---|---|---|
| BUILDING | Frequency nudge | "Log 3 sessions this week, even 10 minutes each" |
| BUILDING | Type diversity | "Try one movement type you have not logged yet" |
| STEADY | Duration push | "One session this week, go 15 minutes longer than usual" |
| STEADY | Recovery balance | "For each strength session, add one recovery session" |
| STEADY (high energy) | New territory | "Try something physically new this week" |
| RESTING | Micro-movement | "One 5-minute stretch this rest week" |

Challenges are never "exercise more." They are always specific, bounded, and relevant to this user's actual pattern.

### Personal Bests System (Automatic, Passive)

Track silently. Celebrate only when beaten. Never show deficits.

Tracked metrics:
- Longest single session (minutes)
- Most sessions in any 7-day window
- Earliest return from a break (fewest days inactive before returning)
- Highest 28-day rhythm score
- Longest sustained high-rhythm period (consecutive weeks above 60%)

When a personal best is broken, surface it at log time: "Longest session this year. 52 minutes." This fires only when something is good.

### Seasonal Arcs (Layer 4+)

Four 12-week voluntary arcs per year:

| Season | Theme | Movement Focus |
|---|---|---|
| Spring | Renewal | Re-establish or deepen a habit |
| Summer | Exploration | Outdoor, varied, or new movement types |
| Autumn | Depth | Longer sessions, greater intentionality |
| Winter | Inner Work | Recovery, reflection, restorative movement |

Users explicitly opt in. No leaderboard. Progress shows as a seasonal badge on the profile. Completion is personal.

---

## 5. Social Systems — Belonging Without Competition

### Why Leaderboards Are Wrong for This App

Leaderboards work when top performers are the aspirational identity. For MoveKind's audience, top performers are often the users they are **recovering from emulating**. A leaderboard would communicate: "Look how far behind you are from the person who exercises every day." That is the anti-product.

Research basis: Leaderboard participation in wellness apps correlates with higher short-term engagement and higher 30-day churn for the bottom 80% of performers.

### Anonymous Aggregate Belonging

Shown in the HomeScreen InsightCard once per week (not daily — daily would feel manipulative).

Examples:
- "This week, 71% of MoveKind users in rest mode stayed in rest mode. You are in good company."
- "The most logged movement this week: walking. Same as yours."
- "47% of users who moved this week did it in sessions under 20 minutes."

Framing: **You are not alone in this.** Never: **Look how much others are doing.**

Data generated from real aggregate Supabase queries with privacy-safe bucketing (minimum cohort size 50).

### Movement Buddy (1:1 Accountability)

A single accountability relationship — the highest-retention social feature in wellness research.

Mechanics:
- Invite exactly one person (by email or link)
- Buddy sees your **MovementMode only** — not session details, duration, or effort
- You see their MovementMode
- Each can send one "nudge" per day: a push notification saying "{Name} is thinking of you"
- No in-app text chat (keeps it simple and safe)
- Either party can end the relationship at any time, privately

Why this works: Knowing one specific person sees your rhythm creates social inertia without performance pressure. The nudge is a caring gesture, not a shame mechanism.

### Community Cohorts (Layer 4+)

Anonymous topic-based groups:

- Recovery Movers
- Chronic Illness & Fatigue
- Postpartum Returners
- Anxiety & Movement
- Gym Culture Recovery

Rules:
- No individual movement stats visible to others
- Text-only posts
- Moderated; zero-tolerance for shame or comparison language
- Weekly thread prompt: "What did showing up look like for you this week?"

---

## 6. Daily Habit Loop

### Cue → Routine → Reward

**Cue (smart notification timing):**
- Learn the user's consistent app-opening window over 2 weeks
- Send notification 20 minutes before their typical window
- Content adapts to mode:
  - INACTIVE: "{N} days since your last session. One small thing today?"
  - BUILDING: "Your usual time. What is your movement today?"
  - STEADY: "Ready to log today?"
  - RESTING: No notification — do not interrupt deliberate rest

**Routine (clear single action):**
- MovementStateCard is the first meaningful element after the header
- INACTIVE: CTA front and center ("Log 5 minutes")
- BUILDING/STEADY: Log path is the obvious next action
- Quick Log (Phase 2): one-tap default with pre-filled type, 20-minute duration — removes the friction barrier for users who moved but do not want the full form

**Reward (three layered signals):**
1. **Immediate**: Toast message specific to what was logged. "Logged. 32 min of yoga." Functional, not patronizing.
2. **Contextual**: TinyWins card with animation and haptic — emotionally satisfying without dopamine spam.
3. **Delayed**: AI insight on next HomeScreen open references the actual session and its relationship to the user's patterns.

The delayed reward is the deepest. It requires the app to genuinely know the user's patterns and reflect them back. This is what separates MoveKind from a simple movement logger.

---

## 7. Anti-Churn Systems

### Churn Prediction Signals (Private)

- Rhythm Score declining 2 consecutive weeks from above 60%
- Notification open rate falling below 20%
- Session duration declining trend over 3 weeks
- Weekly reflection skipped 3+ consecutive times
- Mode stuck in INACTIVE for 14+ days

### Proactive Interventions by Signal

**Declining rhythm from steady (before going inactive):**
"Your rhythm has been lighter the last two weeks. Is everything okay?" — not about movement, about them.

**Sessions shortening:**
"You have been keeping sessions shorter lately. Is your energy lower, or is something else getting in the way?" + option to lower default effort settings.

**Reflections stopped:**
"You have not checked in recently. No pressure — but how are you?"

**Stuck in INACTIVE 21+ days — the Start Fresh system:**
Offer a formal **Chapter Start** — a named new beginning with no judgment attached.
- Does not delete history
- Resets the current rhythm meter to zero
- Creates a "Chapter 2" entry in the user's movement timeline
- The shame of looking at weeks of empty space is replaced by the invitation of a new beginning

### The Movement Letter (Primary Anti-Churn Anchor)

Generated monthly by AI. 2–3 paragraphs. Delivered as a dedicated in-app screen (not a notification).

Requirements:
- References actual user data from the past 30 days
- Written in warm, direct second-person voice
- Notes patterns — both positive and challenging
- Ends with one specific observation about momentum or opportunity
- Stored permanently in the user's history

Example excerpt:
> "October was different from September. You moved 12 times — up from 8 — and your stress scores dropped in every week that had three or more sessions. The yoga sessions on Tuesday mornings have been consistent for six weeks. That is a real habit. Your energy scores on the days after rest are noticeably higher than on the days after high-effort sessions. Worth knowing."

This letter is irreplaceable by any competitor because it is only possible with longitudinal personal data. A user who has received six monthly letters has a six-month psychological record of their physical and emotional evolution. They will not leave an app that knows them this well.

---

## 8. Motivation Architecture (Without Shame Spirals)

### The Fundamental Shift

```
Traditional:  goal → success/failure → shame spiral
MoveKind:     intention → action → reflection → learning → identity
```

Goal-based thinking creates binary success and failure. Pattern-based thinking treats all outcomes as data.

### Weekly Intention Setting (in Reflect screen)

Final step of the weekly reflection:

- "What is one specific movement you intend this week?" (free text or picker)
- "When approximately?" (day + time of day)
- Saved as a private intention, not a public goal

If met: "You followed through on your intention. That is what habits are made from."  
If not met: "What got in the way?" (learning prompt, not shame)  
If partially met: "You intended X. You did Y. Close enough — the pattern held."

### Self-Efficacy Mechanics (Bandura, 1977)

The single strongest predictor of behavior change is **self-efficacy** — belief in your ability to execute. It comes from four sources. MoveKind targets all four.

| Source | Mechanism | MoveKind Implementation |
|---|---|---|
| Mastery experiences | Doing it and succeeding | Every logged session is a mastery experience. TinyWins confirms this. |
| Vicarious experiences | Seeing someone like you succeed | Cohort stories: "Someone who was in INACTIVE mode 6 weeks ago just hit Rhythm Keeper." |
| Social persuasion | Trusted others believe in you | AI coach expresses specific belief: "Based on your pattern, you can do this." |
| Physiological state | Feeling capable | When energy data shows fatigue, lower all expectations. When it shows strength, raise them. |

---

## 9. Intensity Mode (The Evolution Path)

### Positioning

Intensity Mode is **not a different app**. It is a depth pathway for users who have rebuilt their relationship with movement and want to go further.

**Unlock condition:** Rhythm Keeper tier (8+ active weeks) OR explicit user request.  
**Unlock moment:** Invitation, not announcement. "You have built a solid foundation. Want to explore a deeper level of tracking?"  
**Exit:** Seamless, framed positively. "Stepping back is smart. Your gentle rhythm is always here."

### Features

**Session Enhancement:**
- Sets / reps / weight logging (optional expand on Log screen, behind "Add details")
- Muscle group tagging
- RPE (Rate of Perceived Exertion) alongside existing effort slider
- Session notes (free text)

**Progressive Overload Tracking:**
- Personal bests per exercise (last logged weight/reps shown at log time)
- Suggested progressive load: "+2.5kg from last time?" (user accepts or overrides)
- Volume trend by muscle group over 4 weeks

**Exercise Library:**
- ~100 curated exercises (not a 1000-item database)
- Organized by muscle group and modality
- User-addable custom exercises

**Performance Dashboard:**
- Volume trend by muscle group (4-week)
- Strength progress curves for tracked exercises
- Intensity vs. recovery balance chart

**Emotional intelligence preserved:**
- High-soreness weeks automatically suggest reduced volume
- AI coach references strength data in coaching language
- Identity remains integrated — an Intensity Mode user is still a MoveKind user

---

## 10. "Why Users Return Daily" — Root Cause Analysis

Daily return is driven by one of three mechanisms. Users need at least one. Users with all three have near-bulletproof daily retention.

| Mechanism | What creates it | MoveKind implementation |
|---|---|---|
| Curiosity loop | "What will the app tell me today?" | AI insight + monthly movement letter |
| Completion urge | "My rhythm needs today's session" | Rhythm Score visualization |
| Relational pull | "My buddy can see I have not moved" | Movement buddy visibility |

The current app has none of these reliably. The AI insight is closest to a curiosity loop but lacks daily distinctiveness. The Rhythm Score addresses completion urge. The buddy system addresses relational pull. All three must be implemented.

---

## 11. "Why Users Stay 6 Months" — Root Cause Analysis

Six-month retention in wellness apps is explained by two factors:

**Identity shift.** By month 3, users who have reached Rhythm Keeper tier have begun to identify as movers. This identity is resistant to disruption — missing a week no longer feels like failure because their identity is "someone who always comes back."

**Sunk cost of personal data.** A user with 6 months of reflections, movement history, and monthly letters has a personal psychological record that exists nowhere else. Leaving means losing that record. This creates genuine switching cost through accumulation, not lock-in.

Features that create this directly:
1. Movement Letters — irreplaceable longitudinal record
2. Identity tier progression — permanently earned, visually present
3. Rhythm Wave visualization — beautiful personal history
4. Somatic Pattern Insights — "when you sleep 7+ hours, your motivation is 40% higher the next day"

---

## 12. Layered Behavioral Progression Model

```
LAYER 1 — SAFETY (Weeks 1–2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Goal: The app proves it will not shame them.
Mechanics: Anti-guilt copy, MovementStateCard, gentle onboarding
Accountability: None. Zero pressure.
Identity: "Getting Started"
Win condition: 3 logged activities without anxiety.

LAYER 2 — RITUAL (Weeks 2–6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Goal: Movement becomes a regular opening habit.
Mechanics: Smart notification timing, Rhythm Score, Quick Log
Accountability: Rhythm Insurance tokens, 2-day rule notification
Identity: "Regular Mover" (2 complete weeks)
Win condition: User opens app 3+ days/week regardless of logging.

LAYER 3 — IDENTITY (Weeks 6–12)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Goal: User begins to identify as a mover.
Mechanics: Weekly intentions, identity tier progression, personal bests
Accountability: Micro-challenges (opt-in), adaptive AI coaching by state
Identity: "Rhythm Keeper" (8 active weeks)
Win condition: User self-describes as "someone who moves regularly."

LAYER 4 — MASTERY (Months 3–6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Goal: User experiences real progression and belonging.
Mechanics: Monthly movement letters, seasonal arcs, movement buddy, cohorts
Accountability: Proactive pattern check-ins, challenge system, honest questions
Identity: "Resilient Mover" / "Movement Native" progression
Win condition: User makes movement choices in daily life without opening the app.

LAYER 5 — DEPTH (Months 6+)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Goal: User explores their edge and becomes a power user.
Mechanics: Intensity Mode, specialization path, community contribution
Accountability: Self-directed — user sets own challenges
Identity: Specialization tier (Strength Seeker, Recovery Guide, etc.)
Win condition: Genuine loss anticipated if the app disappeared.
```

---

## Implementation Phases

### Phase 2 — Immediate Retention Impact
- Rhythm Score (replaces streak display)
- Rhythm Wave visualization (Progress screen)
- Personal bests tracking (passive, silent)
- 2-day rule notification
- Weekly intention setting in Reflect screen
- Quick Log (pre-filled one-tap)

### Phase 3 — Identity + Belonging
- Identity tier progression system
- Identity transition moments (full-screen)
- Movement buddy system (1:1)
- Monthly movement letter (AI-generated)
- Anonymous aggregate belonging stats

### Phase 4 — Differentiation Moat
- Somatic pattern insights ("when you X, your Y is Z")
- Seasonal arcs
- Start Fresh / Chapter system
- Honest question system (14+ day inactive)

### Phase 5 — Depth + Expansion
- Intensity Mode (full gym tracking)
- Community cohorts
- Specialization identity paths

---

## Open Questions for Future Specs

1. **Notification architecture**: What permission model, what timing engine, what opt-out granularity?
2. **Somatic pattern insights**: What minimum data thresholds before surfacing a pattern? What correlation vs. causation framing?
3. **Movement buddy**: How is consent managed? What happens when one user churns?
4. **Seasonal arc content**: Who writes/generates the arc prompts and challenge library?
5. **Intensity Mode exercise library**: Curated set of ~100 exercises — who selects, what format?
