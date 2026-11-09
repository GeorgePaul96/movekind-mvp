# Critique: "Dog in the Garden" reference (dog_in_the_garden_cozy_self_care_companion.html)

Reviewed 2026-11-06 by opening it in a browser at desktop size and at phone size (375 x 812), and by
reading the code. A copy sits at `prototypes/dog-yard/reference.html`. Our own throwaway prototype is
`prototypes/dog-yard/index.html`.

**Verdict:** it has good ideas and some charming art, but it is built for a laptop and for a web page, and it
breaks several MoveKind rules (targets, guilt and judging food). Treat it as a mood board and a source of
animation ideas. Do not port it.

---

## Blocking problems

1. **On a phone, most of the app is cut off.** The scene is a landscape 1200 x 760 drawing set to
   `slice`. In portrait, the water bowl, both food bowls, the bulldog and half of the golden retriever fall
   off the sides of the screen. What's left is a fence, a lamp post, a ball and the edge of a deck. On the
   device it is meant for, you can't log three of the four things.
2. **None of it carries over to React Native.** It uses the Tailwind CDN, DOM and CSS keyframes, Web Audio,
   `localStorage`, hover tooltips and `onmouseenter`. Every line would need rewriting. Only the drawings and
   the motion ideas can be reused.
3. **It brings back targets and guilt.**
   - Water shows "Daily Hydration Goal 0 / 8 glasses", a progress bar and millilitres. That is a target with
     a shortfall built in.
   - "Garden Flourish 1 / 8" is a completion score.
   - "Meals logged today: 0" counts what is missing.
   - "Reset Today's Log" is in red in the journal.

   MoveKind's rule is that the garden only grows or rests.
4. **It judges food.** "How nourishing did it feel? Light / Balanced / Hearty / Treat" sorts meals into good
   and naughty, and the note field invites people to write down what they ate. For anyone with a difficult
   relationship with food this is the most harmful screen in the file. The question should only be whether
   you ate, and which meals.
5. **It logs medication inside a joke.** "Took Vitamins / Meds" sits in a "Miracle Wake-Up!" card next to
   "Sweet Treat". Health data shouldn't be a punchline, and we don't collect it.

## Interaction problems

6. **Every form is pre-filled.** Walk + 30 min, Breakfast + Balanced and 7.5 h + Solid are already selected.
   One careless tap on Save logs things that didn't happen. Start empty and keep Save disabled until
   something is picked.
7. **Skipping the mood question records a mood anyway.** The default state is `mood: 'calm'`, and "Step
   straight into the garden" leaves it there. Yesterday's mood is also carried into today
   (`mood: parsed.mood`). Skipping should mean no mood, and the dog stays neutral.
8. **Toy controls are mixed into the questions.** The sleep form has a "Roll Belly Up / Down" button and
   tells you to pop the Zzz bubbles. The activity form has "Toss Ball Again". A form should ask one question.
   The bulldog rolling over should simply happen on its own.
9. **There are two ways to log food.** Barnaby has his own bowl, which opens a different treat form. That
   makes three bowls on screen and two food logs that disagree. Use one food bowl. Barnaby waking for it *is*
   the joke.
10. **"Pet Sunny 3x to soothe" turns stress into a task,** with a progress ring that measures your
    frustration going down. Petting can comfort without a counter: the cloud just softens.
11. **The mood tiles describe the dog, not you.** "Gentle tail sway, warm smile, watching butterflies" is
    about Sunny. The person should be choosing a feeling, and the dog follows.
12. **The close buttons are 32 px circles,** and the many 10 to 11 px labels (29 of them) are below our
    44 pt touch-target and 13 pt minimum font rules. The page also sets `user-scalable=no`, so you can't
    zoom.

## Visual problems

13. **Too much on-screen chrome.** At once there is a mood pill, a status banner, five emoji counters, a
    weather toggle, a sound toggle, a hover tooltip and a bottom toast. That is eight floating layers
    competing with the garden. Home should be the scene plus one quiet strip.
14. **Too much movement.** Drifting clouds, two butterflies, sunbeams, a hopping bird, rustling bushes,
    swaying plants, fireflies, rain streaks, a lightning flash and a tail wag every 0.22 s. Lightning on the
    "frustrated" mood is the opposite of calming, and it flashes, which is an accessibility risk. There is
    no `prefers-reduced-motion` handling anywhere.
15. **No colour system.** Each form has its own accent (sky, orange, rose, indigo, teal, emerald) over a
    brown and cream base. White text on `orange-500` and `sky-500` is about 2.8:1, which fails contrast.
    None of it matches our Sage tokens.
16. **Two typefaces,** Fredoka for headings and Plus Jakarta Sans for the rest. We use Jakarta only.
17. **Emoji are used as icons** (💧🥣🎾💤🌸☕💊). They render differently on every phone and break our
    "Icon, not emoji" rule. The page title also has an em dash.
18. **The hero dog is small and off to one side.** Sunny is about a tenth of the screen width, left of
    centre, and in the tired pose melts into a loaf that is hard to read. You asked for the dog to sit in
    the middle. The bulldog is tucked on a deck in the far corner, half off-screen on a phone.
19. **Weather is a manual toggle.** "Morning / Sunset / Night / Cozy Rain" is chosen by hand. In MoveKind
    the light follows the clock, and rain means the person said they feel unwell, so it can't be a
    decoration.
20. **Sound is on by default.** Ambient audio that plays without being asked doesn't belong in a calm app.
    It should be off by default, if it exists at all.
21. **No accessibility labels.** No `role` or `aria-` attributes at all. Tappable objects can't be found by
    a screen reader.

---

## What to keep

| Keep | Why |
|---|---|
| **Side-view dog with four legs, a trot cycle and a flip to face the way he walks** | It reads as walking far better than our front-facing dog sliding sideways. |
| **Head-dip motion for drinking and eating** (`headDrink` / `headEat`, about 0.65 s) plus a ripple in the bowl and a few crumbs | Simple, and you can tell what he's doing at a glance. |
| **Bulldog sploot, belly up with a dream twitch, and an awake pose; pink toe beans; a collar with a tag** | This is the charm of the file. Pudding should be this lovable. |
| **Rising Zzz bubbles** | A clear "asleep" signal. Keep them, but don't make them poppable. |
| **Breathing scale on idle characters** | A cheap way to make them feel alive. |
| **A flower blooms for each thing logged** | Fits "the garden only grows". Keep it, without the "/ 8". |
| **Fence, stepping-stone path, plaid cushion, terracotta pot** | Good set dressing for a back yard. Keep a few, not all. |
| **Petting the dog gives a heart** | A small reward for no reason. Keep it, without the counter. |
| **Tongue and panting for buzzing, eyelids and slower breathing for tired** | Clear mood signals. |

## What we're adding that it lacks

- A **portrait-first** layout that fits every phone, with all four objects reachable above the bottom sheet.
- **One** food bowl, which wakes Pudding.
- Empty forms, with Save disabled until something is picked.
- Our moods, copy rules, Sage colours, Jakarta, `Icon` and 44 pt targets.
- Light from the clock, and rain only for unwell.
- Reduced motion respected everywhere.
