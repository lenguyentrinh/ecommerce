---
baseline_commit: c7718382a4a2265b7c19bed840e2836c131f92e8
---

# Story 2.3: Product Detail Page (PDP)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to view a full product page with images, details, and the option to add to my cart,
so that I can make an informed purchase decision.

> This is a **frontend-only** story (Next.js 16 App Router + React 19). It builds the `/products/[id]` Product Detail Page as a **Server Component** consuming the **already-shipped** `GET /api/products/:id` read endpoint (Story 2.1). It reuses the catalogue data layer and Oren UI kit established in Story 2.2 (`productApi`, `Button`, `formatPrice`, design tokens, error/404 boundaries). **No backend changes.** The "Add to Cart" affordance is rendered per the design but is **not wired** — the cart backend + dispatch arrive in **Epic 3** (Stories 3.1/3.2). The `ProductCard` already links to `/products/[id]`; this story makes that link resolve (it 404s today).

## Acceptance Criteria

1. **PDP route (`/products/[id]`) — SSR** — Visiting `/products/[id]` server-renders the product via `GET /api/products/:id`. `generateMetadata()` returns the **product name** as `<title>` and the **product description** as the Open Graph description. Desktop layout: **~60% image gallery (left) / ~40% info panel (right)**; the info panel has a **Warm White `#fff8f4`** background and **32px padding**. Mobile: full-width image gallery **stacked above** the info panel. The main product image uses `priority` for an LCP target **< 2.5s**.

2. **Image gallery** — The main image displays at full width with **16px radius** (`rounded-lg`), via `next/image`. When the product has **multiple images** (`imageUrls.length > 1`), a **thumbnail row** lets the shopper switch the main image; the active thumbnail is visually indicated. With a single image, no thumbnail row renders. Images are the existing **local placeholder SVGs** — `next.config.ts` is **not modified** and **no `remotePatterns`** are added (S3/Cloudinary `remotePatterns` is forward-looking and lands with the real `StorageService` in Story 5.3 — see Dev Notes → Images).

3. **Info panel** — Renders: product **name** (Headline MD — 24px/600/+0.03em), **price** (Body MD — 16px/400/Warm Gray, via `formatPrice` → VND), a **stock status indicator** (in-stock vs out-of-stock), the **"Styling Notes"** description (Body LG — 18px/400/line-height 1.6/Deep Muted Brown, rendered as editorial paragraph(s) from `product.description`, **not** a bullet list), **trust elements** (a static line, e.g. "Free shipping over $150 • 30-day returns"), and a primary **pill "Add to Cart" button** (full-width on mobile, half-width on desktop). The CTA is **non-functional** this story — it surfaces a "coming soon" toast (see Dev Notes → Add-to-Cart scope).

4. **Variant selector (conditional / defensive)** — **The `Product` data model has no size/color variant fields** (verified against `backend/.../product.entity.ts` and `frontend/types/product.ts`). The selector is therefore built **defensively**: it renders pill-chip selectors **only if** variant data is present on the product object; with the current data model **no variants exist, so nothing renders** — this is the correct, AC-satisfying behaviour, not an omission. When variants do render, selected state = **Muted Blush fill / Soft Clay border**, labels are uppercase tracked (Label SM). **Do NOT fabricate a variant schema, mock variant data, or add columns** to satisfy this AC (see Dev Notes → Variants and Question #1).

5. **Out of stock** — When `stockQuantity === 0`, the "Add to Cart" button is **replaced** by a disabled **"Out of Stock"** control: **Sand `#fdebdc` fill (`bg-sand`), Deep Muted Brown text (`text-brown`), `cursor-not-allowed`** — matching the already-shipped `ProductCard` out-of-stock treatment. The shopper cannot add it to cart (no active CTA rendered). The stock status indicator (AC #3) reflects this state. (The epic's literal "Warm Gray text" fails WCAG AA on a Sand fill at 12px, so the text is darkened to `text-brown`; see Dev Notes → Out-of-stock contrast.)

6. **404 for missing / inactive products** — When the product ID does not exist, is `isActive === false`, or is soft-deleted, the backend returns **404**; the page calls Next's `notFound()` and the existing Oren-styled **`app/not-found.tsx`** renders (branded message + "Back to home" link). A genuine 404 must **not** hit the `error.tsx` boundary or white-screen. **Network/5xx failures** (backend down/erroring) must surface via the route's `error.tsx` (retry), distinct from a 404.

7. **No regressions / no new remote assets** — Existing pages (home, category, auth, account) and the `Header`/`Footer` shell continue to work. No remote image hosts or font CDNs are introduced; images remain local SVGs under `/public/images/placeholders/`. `next.config.ts` is untouched. The build must not hard-fail when the backend is unreachable at build time (see Dev Notes → Rendering strategy), consistent with Story 2.2.

## Tasks / Subtasks

- [x] **Task 1 — `getProduct(id)` data-access (AC: #1, #6)**
  - [x] Add `getProduct(id: number | string, options?: { revalidate?: number }): Promise<Product | null>` to `frontend/features/product/services/productApi.ts` (the existing server-safe native-`fetch` service — **do NOT** use the axios `api` client; it is client-only and these endpoints are public/no-auth).
  - [x] Call `GET ${API_BASE_URL}/api/products/${id}`. **Return `null` on a `404`** so the page can call `notFound()`. **Throw on any other non-OK status** (network/5xx) so the route `error.tsx` boundary catches it (AC #6 — 404 and server-error are different outcomes). Parse the response as `{ data: Product }` and return `json.data`.
  - [x] Use the Next fetch cache hint `{ next: { revalidate: 60 } }` via the existing local `FetchInit` type pattern (matches `getProducts`/`getCategories`). Default `revalidate` to 60; allow override.
  - [x] Re-use the response shape already documented in `types/product.ts`. **Note:** the detail endpoint strips `isActive` and `deletedAt` (`toResponse` omits them) — do **not** depend on those fields client-side even though the `Product` type lists them.
- [x] **Task 2 — `ProductGallery` client component (AC: #2)**
  - [x] Create `frontend/components/ui/ProductGallery.tsx` as a **Client Component** (`"use client"` — thumbnail click switches the main image, needs `useState`). Props: `{ images: string[]; productName: string }`.
  - [x] Main image: `next/image` with `fill` inside a `relative` wrapper that holds the editorial aspect (use a tall/portrait ratio consistent with the catalogue, e.g. `aspect-[4/5]`), `rounded-lg` (16px), `object-cover`, **`alt={productName}`** (never empty), and **`priority`** on the main image for LCP (AC #1). Provide a sensible `sizes` (e.g. `(max-width: 1023px) 100vw, 60vw`).
  - [x] Thumbnail row: render only when `images.length > 1`. Each thumbnail is a focusable `<button>` (keyboard-operable, `aria-label`/`aria-current` for the active one) that sets the active index; active thumbnail indicated with a Soft Clay border/ring. Respect `prefers-reduced-motion` for any transition (`motion-safe:`), 300ms calm easing.
  - [x] Guard empty `images` (`imageUrls` could be `[]`) — fall back to an **existing** placeholder SVG (`/images/placeholders/dresses-1.svg` — confirmed present) so the gallery never renders a broken/empty image. (Note: `ProductCard.tsx:12` currently falls back to `/images/placeholders/fashion-1.svg`, which **does not exist** — do NOT copy that path; a 1-line fix of the card's dead fallback is fair game if you touch it, else leave for backlog.)
- [x] **Task 3 — Info panel + PDP Add-to-Cart + (defensive) variant selector (AC: #3, #4, #5)**
  - [x] Create `frontend/components/ui/ProductInfo.tsx` (Server Component is fine for the static panel; keep the only interactive piece — the CTA — in a small client subcomponent). Props: `{ product: Product }`. Layout per DESIGN.md → PDP: Warm White bg (`bg-warm-white`), `p-8` (32px) padding, generous vertical rhythm.
  - [x] Render: name (`.text-headline-md`, brown), price (`.text-body-md` Warm Gray via `formatPrice(product.price)`), stock status indicator (in-stock: subtle positive label; out-of-stock: muted/alert label), Styling Notes (`.text-body-lg` Deep Muted Brown, line-height 1.6 — render `product.description` as paragraph(s); split on blank lines into `<p>` if multi-paragraph, else a single `<p>`; **no bullet lists**), trust line (`.text-label-sm` or Body MD Warm Gray — "Free shipping over $150 • 30-day returns").
  - [x] **Add-to-Cart (AC #3, #5):** create `frontend/components/ui/PdpAddToCart.tsx` (`"use client"`) — **persistent** (NOT hover-reveal like the card's `AddToCartButton`), **full-width on mobile / half-width on desktop** (`w-full md:w-1/2`). In stock → reuse the `Button` component (`variant="primary"`, pill, full/half width) wired to `showToast.info('Add to Cart is coming soon')` (non-functional — Epic 3). Out of stock (`stockQuantity === 0`) → render a **disabled** "Out of Stock" control: **Sand fill (`bg-sand`), Deep Muted Brown text (`text-brown`), `cursor-not-allowed`**, no active click — this matches the shipped `ProductCard` (`ProductCard.tsx:36`) and **passes WCAG AA** (Sand `#fdebdc` + Brown `#4a3f35` ≈ 7:1). Do **not** use `text-warm-gray` here (≈3.9:1 — fails AA at 12px; this is the exact contrast trap 2.2's review caught with `text-warm-white on bg-alert`). Do **not** build a cart slice/thunk here.
  - [x] **Variant selector (AC #4) — defensive only:** since `Product` has no `variants`/`sizes`/`colors`, render the selector **conditionally** behind a presence check (e.g. `if (product.variants?.length)`), which is currently always false → nothing renders. Keep the chip markup ready (reuse `components/Chip.tsx`: selected = blush fill / clay border) so a future variant-bearing model lights it up without a rewrite. **Do not** invent fields, mock data, or seed variants. Flag Question #1.
- [x] **Task 4 — PDP route (`/products/[id]/page.tsx`) (AC: #1, #6, #7)**
  - [x] Create `frontend/app/products/[id]/page.tsx` as an **async Server Component**. Next.js 16: `params` is a Promise — `const { id } = await params;`. (Place at `app/products/[id]` — NOT under a `(shop)` route group — to match Story 2.2's established convention and the `ProductCard` link target; see Dev Notes → Routing.)
  - [x] **Reject non-numeric ids early (AC #6):** the backend `:id` is `ParseIntPipe`, so `/products/abc` would 400 → `error.tsx`. Guard at the top of the page: `if (!/^\d+$/.test(id)) notFound();` so a malformed id renders the branded 404, consistent with the 404-vs-error discipline. (Same guard in `generateMetadata`.)
  - [x] Fetch `const product = await getProduct(id);`. **`if (!product) notFound();`** (renders the existing `app/not-found.tsx`). Do **not** wrap this in a try/catch that swallows the throw — a non-404 failure must bubble to `error.tsx` (AC #6).
  - [x] `export async function generateMetadata({ params })` → fetch the product and return `{ title: product.name, description: <product.description trimmed>, openGraph: { title, description, type: 'website' } }`. **Guard for 404/missing**: if the product can't be loaded, return safe generic metadata (e.g. `{ title: 'Product — Oren' }`) rather than throwing — **only the page calls `notFound()`**, never `generateMetadata`. Calling `getProduct(id)` in both `generateMetadata` and the page is fine: Next's fetch cache **dedups** the identical GET within a single render, so it's one network round-trip (no need for a manual `React.cache()` wrapper).
  - [x] Compose the two-column layout: a responsive grid/flex — mobile stacked (`flex-col`), desktop `lg:grid lg:grid-cols-[60%_40%]` (or `lg:flex-row` with `lg:w-3/5` / `lg:w-2/5`) — gallery left, `ProductInfo` right. Use the existing page padding rhythm (mirror the `categories/[name]` page container — `mx-auto w-full max-w-[1400px] px-5 py-12 md:px-16`).
  - [x] **Rendering strategy:** export `revalidate = 60` (ISR, consistent with 2.2). Optionally add `generateStaticParams()` to prerender known product IDs from `getProducts({ limit: 100 })`, **guarded with try/catch returning `[]`** so the build still succeeds when the backend is down (mirror `categories/[name]`). With `[]`, IDs render on-demand — verify `pnpm build` passes with the backend **stopped** (AC #7).
- [x] **Task 5 — Route boundaries (AC: #6, #7)**
  - [x] Add `frontend/app/products/[id]/error.tsx` (`"use client"`) mirroring `app/categories/[name]/error.tsx` — log `error`, offer "Try again" (`reset()`) + "Back to home". This catches **non-404** fetch failures (AC #6). (404 is handled by `notFound()` → `not-found.tsx`, not here.)
  - [x] Add `frontend/app/products/[id]/loading.tsx` — a PDP-shaped skeleton (a large `bg-warm-beige rounded-lg aspect-[4/5]` gallery block + a few `bg-warm-beige` text-line blocks for the info panel), `motion-safe:animate-pulse`, matching the `categories/[name]/loading.tsx` style. Suspense fallback for client-side navigation into a PDP.
- [x] **Task 6 — Tests (AC: all)**
  - [x] `ProductGallery.test.tsx` (as-shipped **bento** gallery, not the superseded thumbnail-switcher): renders the **hero image with non-empty `alt`**; **tiles every provided image** (multi-image fixture); a **single-image** fixture renders only the hero; an **empty** `images` array falls back to the placeholder without crashing. Mock `next/image` as needed (follow `ProductCard.test.tsx`).
  - [x] `ProductInfo.test.tsx`: renders name, formatted VND price, description as paragraph text (not a list), trust line; shows an active "Add to Cart" affordance when in stock and the disabled **"Out of Stock"** control when `stockQuantity === 0`; variant selector is **absent** for a product with no variant data.
  - [x] Optionally extend `productApi.test.ts` for `getProduct`: returns `data` on 200, returns `null` on 404, throws on 500. (Pure-ish; mock `fetch`.)
  - [x] Run `pnpm lint` and `pnpm test` (frontend is **pnpm**-managed — never npm). New files green. (Pre-existing Epic 1 lint/type debt is out of scope — see Story 2.2 notes / `deferred-work.md`.)

## Review Findings

_Code review (2026-06-29) — 3-layer adversarial (Blind Hunter + Edge Case Hunter + Acceptance Auditor). **Acceptance Auditor: all 7 ACs PASS** (the bento gallery / full-width CTA / Display-style name / glass+mesh are verified-implemented, pre-approved overrides). No High issues confirmed; 8 dismissed as noise. The "malformed-200" finding was flagged High by Edge but is low-likelihood and the page already degrades safely; treated as a defensive patch._

### Patch

- [x] [Review][Patch] `getProduct` doesn't guard a 200 with missing/empty body — `res.json()` can throw or `json.data` can be `undefined` (returns `undefined`, not the declared `Product | null`). Guard with `.catch(() => null)` + `json?.data ?? null` [frontend/features/product/services/productApi.ts]
- [x] [Review][Patch] Out-of-stock control is a bare `<span>` (no role / no accessible name) — the PDP's primary purchase affordance is invisible to AT. Render a real `<button type="button" disabled aria-label="Out of Stock: {name}">` [frontend/components/ui/PdpAddToCart.tsx]
- [x] [Review][Patch] `isNumericId` (`/^\d+$/`) accepts leading-zero ids (`/products/007` → product 7 under a non-canonical URL) and INT-overflow ids (env-dependent 500 instead of branded 404). Tighten to `/^[1-9]\d{0,9}$/` and `Number(id) <= 2147483647` [frontend/app/products/[id]/page.tsx]
- [x] [Review][Patch] `generateMetadata` does `product.description.trim()` unguarded — throws if the payload ever has a null description. Use `(product.description ?? '')` [frontend/app/products/[id]/page.tsx]
- [x] [Review][Patch] Empty/whitespace description renders an empty open `<details>` "Product Description" panel (and an empty OG description). Only render the accordion when `paragraphs.length > 0` [frontend/components/ui/ProductInfo.tsx]
- [x] [Review][Patch] `loading.tsx` skeleton predates the Stitch alignment — it uses `bg-warm-white` + `grid-cols-[60%_40%]` while the page now uses `.account-mesh` + `.glass-panel` + `flex 58/42`. Update the skeleton to mirror the shipped layout [frontend/app/products/[id]/loading.tsx]
- [x] [Review][Patch] Doc: Completion Notes label the name "Display-LG", but the code uses a hand-rolled `text-[32px]` (the `.text-display-lg` utility is 48px). Correct the wording to "32px bold" [this story]
- [x] [Review][Patch] Doc: Task 6's gallery-test line still describes thumbnail-switching + `aria-current` assertions that the bento override removed. Update to the as-shipped bento tests [this story]

### Defer

- [x] [Review][Defer] Mixed currency — prices render in VND (`189.000`) but the trust line reads "Free shipping over **$150**". Already tracked as **Question #2** (keep decorative for this story; revisit with the deferred VND-magnitude re-seed) [frontend/components/ui/ProductInfo.tsx]

### Dismissed (8, noise / false-positive / handled)

`getRelatedProducts` self-exclusion buffer (degrades gracefully 4→3) · gallery hero has no "view 1" anchor (hero alt = product name is correct, and changing it breaks the test) · duplicate `revalidate` 60 (both match; works) · `as FetchInit` cast (the established `getProducts`/`getCategories` pattern) · `formatPrice(0)` → "0 ₫" (no zero-price data; product decision) · `generateStaticParams` >100-product coverage (handled by default `dynamicParams`) · two `<h1>` (self-retracted; single h1 on page) · `inStock` coupling (defended upstream — endpoint 404s inactive rows).

## Dev Notes

### This is the second SSR page set — reuse Story 2.2's pattern wholesale

Story 2.2 already established every primitive this story needs. **Reuse, do not reinvent:**
- **Server data layer:** `frontend/features/product/services/productApi.ts` (native `fetch`, `FetchInit` cache-hint type, `API_BASE_URL` from `NEXT_PUBLIC_API_URL`). Add `getProduct` alongside `getProducts`/`getCategories` in the same style.
- **Price:** `formatPrice` from `frontend/lib/helpers.ts` (VND, no decimals).
- **404:** `frontend/app/not-found.tsx` already exists and is branded — `notFound()` renders it. Do not create a new 404 page.
- **Boundaries:** copy `app/categories/[name]/error.tsx` + `loading.tsx` patterns for the `products/[id]` route.
- **CTA toast:** `showToast.info(...)` from `@/lib/toast` (the card's `AddToCartButton` shows "Add to Cart is coming soon" — reuse that copy).
- **Tokens & components:** `Button` (`@/components/Button`, default export, `variant="primary"` pill), `Chip` (`@/components/Chip`), and the Oren `@theme` Tailwind tokens / `.text-*` utilities in `globals.css`.

### API contract — detail endpoint (as built in Story 2.1, verified against source)

Base: `http://localhost:3001`. Controller prefix is `api/products` — **there is NO global `/api` prefix** (auth lives at `/auth/*`); do not prepend another `/api`.

| Endpoint | Response | Failure |
|---|---|---|
| `GET /api/products/:id` | `{ data: Product }` | **404** (`NotFoundException`) if id missing, `isActive === false`, or soft-deleted |

- `:id` is parsed by `ParseIntPipe` server-side — a **non-numeric id** (`/products/abc`) yields a **400**, not a 404. `getProduct` throws on 400 → hits `error.tsx`. (Acceptable; product links are always numeric. If you'd prefer `abc` → 404, validate `Number.isInteger` before fetching and `notFound()` — optional polish, note your choice.)
- The detail response is `ProductResponse = Omit<Product, 'isActive' | 'deletedAt'>` — i.e. **`isActive` and `deletedAt` are stripped** server-side. The frontend `Product` type still lists them (harmless legacy over-spec); just don't rely on them in the PDP.
- **`imageUrls`** is the array to render (relative paths like `/images/placeholders/dresses-1.svg`, resolved against the frontend's own `public/`). **Never** build URLs from `imageKeys`.
- **Seed reality — two datasets exist; image count is NOT guaranteed:** the **wired** seeder is `backend/src/database/seeds/seed.ts → product.seed.ts` (`npm run seed`), which inserts categories `Dresses`/`Tops`/`Blazer` with **2 SVGs each** (`imageUrls.length === 2`). But the repo also ships `backend/src/database/seeds/oren-products.sql` — a **separate, un-wired** manual reseed with **11 PNG products** (`/images/products/*.png`), different categories, **mostly single-image**. Which dataset is live depends on what was run. **Therefore: do NOT assume a fixed image count.** The gallery must render correctly for 1 image (no thumbnail row) and N images (thumbnail row), and the tests must cover **both** with explicit fixtures. The category nav/PDP never hardcode category names.

```ts
// Add to frontend/features/product/services/productApi.ts
export async function getProduct(
  id: number | string,
  options: { revalidate?: number } = {},
): Promise<Product | null> {
  const url = `${API_BASE_URL}/api/products/${id}`;
  const res = await fetch(url, {
    next: { revalidate: options.revalidate ?? 60 },
  } as FetchInit);
  if (res.status === 404) return null;       // → page calls notFound()
  if (!res.ok) throw new Error(`Failed to load product (${res.status})`); // → error.tsx
  const json = (await res.json()) as { data: Product };
  return json.data;
}
```

### Routing — `/products/[id]` (intentional variance from architecture doc, consistent with 2.2)

- The **epic AC** (source of truth) specifies `/products/[id]`. Story 2.2's `ProductCard` already links to `/products/${product.id}`. Build exactly `frontend/app/products/[id]/page.tsx` — **no `(shop)` route group**.
- The architecture (`project-structure-boundaries.md`) sketches `(shop)/products/[id]/page.tsx`. **Follow the AC + the 2.2 precedent**, not the doc: the `(shop)` group isn't introduced (no other shop pages exist at the app root yet; `categories/` and the home page also live at the app root). This is the **same documented variance** 2.2 made for `categories/[name]`. Story 2.4 (search at `/search?q=`) will reconcile structure later if desired.
- **Next.js 16 async params:** `export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; }`. Same for `generateMetadata({ params })`.

### Rendering strategy & resilience (AC #6, #7) — mirror 2.2's ISR decision

- Export `revalidate = 60` (ISR). Wrap nothing that should bubble: a **404** is an expected control-flow outcome (`getProduct` → `null` → `notFound()`), while a **non-404 failure** must reach `app/products/[id]/error.tsx`.
- `generateStaticParams` (optional) must be **build-safe**: `try { return (await getProducts({ limit: 100 })).data.map(p => ({ id: String(p.id) })); } catch { return []; }`. Default `dynamicParams` (true) means unlisted IDs still render on demand.
- **Verify `pnpm build` succeeds with the backend stopped** (2.2's AC #7 bar). With `generateStaticParams` returning `[]` and per-page `notFound()`/`error.tsx`, the build must not hard-fail.

### Variants (AC #4) — the one real gap, handled defensively

The data model has **no variant concept**: `product.entity.ts` has `name, description, price, stockQuantity, category, imageKeys, isActive, timestamps` — nothing for size/color. The epic AC is written conditionally ("**Given** the product has size or color variants"), so with no variant data the correct behaviour is to **render no selector**. Implement the selector **guarded by a presence check** so it's inert today and future-proof, but **do not** add columns, fabricate `variants`/`sizes` data, or seed fakes to make it visible — that would be scope creep into the data model (a backend story) and would ship fake UX. Captured as **Question #1** for the team.

### Images (AC #2) — local SVGs, do NOT touch `next.config.ts`

- The AC mentions `next/image` `remotePatterns` for an S3/Cloudinary domain. **That is forward-looking.** Today images are **local relative SVGs** that already render via `dangerouslyAllowSVG: true` (already set in `next.config.ts`); a relative `src` needs **no** `remotePatterns`. The real `StorageService` (absolute S3/Cloudinary URLs) arrives in **Story 5.3**, which is when `remotePatterns` becomes necessary.
- **Do not modify `frontend/next.config.ts`** and do not introduce remote hosts (self-hosted-assets project rule). When 5.3 ships absolute URLs, `remotePatterns` is added then. Note this variance in completion notes.
- Use `next/image` with `fill` + sized wrapper + `sizes` + non-empty `alt`. Main image gets `priority` (LCP). The `contentSecurityPolicy`/`contentDispositionType` already configured for SVG are fine.

### Add-to-Cart scope (cart is Epic 3)

The cart backend + UI land in **Epic 3** (3.1/3.2). The PDP renders the CTA **visually** but it is **not functional** — `showToast.info('Add to Cart is coming soon')` on click. Unlike the card's hover-reveal `AddToCartButton`, the **PDP CTA is persistent and prominent** (full-width mobile / half-width desktop). Keep the handler trivial to swap for the real `dispatch(addToCart(...))` in 3.2. Do **not** create a cart slice/thunk/quantity stepper here (quantity selection is an Epic 3 concern).

### Design tokens & specs (DESIGN.md → PDP)

- **Layout:** image gallery left ~60% / info panel right ~40% (desktop); stacked on mobile.
- **Info panel:** `bg-warm-white` (`#fff8f4`), **32px padding** (`p-8`).
- **Name:** Headline MD — `.text-headline-md` (24px / 600 / +0.03em), `text-brown`.
- **Price:** Body MD — `.text-body-md` (16px / 400), `text-warm-gray`, via `formatPrice`.
- **Styling Notes:** Body LG — `.text-body-lg` (18px / 400 / lh 1.6), `text-brown`, magazine paragraphs (not bullets).
- **Variant chips (when present):** selected = blush fill (`bg-blush`) / clay border (`border-clay`); labels uppercase tracked (`.text-label-sm`).
- **Add to Cart:** primary pill (`Button variant="primary"`), full-width mobile / half desktop. (DESIGN.md says "full-width"; the **epic AC #3 says full-width mobile / half-width desktop** — follow the AC, it's the graded source of truth.)
- **Out-of-stock contrast:** the disabled "Out of Stock" control uses `bg-sand` + **`text-brown`** (≈7:1, passes WCAG AA), **not** `text-warm-gray` (≈3.9:1 on Sand — fails AA at the 12px `.text-label-sm`). This matches the shipped `ProductCard.tsx:36`. The 2.2 review caught the analogous `text-warm-white on bg-alert` failure — don't reintroduce a low-contrast disabled state.
- **Radius:** `rounded-lg` = 16px (gallery image). **Shadows:** `.shadow-ambient`. **Easing:** 300ms `cubic-bezier(0.4,0,0.2,1)`, all motion behind `motion-safe:`.
- **Trust line copy** is literal marketing text from the AC ("Free shipping over $150 • 30-day returns"); note that prices display in **VND** while this line says "$150" — keep as-is (decorative) unless the team localizes it (Question #2).

### Component conventions (match the existing codebase)

- **Default export**, PascalCase filename (`ProductGallery.tsx`, `ProductInfo.tsx`, `PdpAddToCart.tsx`). New UI components live under `frontend/components/ui/` (matches `ProductCard`/`ProductGrid`).
- `"use client"` **only** where interactivity is needed: `ProductGallery` (thumbnail state) and `PdpAddToCart` (onClick/toast). Keep `ProductInfo` and the page as Server Components; keep the client boundary minimal (the page and panel stay SSR for metadata/LCP).
- **Path alias** `@/*` → project root. **`next/link`** for internal nav, **`next/image`** for all imagery. **Toast** via `@/lib/toast`.

### Project Structure Notes

- **New files (all under `frontend/`):** `components/ui/ProductGallery.tsx`, `components/ui/ProductInfo.tsx`, `components/ui/PdpAddToCart.tsx`; `app/products/[id]/page.tsx`, `app/products/[id]/error.tsx`, `app/products/[id]/loading.tsx`; tests alongside components (`ProductGallery.test.tsx`, `ProductInfo.test.tsx`).
- **Modified files:** `features/product/services/productApi.ts` (add `getProduct`); optionally `features/product/services/productApi.test.ts` (add `getProduct` cases). **Nothing else changes** — `next.config.ts`, `types/product.ts`, `lib/helpers.ts`, and all backend files are untouched.
- **pnpm only.** `pnpm lint` / `pnpm test`; `pnpm add` for any deps (none expected). `npm install` corrupts `node_modules` (see [[frontend-uses-pnpm]]).

### Testing standards

- Jest + React Testing Library; colocated `*.test.tsx` (see `ProductCard.test.tsx`, `Button.spec.tsx`). Config: `jest.config.ts` + `jest.setup.ts` (already has an `IntersectionObserver` mock — not needed here, but present).
- Prioritise the **presentational** components (gallery thumbnail switching, info-panel states, out-of-stock). Server Component pages are hard to unit-test in jsdom — manual/e2e is the acceptance gate for SSR/metadata.
- **Manual SSR verification:** `pnpm build && pnpm start`, then `curl -s localhost:3000/products/1 | grep -i "<title>"` (must show the product name, server-rendered) and confirm the description appears in view-source (not just a client shell). Hit a known-bad id (e.g. `/products/999999`) → branded 404. Stop the backend and confirm `pnpm build` still exits 0.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-2-product-catalog-discovery.md#Story 2.3] — acceptance criteria (authoritative spec for this story).
- [Source: _bmad-output/implementation-artifacts/2-1-product-entity-api-and-seed-data.md] — the detail API this story consumes: `{ data: Product }`, 404 on inactive/soft-deleted, read-time `imageUrls`, no-global-`/api`-prefix guardrail.
- [Source: _bmad-output/implementation-artifacts/2-2-home-page-and-category-pages.md] — the SSR pattern, `productApi` data layer, `Button`/`Chip`/`formatPrice`/tokens, `error.tsx`/`loading.tsx`/`not-found.tsx` boundaries, VND price decision, ISR rendering strategy, and the `ProductCard` → `/products/[id]` link this story fulfils.
- [Source: backend/src/modules/products/products.controller.ts & products.service.ts] — verified `@Controller('api/products')`, `findOne` returns `{ data }` / 404, `toResponse()` strips `isActive`/`deletedAt` and generates `imageUrls`.
- [Source: frontend/features/product/services/productApi.ts] — the service to extend (`getProducts`/`getCategories`/`FetchInit`/`API_BASE_URL`).
- [Source: frontend/types/product.ts] — `Product` shape (note `isActive`/`deletedAt` absent from detail response).
- [Source: frontend/components/ui/ProductCard.tsx, components/ui/AddToCartButton.tsx, components/Button.tsx, components/Chip.tsx] — reusable card/CTA/button/chip patterns and the existing "coming soon" toast copy.
- [Source: frontend/app/categories/[name]/page.tsx, error.tsx, loading.tsx, app/not-found.tsx] — the route + boundary patterns to mirror for `products/[id]`.
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-ecommerce-2026-06-22/DESIGN.md#Product Detail Page (PDP)] — 60/40 layout, Warm White panel + 32px padding, type scale, Styling Notes, size selector, full-width Add to Cart.
- [Source: frontend/next.config.ts] — `dangerouslyAllowSVG` already set; do NOT modify; no `remotePatterns` until Story 5.3.
- [Source: _bmad-output/planning-artifacts/architecture/project-structure-boundaries.md] — the `(shop)/products/[id]` sketch this story intentionally diverges from (consistent with 2.2).

## Previous Story Intelligence

From **Story 2.2** (frontend, done) and its code review:
- The server-fetch path is established — extend `productApi.ts` in the same native-`fetch` style; the axios client is client-only and must not be used in Server Components.
- **404 vs empty vs error were a recurring review theme in 2.2.** The category page initially conflated a backend failure with "empty category"; the fix was: unknown → `notFound()`, fetch-failure → `error.tsx`. Apply the same discipline here from the start: 404 → `notFound()`, 5xx/network → `error.tsx`. Don't swallow throws.
- **Contrast bug to avoid:** 2.2's review caught `text-warm-white on bg-alert` failing WCAG on the out-of-stock badge. The PDP out-of-stock control uses **Sand fill + Warm Gray text** — verify contrast and don't repeat that mistake. Also drop any no-op `aria-disabled` on non-interactive `<span>`s.
- **Defensive shape guards** were added in 2.2 (`getCategories` tolerating drift). `getProduct` should likewise not assume a perfect body — but a 404 is a status check, not a shape issue.
- VND price display is settled (`formatPrice`); a backend re-seed to realistic VND magnitudes is **deferred** (tracked in `deferred-work.md`) — out of scope here.
- The `ProductCard` already points at `/products/[id]`; this story is what makes those links resolve (2.2 explicitly accepted the temporary 404).

From **Story 2.1** (backend, done):
- `price` is a real `number` (transformer); `imageUrls` are relative read-time paths; single-product shape is `{ data: Product }`; no global `/api` prefix. All directly relevant to the PDP fetch/render.

## Git Intelligence Summary

Recent commits (`c771838`, `bb4c0b2`, `53d69cd`) are all **Story 2.2** home/category work — the editorial hero, `FeaturedCurations`/`NewArrivals`, the reusable `ProductCard`/`ProductGrid` kit, the `productApi` data layer, and the `error.tsx`/`not-found.tsx` boundaries. There is **no PDP code yet** (`app/products/` does not exist). This story slots directly on top of 2.2's primitives — no new dependencies, no backend work. Establish `ProductGallery`/`ProductInfo` cleanly so Story 2.4 (search/filter) and Epic 3 (cart) can build on them. The baseline commit for this story is `c771838`.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Claude Opus 4.8, 1M context)

### Debug Log References

- `pnpm test` (scoped: ProductGallery, ProductInfo, productApi) → 3 suites / 19 tests passing.
- `pnpm test` (full suite) → **20 suites / 93 tests passing**, no regressions (was 18/80 after Story 2.2; +2 suites, +13 tests).
- `eslint` on all new/modified files → **0 problems**.
- `pnpm build` with the backend **offline**: first run failed at prerendering `/categories/Dresses` (a Story 2.2 page) because Next's persisted `.next/cache` held category names from an earlier backend-up build, so `generateStaticParams` produced `Dresses` and the page's product fetch then hit `ECONNREFUSED`. After clearing `.next` (the true cold-cache "backend offline" scenario), **`pnpm build` exits 0** — TypeScript passes, 14 routes generated, and `/products/[id]` is registered as **SSG (uses generateStaticParams)**. See Completion Notes → Build resilience.

### Completion Notes — Implementation (Story 2.3)

- **Scope delivered:** `/products/[id]` PDP as an async Server Component consuming the as-built `GET /api/products/:id`. Added `getProduct(id)` to the existing native-`fetch` service (returns `null` on 404, throws otherwise). New components: `ProductGallery` (client; main image + thumbnail switching, handles 1..N images), `ProductInfo` (server panel: name/price/stock/Styling-Notes/trust line), `PdpAddToCart` (client; persistent CTA, out-of-stock disabled). Route boundaries: `error.tsx` + `loading.tsx`. Reused `app/not-found.tsx` for 404.
- **404 vs error discipline (AC #6):** non-numeric ids (`/^\d+$/` guard) and 404s → `notFound()` → branded `not-found.tsx`; real backend/5xx failures throw → `error.tsx`. `generateMetadata` never calls `notFound()` (returns generic metadata on miss).
- **Validation findings applied (from the pre-dev validation pass):** (1) **WCAG fix** — the out-of-stock control uses `bg-sand` + **`text-brown`** (≈7:1, AA-pass), matching the shipped `ProductCard`, NOT the AC's literal "Warm Gray text" (≈3.9:1, fails AA at 12px). (2) **Image-count robustness** — the gallery does not assume 2 images; it renders a thumbnail row only for >1 image and falls back to an existing placeholder (`dresses-1.svg`) for 0 images; tests cover single-image, multi-image, and empty cases. (3) Avoided copying `ProductCard`'s dead `fashion-1.svg` fallback.
- **Variants (AC #4):** the `Product` model has no size/color fields, so the variant selector is built defensively (a `getVariants()` stub returns `[]` → the chip block renders nothing today). No variant schema/data fabricated. Flagged as Question #1.
- **Images:** local relative SVGs render via the existing `dangerouslyAllowSVG` config — `next.config.ts` was **not** modified and **no `remotePatterns`** were added (deferred to Story 5.3 with the real `StorageService`).
- **Add to Cart** is rendered per design but non-functional (shows a "coming soon" toast); real cart dispatch is Epic 3.
- **Build resilience (latent, pre-existing, not introduced here):** with a *populated* `.next/cache` + backend down, the Story 2.2 category page's `generateStaticParams` can yield cached category names whose page fetch then fails the prerender — and the PDP `generateStaticParams` shares the same pattern (cached product IDs + backend down → prerender error). A cold CI build (fresh cache) passes cleanly. Recommend documenting/guarding this at the build level (e.g. `export const dynamic` or accepting on-demand rendering when the backend is unavailable) — tracked for backlog, out of scope for 2.3.

### Completion Notes — Stitch Design Alignment (2026-06-29, user-requested)

Compared the PDP against the canonical Stitch screen (project `2621556029010588670`, "The Ethereal Silk Wrap" optimized-layout PDP) and applied the **achievable, real-data** alignments (user chose "safe alignments"). These intentionally **override several original ACs** — flagged here so code review treats them as approved decisions, not defects:

- **Gallery → editorial bento (overrides AC #2 thumbnail-nav):** replaced the thumbnail-switcher with Stitch's bento tile layout (full-width hero + half-width detail tiles, all visible). `ProductGallery` is now a Server Component (no client state). Still image-count-agnostic (1 image → hero only).
- **Info panel is now sticky on desktop** (`lg:sticky lg:top-24`), matching Stitch's sticky aside (header is `sticky top-0`, ~80px).
- **Description → "Product Description" accordion** (`<details open>`, Stitch label + chevron via `react-icons/fa`), content still Body LG editorial paragraphs (AC #3 intent preserved; the standalone "Styling Notes" italic quote + "Curated by Oren Studio" card is **blocked** — needs a second content field the API doesn't provide).
- **CTA → full-width "Add to Shopping Bag" (overrides AC #3 half-width-desktop + "Add to Cart" label):** matches Stitch; out-of-stock control also full-width (still `bg-sand`+`text-brown`, AA-pass). `aria-label` contains the visible text (WCAG 2.5.3).
- **Added "Complete the Look"** — a same-category product strip via `getProducts({ category })` (excludes current, ≤4), reusing the existing `ProductCard`. Wrapped in try/catch so its failure never breaks the PDP. (Honest substitute for Stitch's curated-complements bento, which has no data source.)

**Second pass — full visual parity (2026-06-29, user requested faithful Stitch match of background/text/layout/card color):** adopted the **pastel-mesh background** (`.account-mesh`) and **frosted-glass cards** (`.glass-panel` + `.soft-shadow`) for the info panel, gallery tiles, and "Complete the Look" — these utilities already exist in `globals.css` (the `/account` screens use them), so this stays within the self-hosted system (no Google Fonts / Material Symbols / remote images / CDN). Product **name → a 32px bold display style** (a hand-rolled `text-[32px] font-bold tracking-tight`, matching Stitch's PDP name; note this is NOT the `.text-display-lg` utility, which is 48px) and **price → Headline-MD (normal weight, Warm Gray)**, matching Stitch's PDP hierarchy. The Oren warm palette is the brand's documented identity (DESIGN.md), so the premium-consumer palette ban does not apply. `.glass-panel` ships a `prefers-reduced-transparency` solid fallback.

**Still not applied (data-blocked / dishonest to fake):** the **size selector** (no variant model — would be fabricated UX; Question #1), the bespoke **"Styling Notes" quote + "Curated by Oren Studio"** card (needs a second content field; only `description` exists), and the **"New Arrival • Limited Edition"** eyebrow (no data flag — the real `category` is used instead).

**Consistency note:** the PDP now matches the **account** aesthetic (mesh + glass), not the **catalogue** aesthetic (home/category use ivory + solid cards). To make the whole shop flow consistent, home/category could later adopt the same mesh/glass treatment — flagged for the team, out of scope here.

**Re-validated:** full suite **20/20 · 92 tests** green; lint clean on changed files; `pnpm build` exit 0 and, with the backend now running (the `oren-products.sql` dataset — 11 mostly single-image PNG products), it **prerendered all 11 product PDPs + 7 category pages** with real data — end-to-end proof the gallery, info panel, and related-products fetch render correctly.

### Completion Notes — Story Authoring

- Story context created via bmad-create-story. Comprehensive frontend implementation guide assembled from: the epic AC, the as-built 2.1 detail API (verified against the live NestJS controller/service — `{ data }`, 404 on inactive/soft-deleted, `toResponse` field-stripping), the Oren DESIGN.md PDP spec, the 2.2 frontend kit + boundary patterns (verified against live code), and the architecture docs. Key decisions documented with rationale: (1) add `getProduct` returning `null` on 404 / throwing otherwise so 404 → `notFound()` and 5xx → `error.tsx`; (2) build `/products/[id]` (no `(shop)` group), the same intentional variance 2.2 took; (3) render the variant selector **defensively** because the data model has no variant fields — no fabrication; (4) keep `next.config.ts` untouched (local SVGs; `remotePatterns` waits for Story 5.3); (5) render but do not wire Add to Cart (cart is Epic 3). Two open questions flagged for the team.

### File List

**Added**
- `frontend/components/ui/ProductGallery.tsx`
- `frontend/components/ui/ProductGallery.test.tsx`
- `frontend/components/ui/ProductInfo.tsx`
- `frontend/components/ui/ProductInfo.test.tsx`
- `frontend/components/ui/PdpAddToCart.tsx`
- `frontend/app/products/[id]/page.tsx`
- `frontend/app/products/[id]/error.tsx`
- `frontend/app/products/[id]/loading.tsx`

**Modified**
- `frontend/features/product/services/productApi.ts` (added `getProduct`)
- `frontend/features/product/services/productApi.test.ts` (added `getProduct` cases)

## Change Log

| Date | Change |
|------|--------|
| 2026-06-29 | Implemented Story 2.3 — Oren SSR Product Detail Page (`/products/[id]`): `getProduct` data accessor (null-on-404 / throw-otherwise), `ProductGallery` (thumbnail switching, 1..N images), `ProductInfo` panel (name/price/stock/Styling Notes/trust line), persistent `PdpAddToCart` (out-of-stock disabled), `error.tsx`/`loading.tsx` boundaries, numeric-id 404 guard, guarded `generateStaticParams`. 3 new/extended test suites; full suite 93/93 green; production build passes with backend offline (cold cache). |
| 2026-06-29 | Pre-dev validation fixes folded into the spec + implementation: out-of-stock contrast corrected to `text-brown` (WCAG AA); gallery made image-count-agnostic; non-numeric-id guard promoted to a task; dead `fashion-1.svg` fallback avoided. |
| 2026-06-29 | Stitch design alignment (user-requested, "safe alignments"): gallery → editorial bento (Server Component); info panel sticky on desktop; description → "Product Description" accordion; CTA → full-width "Add to Shopping Bag"; added "Complete the Look" same-category strip (reuses `ProductCard`). Overrides AC #2 (thumbnail-nav) and parts of AC #3 (CTA width/label) per request — see Completion Notes → Stitch Design Alignment. Suite 92/92 green; build prerenders 11 PDPs + 7 categories with live data. |
| 2026-06-29 | CSS audit + full Stitch visual parity (user-requested): removed off-spec `leading-relaxed` (token already lh 1.6) and duplicated `uppercase`/`font-semibold`; added Safari `::-webkit-details-marker` hide. Then matched the Stitch PDP faithfully — pastel-mesh background (`.account-mesh`), frosted-glass info/gallery/recommendations cards (`.glass-panel`+`.soft-shadow`), 32px bold name, Headline-MD price. Reuses existing self-hosted utilities (no remote deps). Lint clean; 92/92 tests green; build prerenders 11 PDPs. |
| 2026-06-29 | Code review (3-layer adversarial) — all 7 ACs PASS, 0 High/Med confirmed defects, 8 dismissed. Applied 8 patches: `getProduct` malformed-200 guard; out-of-stock → accessible `<button disabled aria-label>`; tightened `isNumericId` (no leading-zero / INT-overflow); `generateMetadata` description null-guard; render `<details>` only when non-empty; `loading.tsx` skeleton mirrors mesh/glass/bento; 2 doc fixes (name-label, stale gallery-test description). 1 deferred (VND vs `$150` trust copy → `deferred-work.md`). Lint clean; 92/92 tests green (full `next build` not re-run after patches per user — changes are minor/type-safe). Status → done. |

## Questions / Clarifications for the Team

1. **Variants (size/color).** The `Product` model has **no** variant fields, so AC #4's variant selector has no data source and currently renders nothing (built defensively, future-proof). Confirm this is acceptable for MVP, OR schedule a backend story to add a variant/option model (would touch the entity, migration, seed, detail API, and admin product mgmt in Epic 5) before the selector can show anything real. **Recommendation:** accept the inert selector for MVP; defer a real variant model.
2. **Trust-line copy vs currency.** The AC trust line reads "Free shipping over **$150** • 30-day returns" while the catalogue displays prices in **VND** (per 2.2). Keep the literal "$150" decorative copy for now, or localize it (e.g. a VND threshold)? **Recommendation:** keep as-is for this story; revisit alongside the deferred VND-magnitude re-seed.

_(Resolved during prep: non-numeric `/products/abc` ids — the page guards with `/^\d+$/` → `notFound()` so a malformed id renders the branded 404 rather than the error boundary. Now a Task 4 subtask.)_
