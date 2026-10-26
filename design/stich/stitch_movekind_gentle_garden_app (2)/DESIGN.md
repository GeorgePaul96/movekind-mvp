---
name: MoveKind
colors:
  surface: '#fbf8ff'
  surface-dim: '#d8d9e9'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2ff'
  surface-container: '#ecedfd'
  surface-container-high: '#e6e7f8'
  surface-container-highest: '#e1e1f2'
  on-surface: '#191b27'
  on-surface-variant: '#454652'
  inverse-surface: '#2e303c'
  inverse-on-surface: '#efefff'
  outline: '#767683'
  outline-variant: '#c6c5d4'
  surface-tint: '#4c54b6'
  primary: '#4c54b6'
  on-primary: '#ffffff'
  primary-container: '#8e97fd'
  on-primary-container: '#21298c'
  inverse-primary: '#bec2ff'
  secondary: '#226a4b'
  on-secondary: '#ffffff'
  secondary-container: '#a7efc8'
  on-secondary-container: '#276f4f'
  tertiary: '#ab3426'
  on-tertiary: '#ffffff'
  tertiary-container: '#ff7662'
  on-tertiary-container: '#720903'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bec2ff'
  on-primary-fixed: '#00046a'
  on-primary-fixed-variant: '#333b9c'
  secondary-fixed: '#aaf2ca'
  secondary-fixed-dim: '#8ed5af'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005235'
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#ffb4a8'
  on-tertiary-fixed: '#410000'
  on-tertiary-fixed-variant: '#891c11'
  background: '#fbf8ff'
  on-background: '#191b27'
  surface-variant: '#e1e1f2'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.2px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies mindful companionship, gentle kinetics, and restorative digital sanctuary. The core philosophy centers on non-judgmental presence: personal wellness is not an optimization metric, a competition, or a streak to maintain. It is a garden that either grows or rests.

The visual style blends modern meditation digital art with warm, illustrative softness. It pairs tactile rounded surfaces with calm, airy layouts, pastel nature scenes, and welcoming typography. The emotional tone avoids urgent calls to action, punitive alerts, and high-contrast stress triggers, choosing instead soft guidance, supportive nudges, and serene spatial breathing room. Plain punctuation is maintained throughout all copy, with no em dashes.

## Colors

The color palette is divided into Day (active/mindful presence) and Night (rest/sleep recovery) modes, enriched with nature-inspired environmental accents and mood-tracking tones.

### Day Palette
- Background: #FFFFFF (pure, breathable light canvas)
- Surface / Cards: #F5F5F9 (soft cloud grey surface layer)
- Primary Accent: #8E97FD (calm lavender, paired exclusively with crisp white text)
- Text Primary: #3F414E (deep warm navy slate for readable, soft contrast)
- Text Secondary: #A1A4B2 (gentle muted lavender-grey for secondary metadata and captions)
- Border / Dividers: #ECECF2 (hairline separation without structural rigidity)

### Night Palette (Sleep and Rest Modes)
- Background Night: #03174C (deep twilight navy canvas)
- Surface Night: #1B2B5E (lighter midnight navy for layered cards)
- Text Night: #EBEAEC (pale luminous lavender-white)
- Text Secondary Night: #9EA6C7 (soft atmospheric periwinkle)
- Star & Moon Accents: #FFE58F (warm, low-glare celestial gold)

### State & Mood Card Tokens
State indicators avoid punitive red, yellow, and green status archetypes. Every state is treated as valid, safe, and natural:
- Running on empty: #8E97FD (gentle periwinkle lavender)
- A bit low: #6CB28E (calm restorative mint)
- Steady: #FFDB9D (warm gentle peach-yellow)
- Buzzing: #FA6E5A (soft energetic coral)

### Garden Tokens
- Rolling Hills: #A8E6CF, #88D49E, and #56AB91 layered sequentially for depth
- Water / Stream: #A0C4FF with crisp white highlights (#FFFFFF)
- Blooms & Fruit: Accent dots utilizing the mood token palette

## Typography

Typography balances playful approachability with clean readability. Headings use Plus Jakarta Sans to deliver soft, friendly geometric shapes with rounded terminals and balanced geometry. Body copy relies on DM Sans for neutral, low-contrast, open letterforms that remain effortless to scan during movement or relaxed recovery.

Headlines should maintain adequate line height to preserve the calm, spacious feel. Large titles are kept under 32px to ensure full titles remain balanced on mobile viewports (390px baseline) without awkward word wraps. Copy styling uses standard sentence casing. Plain punctuation is enforced across all notifications, titles, and prompts, without em dashes.

## Layout & Spacing

The system is optimized for a 390x844 mobile viewport using a fluid 4-column layout model with 16px gutters and 20px screen margins.

Vertical rhythm adheres strictly to an 8px modular baseline (with 4px micro-increments for fine component alignment). Large interactive visual containers (such as the interactive garden canvas) maintain 20px outer margin inset, providing a card-like floating effect that separates sensory illustrations from system bezels and navigation bars.

Components inside cards utilize 16px to 20px internal padding to ensure touch targets never feel crowded. Vertical flow prioritizes generous negative space between stacked categories (24px to 32px) to prevent cognitive overload.

## Elevation & Depth

Elevation is achieved through tonal layering and soft, ambient diffused shadows rather than harsh drop shadows or structural borders.

- Base Level (Level 0): Day canvas (#FFFFFF) or Night canvas (#03174C).
- Surface Level (Level 1): Cards and functional containers use #F5F5F9 (Day) or #1B2B5E (Night). In Day mode, containers feature a subtle diffused ambient shadow (0px 8px 24px rgba(63, 65, 78, 0.04)) and an optional 1px hairline border of #ECECF2.
- Floating Interactive Elements (Level 2): Full-width action pills, active mood triggers, and sheets float with a soft tinted lift (0px 12px 32px rgba(142, 151, 253, 0.22) for primary actions; 0px 8px 20px rgba(63, 65, 78, 0.06) for neutral surfaces).
- Overlays & Modals (Level 3): Background dimming uses an airy navy tone (#03174C with 40% opacity) accompanied by an 8px backdrop blur to maintain visual calm.

## Shapes

The shape system expresses calm friendliness through organic, welcoming curves. Geometric sharpness is intentionally avoided throughout the entire interface.

All primary inputs, buttons, and status chips use full pill shapes (border-radius: 9999px). Secondary content containers, media cards, and the interactive movement garden frame use large radii ranging from 20px to 28px (rounded-3xl). Nested internal elements maintain concentric harmony with parent borders, ensuring interior items maintain a softer curve than outer frames.

## Components

### Buttons
- Primary Actions: Full-width pill buttons (height: 56px, minimum touch area: 44px, border-radius: 9999px). Surface color is #8E97FD with #FFFFFF label text in Plus Jakarta Sans Bold (16px). Shadows use the primary lift token.
- Secondary Actions: Height: 56px, border-radius: 9999px, background: transparent, border: 1.5px solid #ECECF2, text: #3F414E.
- Resting / Night Actions: In night modes, primary buttons use #FFE58F background with #03174C deep navy text for soft, low-glimmer nocturnal readability.

### Chips & Filter Pills
- Geometry: Height: 36px to 40px, rounded-full geometry (border-radius: 9999px), horizontal padding: 16px.
- Inactive: Background: #F5F5F9, text: #A1A4B2.
- Active: Background: #8E97FD, text: #FFFFFF. In mood selectors, the chip adopts the specific pastel tone of the mood with deep #3F414E text.

### Mood Selector Cards
- Structure: Soft 20px rounded containers.
- Color Inset: Background fills match the mood tokens (Running on empty: #8E97FD; A bit low: #6CB28E; Steady: #FFDB9D; Buzzing: #FA6E5A) with an opacity of 20% in dormant state and 100% when active.
- Tone: Accompanied by simple warm microcopy and flat pastel iconography. No clinical or judging terminology.

### The Garden Container
- Structure: A persistent, rounded-3xl container framing the visual meadow.
- States: The garden represents bodily recovery and movement. Elements only bloom, sway, or rest under moonlight. There are no withered states, dead foliage, or warning notifications.

### Input Fields
- Style: Height: 56px, rounded-2xl (20px), background: #F5F5F9, border: 1.5px solid transparent.
- Focus: Border shifts softly to #8E97FD without harsh rings.
- Text: Input text is #3F414E, with #A1A4B2 placeholder text.

### Checkboxes & Gentle Toggles
- Checkboxes: Circular 24px rings with 2px stroke in #ECECF2. When completed, they animate with a gentle scale into a solid #6CB28E fill carrying a white checkmark.
- Toggles: 32px height by 52px width pill track. Background #ECECF2 moves to #8E97FD smoothly with a white 28px circular thumb.