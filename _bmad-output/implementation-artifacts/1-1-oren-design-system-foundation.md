# Story 1.1: Oren Design System Foundation

Status: ready-for-dev

## Story

As a shopper,
I want the Oren platform to have a consistent, premium visual identity,
so that every page feels like a cohesive luxury fashion brand experience.

## Acceptance Criteria

**AC1 — Color tokens applied**
Given the frontend app has TailwindCSS 4 configured,
When the Oren design tokens are applied in `globals.css`,
Then the `@theme` block defines all color tokens: Soft Ivory `#faf7f2`, Warm White `#fff8f4`, Warm Beige `#e8dccb`, Sand `#fdebdc`/`#f1dfd1`, Muted Blush `#e7c6c1`, Soft Clay `#c9b2a6`, Deep Muted Brown `#4a3f35`, Warm Gray `#787770`, Hairline `#c8c7be`; semantic colors: success `#a89a7f`, alert `#c4a896`, error `#b8998a`, error-strong `#ba1a1a`; border-radius tokens: sm=4px, md=12px, lg=16px, xl=24px, full=9999px; spacing tokens: xs=8px, sm=16px, md=24px, lg=48px, xl=80px.

**AC2 — Global canvas styling**
Given the design tokens are configured,
When `globals.css` body styles are updated,
Then the page background is Soft Ivory `#faf7f2`; a 2–3% opacity film-grain CSS noise overlay is applied globally via `body::before` (fixed position, full-viewport, pointer-events none, z-index 9999); large background sections use a soft Warm Beige → Soft Ivory gradient utility; no pure black or pure white appears in the base styles; the dark-mode `@media` override is removed (Oren is light-only).

**AC3 — Type-scale utilities**
Given the typography tokens are applied,
When Nunito Sans utility classes are used (font already loaded via `next/font/local` at CSS var `--font-nunito`),
Then CSS utility classes exist for: `.text-display-lg` (48px/700/+0.04em; 32px mobile), `.text-headline-md` (24px/600/+0.03em), `.text-body-lg` (18px/400/lh-1.6), `.text-body-md` (16px/400/lh-1.5), `.text-label-sm` (12px/600/uppercase/+0.08em).

**AC4 — Base UI components**
Given shared UI primitives are needed across all features,
When base components are created in `components/`,
Then `<Button>` supports `variant="primary"` (pill, Deep Muted Brown fill `#4a3f35`, Ivory text, scale 1.02× hover, 300ms easing) and `variant="secondary"` (pill, transparent fill, Sand/Blush border, Deep Muted Brown text, soft blush fill hover + Soft Clay border); `<InputField>` renders with 16px radius, Warm Beige fill, no border by default, Soft Clay border on focus, Warm Gray placeholder, no aggressive focus ring; `<Chip>` renders pill-shaped uppercase tracked Label SM text; selected state uses Muted Blush fill / Soft Clay border; all state transitions use `cubic-bezier(0.4, 0, 0.2, 1)` 300ms.

**AC5 — Ambient shadow utilities**
Given card surfaces render anywhere in the app,
When the ambient shadow utility class is applied,
Then `.shadow-ambient` applies `box-shadow: 0 8px 40px rgba(74,63,53,0.04)`; `.shadow-hover` applies `0 1px 2px rgba(74,63,53,0.04)`; no hard or dark shadows exist.

**AC6 — Responsive grid**
Given the responsive layout system is needed,
When a product grid renders at any breakpoint,
Then desktop (≥1024px): 12-column grid with 64px outer margins, 24px gap; tablet (768–1023px): 3-column; mobile (<768px): 2-column, 20px side padding, 16px gap; major sections have ≥80px vertical gap between them.

## Tasks / Subtasks

- [ ] **Task 1: Expand `globals.css` with Oren color and token system** (AC1, AC5)
  - [ ] Replace generic `:root` variables with full Oren palette as CSS custom properties
  - [ ] Expand `@theme inline` block with `--color-*` tokens for all palette entries
  - [ ] Add semantic color tokens (success, alert, error, error-strong)
  - [ ] Add `--radius-sm/md/lg/xl/full` tokens
  - [ ] Add `--spacing-xs/sm/md/lg/xl` tokens
  - [ ] Add `--shadow-ambient` and `--shadow-hover` CSS variables
  - [ ] Remove `@media (prefers-color-scheme: dark)` block entirely

- [ ] **Task 2: Update body canvas styles in `globals.css`** (AC2)
  - [ ] Set `body` background to `#faf7f2` (Soft Ivory), color to `#4a3f35` (Deep Muted Brown)
  - [ ] Add `body::before` film-grain overlay: fixed, inset-0, pointer-events-none, z-index 9999, opacity 2.5%, SVG turbulence noise background-image
  - [ ] Add `.bg-gradient-warm` utility class (Warm Beige → Soft Ivory radial gradient)
  - [ ] Update `html, body` transition default to `transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`

- [ ] **Task 3: Add type-scale utility classes in `globals.css`** (AC3)
  - [ ] Add `.text-display-lg` class (48px desktop / 32px mobile, 700, +0.04em / +0.02em)
  - [ ] Add `.text-headline-md` class (24px, 600, +0.03em)
  - [ ] Add `.text-body-lg` class (18px, 400, line-height 1.6)
  - [ ] Add `.text-body-md` class (16px, 400, line-height 1.5)
  - [ ] Add `.text-label-sm` class (12px, 600, uppercase, +0.08em tracking)

- [ ] **Task 4: Update `layout.tsx` metadata and body wrapper** (AC2)
  - [ ] Change `metadata.title` to `"Oren"` and `description` to `"Premium women's fashion"`
  - [ ] Update the body wrapper div: replace `bg-slate-50` with `bg-[#faf7f2]` (or Tailwind alias once tokens are applied)
  - [ ] Preserve all existing font loading, Provider wrapper, Header, Footer — do NOT change them

- [ ] **Task 5: Create `Button.tsx`** (AC4)
  - [ ] Implement `variant="primary"` and `variant="secondary"` prop API
  - [ ] Support `className`, `onClick`, `disabled`, `type`, `children` props
  - [ ] Primary: pill shape (rounded-full), Deep Muted Brown background, Ivory text, hover scale 1.02, 300ms easing
  - [ ] Secondary: pill shape, transparent fill, Sand/Blush border, Deep Muted Brown text, blush fill + Soft Clay border on hover
  - [ ] Disabled state: reduced opacity, cursor-not-allowed, no hover effects
  - [ ] Export as `export default function Button`

- [ ] **Task 6: Create `InputField.tsx`** (AC4)
  - [ ] Props: `label?`, `placeholder?`, `type?`, `error?`, `className?` + standard input HTML attrs via spread
  - [ ] Styling: 16px radius, `bg-[#e8dccb]` (Warm Beige) fill, no border by default, `border-[#c9b2a6]` (Soft Clay) on focus, Warm Gray placeholder text
  - [ ] Error state: error message in `#b8998a` below field
  - [ ] Do NOT delete `TextInput.tsx` — it is used by existing login/signup pages; `InputField.tsx` is a NEW companion component

- [ ] **Task 7: Create `Chip.tsx`** (AC4)
  - [ ] Props: `label`, `selected?`, `onClick?`, `className?`
  - [ ] Styling: pill shape, uppercase, 12px/600/+0.08em tracking (Label SM), 300ms easing
  - [ ] Unselected: neutral fill; Selected: Muted Blush `#e7c6c1` fill, Soft Clay `#c9b2a6` border

- [ ] **Task 8: Write tests** 
  - [ ] `Button.spec.tsx` — renders with both variants, disabled state, onClick
  - [ ] `InputField.spec.tsx` — renders label, error message, focus behavior
  - [ ] `Chip.spec.tsx` — renders label, selected/unselected visual classes

## Dev Notes

### ⚠️ CRITICAL: TailwindCSS 4 Has No JS Config File

TailwindCSS v4 replaces `tailwind.config.js` with CSS-based configuration. **Do NOT create a `tailwind.config.js` or `tailwind.config.ts` file.** All theme customization — colors, radii, spacing, fonts — goes inside `@theme {}` or `@theme inline {}` blocks directly in `globals.css`.

The existing `globals.css` already has `@theme inline { ... }` — **expand this block**, do not replace it from scratch.

```css
/* CORRECT — expand existing @theme block */
@theme inline {
  --color-background: var(--background);   /* keep existing */
  --font-sans: var(--font-nunito);          /* keep existing */
  --font-mono: var(--font-geist-mono);      /* keep existing */

  /* Add Oren tokens here */
  --color-ivory: #faf7f2;
  --color-warm-white: #fff8f4;
  /* ... */
}
```

### ⚠️ CRITICAL: Nunito Font Is ALREADY Loaded — Do Not Re-add It

`layout.tsx` loads Nunito via `next/font/local` from `./fonts/Nunito-variable.ttf` and exposes it as the CSS variable `--font-nunito`. The `globals.css` `@theme` block already maps it with `--font-sans: var(--font-nunito)`. The existing font loading works correctly — **do not change the font loading code**.

```tsx
// layout.tsx — this is already correct, leave it as-is
const nunito = localFont({
  src: "./fonts/Nunito-variable.ttf",
  variable: "--font-nunito",
  weight: "200 1000",
  display: "swap",
});
```

Memory note: Self-hosted fonts are used because the corporate TLS proxy blocks Google Fonts CDN. Never reintroduce any CDN font link.

### Film-Grain Implementation

Use a CSS `body::before` pseudo-element with an inline SVG `feTurbulence` filter as the background image. This approach is self-contained and has no external dependency:

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.025; /* 2–3% — keep between 0.02 and 0.03 */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 200px 200px;
}
```

### Existing Components — What to Touch and What to Leave

| File | Status | This Story Action |
|---|---|---|
| `app/globals.css` | UPDATE | Expand `@theme`, add body tokens, add type-scale classes, remove dark mode |
| `app/layout.tsx` | UPDATE | Update metadata title/description; update body div bg class |
| `components/Button.tsx` | REPLACE | Currently empty (1 line) — fully implement |
| `components/inputs/TextInput.tsx` | LEAVE | In use by existing auth pages — do not modify |
| `components/InputField.tsx` | CREATE | New Oren-styled input alongside TextInput |
| `components/Chip.tsx` | CREATE | New component |
| `components/layout/Header.tsx` | LEAVE | Has slate/blue styles — do NOT restyle in this story |
| `components/layout/Footer.tsx` | LEAVE | Has slate colors — do NOT restyle in this story |
| `components/ProductCard.tsx` | LEAVE | Empty — filled in Story 2.2 |
| `next.config.ts` | LEAVE | Has SVG config — S3/Cloudinary `remotePatterns` added in Story 5.3 |

### Component Export Convention

The existing codebase uses `export default function ComponentName` for components (see Header.tsx, Footer.tsx). **Follow this existing pattern** despite the project-context.md Rule 5 stating named exports. Changing the convention in Story 1.1 would break existing imports; a refactor is out of scope.

### Current `globals.css` State (full content — you're updating this)

```css
@import "tailwindcss";
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-nunito);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root { --background: #0a0a0a; --foreground: #ededed; }
}

html, body { font-family: var(--font-nunito), "Segoe UI", Arial, Helvetica, sans-serif; }
body { background: var(--background); color: var(--foreground); font-size: clamp(16px, 1.2vw, 18px); }
.bg-login { background-image: url('/images/bg-login.jpg'); ... }
```

**Keep**: `@import "tailwindcss"`, `--font-sans`, `--font-mono`, font-family declaration, `.bg-login` class.
**Remove**: generic `--background`/`--foreground` CSS vars, the dark-mode `@media` block.
**Expand**: `@theme inline` with Oren tokens.
**Add**: Oren `:root` vars, body background, film-grain, type-scale classes.

### Current `layout.tsx` State

The body wrapper div currently reads:
```tsx
<div className="min-h-screen bg-slate-50">
```
Change `bg-slate-50` to `bg-[#faf7f2]`. The Tailwind `--color-ivory` token, once defined in `@theme`, will be available as `bg-ivory` — use whichever is available after the token is defined.

### Tailwind `@theme` Token Naming Convention

In TailwindCSS 4, `@theme` variables map to Tailwind utility classes. `--color-ivory: #faf7f2` becomes `bg-ivory`, `text-ivory`. Use descriptive Oren names consistently. Suggested token names:

| CSS Variable | Hex | Tailwind Utility |
|---|---|---|
| `--color-ivory` | `#faf7f2` | `bg-ivory`, `text-ivory` |
| `--color-warm-white` | `#fff8f4` | `bg-warm-white` |
| `--color-warm-beige` | `#e8dccb` | `bg-warm-beige` |
| `--color-sand` | `#fdebdc` | `bg-sand` |
| `--color-sand-dark` | `#f1dfd1` | `bg-sand-dark` |
| `--color-blush` | `#e7c6c1` | `bg-blush` |
| `--color-clay` | `#c9b2a6` | `bg-clay`, `border-clay` |
| `--color-brown` | `#4a3f35` | `bg-brown`, `text-brown` |
| `--color-warm-gray` | `#787770` | `text-warm-gray` |
| `--color-hairline` | `#c8c7be` | `border-hairline` |
| `--color-success` | `#a89a7f` | `text-success` |
| `--color-alert` | `#c4a896` | `bg-alert` |
| `--color-error` | `#b8998a` | `text-error` |
| `--color-error-strong` | `#ba1a1a` | `text-error-strong` |

### Button Component API

```tsx
// Expected usage in future stories:
<Button variant="primary" onClick={handleSubmit}>Add to Cart</Button>
<Button variant="secondary">Continue Shopping</Button>
<Button variant="primary" disabled>Out of Stock</Button>
```

Full-width support: accept `className` prop so callers can add `w-full` or `w-1/2` as needed.

### InputField Component API

```tsx
// Expected usage — must be compatible with React Hook Form via spread:
<InputField
  label="Full Name"
  placeholder="Enter your name"
  error={errors.name?.message}
  {...register('name')}
/>
```

Use `React.forwardRef` to allow RHF's `register` spread to work correctly.

### Testing Location and Pattern

- Test files co-located with source: `components/Button.spec.tsx`, etc.
- Backend: `*.spec.ts` — Frontend: `*.spec.tsx` or `*.test.tsx`
- Use `@testing-library/react` for component tests (standard Next.js/React setup)
- No mocking needed for these pure UI components

### Architecture Compliance Notes

- All transitions: `cubic-bezier(0.4, 0, 0.2, 1)` at 300ms — never use `ease`, `linear`, or sub-100ms durations
- No pure black (`#000000`) or pure white (`#ffffff`) in any Oren UI surface
- Accessibility: all interactive elements need focus-visible state (keyboard navigation — AC addressed in UX-DR23, which begins here)
- Single quotes, trailing commas (Prettier config applies to all files)

### References

- UX-DR1–UX-DR16: `_bmad-output/planning-artifacts/epics.md` lines 103–118 (color palette through grid)
- Architecture D15 (SSR/CSR boundary): `architecture/core-architectural-decisions.md`
- Memory: Self-hosted fonts — `architecture/starter-template-evaluation.md`
- project-context.md Rule 7 (Prettier), Rule 5 (component naming)
- Tailwind v4 docs: `@theme` configuration (no JS config in v4)

## Dev Agent Record

### Agent Model Used

(to be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List

- `frontend/app/globals.css` (update)
- `frontend/app/layout.tsx` (update)
- `frontend/components/Button.tsx` (replace — was empty)
- `frontend/components/InputField.tsx` (new)
- `frontend/components/Chip.tsx` (new)
- `frontend/components/Button.spec.tsx` (new)
- `frontend/components/InputField.spec.tsx` (new)
- `frontend/components/Chip.spec.tsx` (new)
