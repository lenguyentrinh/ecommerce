---
title: "Oren — Soft Minimal Luxury Visual Design System"
project: "ecommerce (Oren)"
status: "draft"
created: "2026-06-22"
updated: "2026-06-22"
form_factor: "mobile-first responsive (shopper), desktop-first (admin)"
brand: "Oren Premium Women's Fashion"
source_of_truth: "Stitch 'Oren Soft Minimal Boutique' design system (projects/2621556029010588670)"
name: Oren
colors:
  # Brand-canonical palette (Stitch override colors — the design intent).
  background: '#faf7f2'        # Soft Ivory — primary page canvas
  surface: '#fff8f4'           # Warm white surface
  surface-secondary: '#e8dccb' # Warm Beige — cards, structural containers
  surface-container: '#fdebdc'
  surface-variant: '#f1dfd1'
  on-surface: '#4a3f35'        # Deep Muted Brown — primary text (no pure black)
  on-surface-variant: '#787770'
  primary: '#4a3f35'           # Deep Muted Brown — primary CTA fill
  on-primary: '#faf7f2'        # Ivory text on primary
  accent-blush: '#e7c6c1'      # Muted Blush Pink — feminine accent / highlight
  accent-clay: '#c9b2a6'       # Soft Clay — hover / active feedback
  outline: '#c8c7be'           # Hairline dividers / borders
  # Warm, muted semantics — "luxury doesn't shout"
  success: '#a89a7f'
  alert: '#c4a896'
  error: '#b8998a'
  error-strong: '#ba1a1a'      # Reserved for critical/payment failures
  error-container: '#ffdad6'
typography:
  font-family: "'Nunito Sans', sans-serif"
  display-lg:
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: 0.04em
  display-lg-mobile:
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  headline-md:
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0.03em
  body-lg:
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-md:
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0.01em
  label-sm:
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.08em   # uppercase, tracked
rounded:
  sm: 0.25rem      # 4px
  DEFAULT: 0.5rem  # 8px
  md: 0.75rem      # 12px
  lg: 1rem         # 16px — cards, inputs, image containers
  xl: 1.5rem       # 24px — large surfaces
  full: 9999px     # pills — buttons, chips
spacing:
  unit: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 48px
  xl: 80px          # minimum vertical gap between major sections
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
---

# DESIGN.md — Oren Visual Identity

A **Soft Minimal Luxury** aesthetic for premium women's fashion. Feminine, calm, editorial, emotionally resonant — a high-end lookbook meets a serene boutique interior. Whitespace and silence are design tools. Nunito Sans exclusively. Warm-neutral palette with a single blush accent.

> **Source of truth:** This document is reconciled from the Stitch *"Oren Soft Minimal Boutique"* design system (`projects/2621556029010588670`). Where this file and any earlier mock/import disagree, **this file wins**. All pre-pivot tech styling (indigo `#4f46e5`, Inter/system fonts, hard shadows, 4px-default corners) has been removed — see `.decision-log.md` D4.

---

## Brand & Style

**Identity**: Oren — premium women's fashion. Soft luxury, editorial, emotional. A boutique showroom meets a fashion magazine.

**Philosophy**: Image-first, emotion-second, information-tertiary. The design combines **Minimalism** with subtle **Tactile/Skeuomorphic** undertones — film-grain texture, warm gradients, and organic roundedness give a sense of physical materiality, not digital coldness. Slowness is luxury; whitespace is generous and intentional; Nunito Sans is the only voice.

**Aesthetic anchors**:
- Warm-neutral palette (ivory + beige + blush + clay) — no tech colors
- Generous whitespace and breathing room (silence as luxury)
- Nunito Sans exclusively (warmth, brand consistency)
- Large product imagery dominates (60–70% of viewport)
- Soft ambient shadows + 2–3% global film-grain overlay (paper-like materiality)
- Slow, calm motion — 300ms `cubic-bezier(0.4, 0, 0.2, 1)`

**Positioning**:
- **NOT**: e-commerce dashboard, efficient transaction UI, tech-forward, playful/young/trendy
- **YES**: feminine, calm, sophisticated, aspirational — a luxury fashion experience, not a shopping interface

---

## Colors

The palette is a sophisticated range of **warm neutrals** for a soft, low-fatigue experience. No pure black, no pure white, no tech colors.

### Core palette

| Name | Hex | Use | Notes |
|------|-----|-----|-------|
| **Soft Ivory** | `#faf7f2` | Primary background (pages) | Expansive canvas; use subtle Beige→Ivory gradients on large sections for depth |
| **Warm White** | `#fff8f4` | Raised surface | Slightly brighter surface for layering |
| **Warm Beige** | `#e8dccb` | Cards, secondary nav, structural containers | The primary surface color for contained content |
| **Sand** | `#fdebdc` / `#f1dfd1` | Input fills, subtle container tints | Warm low-contrast fills |
| **Muted Blush** | `#e7c6c1` | Feminine accent, highlights, status, CTA variants | Used sparingly to keep it elegant, never juvenile |
| **Soft Clay** | `#c9b2a6` | Hover / active feedback, focus borders | Warm taupe for interaction states |
| **Deep Muted Brown** | `#4a3f35` | Primary text, headings, primary CTA fill | High legibility while staying "soft" — replaces pure black |
| **Warm Gray** | `#787770` | Secondary text, labels, metadata | Warm alternative to cold gray |
| **Hairline** | `#c8c7be` | Dividers, subtle borders | Low-contrast outline |

**Color philosophy**: monochromatic warm neutrals + a single blush accent. No blue/indigo, no strong accent colors, no pure black/white. Subtlety is sophistication.

### Semantic colors (minimal, warm)

| Semantic | Color | Use | Notes |
|----------|-------|-----|-------|
| **Success** | `#a89a7f` | Order confirmation, checkmarks | Warm success, not bright green |
| **Alert** | `#c4a896` | Out of stock, inventory warnings | Warm alert, not aggressive orange |
| **Error** | `#b8998a` | Inline validation, soft errors | Warm error, not harsh red |
| **Error (strong)** | `#ba1a1a` / container `#ffdad6` | Payment failure, critical-only | Reserved escalation; luxury doesn't shout |

### Accessibility

- **Contrast**: all text meets WCAG AA (4.5:1 body, 3:1 large text). Deep Muted Brown `#4a3f35` on Ivory/Beige passes comfortably; verify Warm Gray `#787770` for small text and darken to `#6a6a63` where it fails.
- **No color-only meaning**: status always paired with icon/text.
- **Dark mode**: deferred to v1.1 (light-only today).

---

## Typography

### Font system — Nunito Sans exclusive

```css
font-family: 'Nunito Sans', sans-serif;
```

- **Single family**: Nunito Sans across all roles (warmth, femininity, consistency).
- **Load locally** via `next/font/local` (per project convention — do **not** reintroduce a Google Fonts CDN dependency). Weights needed: 400, 600, 700.
- **Fallback**: `sans-serif` only.

### Type scale — editorial & luxury

| Style | Size | Weight | Line height | Tracking | Use |
|-------|------|--------|-------------|----------|-----|
| **Display LG** (H1) | 48px (32px mobile) | 700 | 1.1 / 1.2 | +0.04em / +0.02em | Campaign titles, hero |
| **Headline MD** (H2/H3) | 24px | 600 | 1.3 | +0.03em | Section + collection headers, product names |
| **Body LG** | 18px | 400 | 1.6 | +0.01em | Editorial copy ("Styling Notes"), descriptions |
| **Body MD** | 16px | 400 | 1.5 | +0.01em | Default UI text, product info |
| **Label SM** | 12px | 600 | 1.0 | +0.08em | Labels, metadata, chips — **uppercase, tracked** |

### Weight & tracking philosophy

- Headlines use **SemiBold/Bold (600–700)** with **generous letter-spacing (3–8%)** for an editorial, premium feel — the extra tracking keeps Nunito Sans's rounded letterforms from reading too casual.
- Body uses **Regular (400)** with **airy line-heights (1.5–1.6)** so layouts feel luxurious.
- Labels/metadata are **uppercase with increased tracking** for an architectural, sophisticated tone.

> **Pivot note:** This supersedes the earlier light-weight (300/400) direction. The Stitch canonical system uses tracked 600/700 headlines — see `.decision-log.md` D4.

---

## Layout & Spacing

**Philosophy**: Asymmetrical & breathable, inspired by editorial lookbooks and Pinterest. "Luxury spacing" — wider margins than strictly necessary signal premium positioning.

### Spacing scale (base unit 4px)

| Token | Value | Use |
|-------|-------|-----|
| xs | 8px | Tight gaps, icon padding |
| sm | 16px | Component gaps, form internal spacing |
| md | 24px | Card padding, gutter, minor section spacing |
| lg | 48px | Major component spacing |
| xl | 80px | **Minimum** vertical gap between major sections |

### Grid

- **Desktop**: 12-column grid, **64px** outer margins, max-width container centered. Product cards may **stagger at different heights** for a dynamic, curated rhythm.
- **Tablet**: transitional 3-column.
- **Mobile**: 2-column **staggered masonry** for product listings, **20px** side padding minimum (content never feels "trapped").

### Breathing room

- Section gaps ≥ 80px (xl); whitespace is intentional, not filler.
- Product cards: 24px padding. Sticky header: 12px vertical padding.

---

## Elevation & Depth

**Philosophy**: depth through **tonal layers** and **ambient shadows**, never stark contrast.

### Shadows

| Level | Shadow | Use |
|-------|--------|-----|
| Ambient | `0 8px 40px rgba(74, 63, 53, 0.04)` | Cards, floating surfaces — feels like floating above a soft surface |
| Subtle | `0 1px 2px rgba(74, 63, 53, 0.04)` | Hover lift on interactive elements |
| None | — | Default inputs, labels, most surfaces (rely on tonal layering) |

Shadows are **extremely soft, low-opacity, high-blur (20–40px)** — never a hard silhouette.

### Texture & gradients

- **Film grain**: a global, low-opacity (2–3%) noise overlay across the UI for a paper-like, tactile quality (breaks the flat digital feel).
- **Gradients**: soft radial/linear Warm Beige → Soft Ivory on large background containers to simulate natural light on a physical surface.

### Layering (z-index)

Base 0 → content 1 → sticky header 10 → modals/overlays 100.

---

## Shapes

Organic and friendly — roundedness removes "sharpness" and aligns with the calm, feminine identity.

| Token | Radius | Use |
|-------|--------|-----|
| sm | 4px | Small inline elements |
| md | 12px | Secondary containers |
| **lg** | **16px** | **Cards, inputs, image containers** (default) |
| xl | 24px | Large surfaces |
| **full** | pill | **Buttons, chips, size selectors** |

> **Pivot note:** Supersedes the earlier "4px-default minimal corners." Canonical Oren uses 16px cards/inputs and pill buttons.

---

## Components

### Buttons

**Primary (Add to Cart, Proceed to Checkout)** — **pill-shaped**
- Background: Deep Muted Brown `#4a3f35`; text: Soft Ivory `#faf7f2`; weight 600
- Padding: 1rem vertical, 2rem horizontal (generous)
- Hover: gentle scale-up (1.02×) + slight warmth shift; transition 300ms `cubic-bezier(0.4, 0, 0.2, 1)`

**Secondary (View Details, Continue Shopping)** — **pill-shaped**
- Transparent or soft-tinted fill; border 1px Sand/Blush; text Deep Muted Brown
- Hover: soft blush-tinted fill, Soft Clay `#c9b2a6` border

### Product Card — minimal & elegant

**Layout**: image dominant → name + price below. **No visible border** — relies on the soft ambient shadow and background contrast.

```
┌─────────────────────┐
│                     │
│  Image (4:5)        │ ← dominant; 16px radius; bg Warm Beige
│  [ ADD TO CART ]    │ ← fades in on hover (desktop); subtle on mobile
├─────────────────────┤
│ Product Name        │ ← Headline-style, 16px, weight 600
│ $165.00             │ ← Warm Gray, 16px, weight 400
└─────────────────────┘
```

- **Container**: background Warm White `#fff8f4`, radius 16px, ambient shadow `0 8px 40px rgba(74,63,53,0.04)`, no border
- **Image**: 100% width, aspect-ratio 4:5 (fashion portrait), 16px radius, placeholder bg Warm Beige `#e8dccb`
- **Info**: 16px padding, 8px gap; **Name** weight 600 `#4a3f35`; **Price** weight 400 `#787770`
- **CTA**: hidden by default → fades in on hover (desktop, 300ms), blush `#e7c6c1` fill / Deep Muted Brown text; subtle persistent button on mobile
- **Hover (desktop)**: image zoom 1.02×, CTA fade-in, card background warms toward ivory

### Product Detail Page (PDP) — editorial layout

**Layout**: large image gallery (left ~60%) → minimal info panel (right ~40%).

- **Right panel**: background Warm White `#fff8f4`, generous 32px padding
- **Name**: Headline MD (24px / 600, +0.03em)
- **Price**: Body MD (16px / 400, Warm Gray)
- **Styling Notes** (editorial copy): Body LG (18px / 400, line-height 1.6, Deep Muted Brown) — magazine paragraphs, not bullet lists
- **Size selector**: pill chips, no harsh borders; selected state = blush fill / Soft Clay border
- **Add to Cart**: primary pill button, full-width

### Input fields

- Rounded rectangle, **16px** radius, **Warm Beige** `#e8dccb` (or Sand `#fdebdc`) fill, border none
- Focus: **Soft Clay** `#c9b2a6` border (no aggressive shadow/glow)
- Placeholder: Warm Gray `#787770`, weight 400
- Font: Nunito Sans, 16px

### Search bar

- Container: Warm White `#fff8f4`, 16px radius, hairline `#c8c7be` border
- Focus: **Soft Clay** border (no indigo, no harsh focus ring)
- Sticky on scroll, z-index 10

### Chips / labels

- **Pill-shaped**, generous horizontal padding
- Text: **uppercase, tracked** (Label SM — 12px / 600 / +0.08em)
- Used for sizes, categories, filters

### Interactive transitions

All hover/state changes use the calm easing `cubic-bezier(0.4, 0, 0.2, 1)` over **300ms**. No fast/snappy motion — movement is slow and deliberate.

---

## Do's and Don'ts

### Do's ✅
- **Nunito Sans exclusively** — all UI, all sizes (load locally, not via CDN)
- **Tracked 600/700 headlines** + airy 400 body (editorial luxury)
- **Generous whitespace** — ≥80px between major sections; silence = luxury
- **Image-first** — product photos dominate (60–70%)
- **Warm-neutral palette only** — ivory/beige/blush/clay
- **16px card/input corners, pill buttons** — organic and soft
- **Soft ambient shadows + 2–3% grain** — tactile, floating, paper-like
- **Slow 300ms calm easing** on every transition
- **Editorial copy** ("Styling Notes" as magazine paragraphs)
- **Touch-friendly** — 44px+ tap targets, generous padding

### Don'ts ❌
- **Any font except Nunito Sans**; no system fallbacks beyond `sans-serif`
- **Tech colors** — no blue, no indigo `#4f46e5`, no harsh accents
- **Pure black or pure white** — use the warm palette
- **Hard shadows / sharp edges / dense layouts** — this is silence, not clutter
- **Aggressive CTAs or urgency/sales language** — desire, not pressure
- **Dense product information** — emotion over specs
- **Fast, snappy interactions** — movement is slow and deliberate
- **Dashboard / corporate feel** — this is a boutique, not an interface

---

## Dark Mode & Responsive

- **Dark mode**: deferred to v1.1 (light-only).
- **Responsive**: Mobile 2-col masonry (20px padding) → Tablet 3-col → Desktop 12-col grid (64px margins, centered max-width).
- **Breakpoints**: Mobile 0–767px · Tablet 768–1023px · Desktop 1024px+.

---

## References

- **Source of truth**: Stitch *"Oren Soft Minimal Boutique"* (`projects/2621556029010588670`) — design system + 3 screens.
- Inspiration: editorial lookbooks, Pinterest (discovery), COS / The Row (calm retail minimalism).
- Project asset convention: self-hosted Nunito Sans via `next/font/local`; local SVG placeholders — no remote Unsplash/Google Fonts.

---

## Document Status

**Status**: Draft (reconciled to Stitch source of truth) · **Last updated**: 2026-06-22
**Next**: align EXPERIENCE.md token references, resolve off-brand microcopy/journeys, then Finalize + key-screen mockups.
