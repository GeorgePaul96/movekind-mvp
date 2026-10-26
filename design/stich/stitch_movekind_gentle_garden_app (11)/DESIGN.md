---
name: MoveKind
colors:
  surface: '#f6faf5'
  surface-dim: '#d7dbd6'
  surface-bright: '#f6faf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f5f0'
  surface-container: '#ebefea'
  surface-container-high: '#e5e9e4'
  surface-container-highest: '#dfe4df'
  on-surface: '#181d1a'
  on-surface-variant: '#404943'
  inverse-surface: '#2d322e'
  inverse-on-surface: '#edf2ed'
  outline: '#707972'
  outline-variant: '#bfc9c1'
  surface-tint: '#236a4c'
  primary: '#20684a'
  on-primary: '#ffffff'
  primary-container: '#3c8161'
  on-primary-container: '#f5fff6'
  inverse-primary: '#8fd5b0'
  secondary: '#57615c'
  on-secondary: '#ffffff'
  secondary-container: '#d8e2dc'
  on-secondary-container: '#5b6560'
  tertiary: '#665a51'
  on-tertiary: '#ffffff'
  tertiary-container: '#7f7268'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aaf2cb'
  primary-fixed-dim: '#8fd5b0'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#dbe5df'
  secondary-fixed-dim: '#bfc9c3'
  on-secondary-fixed: '#151d1a'
  on-secondary-fixed-variant: '#3f4945'
  tertiary-fixed: '#f0dfd3'
  tertiary-fixed-dim: '#d4c4b8'
  on-tertiary-fixed: '#221a13'
  on-tertiary-fixed-variant: '#50453c'
  background: '#f6faf5'
  on-background: '#181d1a'
  surface-variant: '#dfe4df'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies mindful motion, physical rehabilitation, and supportive wellness. The interface creates an atmosphere of clinical warmth, reassurance, and steady encouragement. It balances the clarity of therapeutic tools with the approachable comfort of daily health rituals.

The aesthetic blends soft tactile minimalism with organic pastel surfacing. Interfaces rely on expansive breathing room, rounded geometry, and low-friction layouts to alleviate cognitive fatigue and bodily tension. Motion is deliberate and gentle, mirroring calm, measured physical movement.

## Colors

The palette is anchored by `#599E7C` (MoveKind Sage), a grounding, restorative green with balanced chroma to instill quiet focus and recovery. 

- **Primary (`#599E7C`)**: Applied to high-priority calls to action, active navigation states, completion progress, and key anatomical or session indicators.
- **Secondary (`#D8E2DC`)**: A cool, misty sage wash used for subtle badges, secondary button fills, and softly tinted structural backdrops.
- **Tertiary (`#F4E3D7`)**: A warm, blush-apricot pastel used sparingly for rest intervals, gentle nudges, streaks, and warm-toned card treatments.
- **Neutral Surface & Base**: Surfaces transition from pure daylight `#FAFCFA` to container tones of soft moss-tinted cream `#F0F4F1`. Neutral text sits on warm charcoal `#242B27` for high legibility, with muted copy balanced at `#737874`.

## Typography

Typography relies uniformly on **Plus Jakarta Sans** to maintain an open, rounded, and welcoming demeanor across informational and instructional contexts. 

Letter tracking remains open on smaller utility tags to ensure effortless scanning under physical strain or movement. Numerical displays, timers, and count gauges prioritize medium-to-bold weights with tabular numbers to prevent visual shifting during active routine tracking.

## Layout & Spacing

The layout is built upon an adaptive 8pt modular grid. Desktop views conform to a centered 12-column system capped at 1200px to maintain focused eye paths. Mobile layouts shift to a single fluid column with generous edge padding (`margin-mobile: 1rem`) and vertical grouping gaps (`space-lg`) to prevent unintentional touch targets.

Component padding scales proportionally: cards reserve `space-md` on mobile and `space-lg` on larger viewports. Interactive targets maintain a minimum dimension of 48×48px to support accessibility for users with limited dexterity.

## Elevation & Depth

Visual hierarchy relies on soft pastel surface nesting rather than harsh dropshadows. 

Depth is expressed through layered tiers:
- **Base Canvas**: Soft off-white `#FAFCFA`.
- **Card Surfaces**: Delicate tinted pastel fills (pale sage `#F2F7F4`, warm linen `#FAF5F0`, or soft cloud `#EDF3F0`) layered directly on the base.
- **Layer Borders**: Rather than dark borders, cards and surfaces utilize 1px semi-opaque perimeter rings (`rgba(89, 158, 124, 0.12)`) to provide separation.
- **Ambient Elevation**: When floating overlays, sheets, or sticky movement timers rise above the canvas, apply a diffused shadow tinted with MoveKind Sage: `0 12px 32px -8px rgba(36, 68, 52, 0.08)`.

## Shapes

The interface embraces a gentle, rounded aesthetic. Buttons, interactive tiles, and input fields utilize `rounded` (0.5rem) to `rounded-lg` (1rem). Movement cards, routine overviews, and modal dialogs extend to `rounded-xl` (1.5rem) to evoke an organic, pebble-like softness. Fully circular pills are reserved strictly for status chips, step trackers, and progress markers.

## Components

- **Buttons**:
  - *Primary*: Filled with MoveKind Sage (`#599E7C`), white text, `rounded-lg`, with a soft active transition that deepens slightly to `#4C8B6C`.
  - *Secondary*: Filled with a muted sage tint (`#E8EFEA`), `#3A6952` text, no border.
  - *Tertiary*: Ghost style, sage text, soft wash hover.
- **Cards**:
  - Composed with pale pastel fills (sage-mist, warm-apricot, or soft porcelain) paired with an organic `rounded-xl` contour and low-contrast borders (`rgba(89, 158, 124, 0.12)`). Padding strictly conforms to `space-lg`.
- **Chips & Tags**:
  - Compact pill forms (`rounded-full`) utilizing subtle secondary and tertiary pastels with dark contextual text to highlight exercise durations, target joints, or physical intensity levels.
- **Form Inputs**:
  - Generous 48px height with a pale background (`#F5F8F6`), `rounded-lg`, and an understated border. On focus, illuminate with a 2px smooth ring in `#599E7C`.
- **Checkboxes & Radios**:
  - Smooth rounded checkboxes (6px inner radius) and circular radios. Selected states fill with `#599E7C` containing crisp white glyphs.
- **Movement Timers & Rep Trackers**:
  - Circular meters utilizing a soothing sage progress line against a faint secondary track, centered with prominent, tabular counter typography.