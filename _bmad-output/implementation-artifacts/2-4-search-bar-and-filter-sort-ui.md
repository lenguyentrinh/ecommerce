---
baseline_commit: c8a5f3310a133c21ad320da7a3c9e49b2507f86b
---

# Story 2.4: Search Bar & Filter/Sort UI

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to search for products by keyword and filter/sort the results,
so that I can quickly find exactly what I'm looking for.

> This is a **frontend-only** story (Next.js 16 App Router + React 19). The backend `GET /api/products` **already supports every needed query param** (`search`, `category`, `minPrice`, `maxPrice`, `inStock`, `sort`, `page`, `limit`) — shipped and verified in Story 2.1. **No backend changes.** This story adds: (1) a **sticky search bar** wired into the existing `Header`, (2) a **`/search?q=` results page**, and (3) a shared **filter/sort panel** that drives results via **URL query params** (shareable, bookmarkable, refresh-safe) on **both** `/search` and the existing `/categories/[name]` page. It reuses the Story 2.2 catalogue kit (`productApi`, `ProductGrid`, `ProductCard`, skeletons, `Chip`, error/loading boundaries).

## Acceptance Criteria

1. **Sticky search bar (AC #1)** — A search input is visible on the shopper pages, integrated into the **already-sticky `Header`** (Warm White `#fff8f4` field, hairline border, **Soft Clay focus border**, **≥44px** tap target). It stays visible on mobile while scrolling (the header is `sticky top-0 z-40`). An **X clear button** appears once text is entered and empties the field. Submitting (Enter or the search icon) navigates to **`/search?q=<query>`** (URL-encoded). The currently non-functional `FiSearch` button in `Header.tsx` is replaced by this working control.

2. **Search results page `/search?q=<query>` — SSR (AC #2)** — Server-renders results from `getProducts({ search: q, ...filters })`; products appear in the catalogue grid; a **result count** "Showing X of Y results" is shown (X = rendered so far / page size, Y = `total`); on **no results**, an empty state reads **"No results found. Try a different search or browse categories."** with a link to `/`. `generateMetadata()` sets a query-aware `<title>` (e.g. `"Search: linen — Oren"`).

3. **Filter & sort panel (AC #3)** — On a **search results OR category page**, a filter panel offers: **Price Range** (min / max number inputs), **Category** (selectable — see Dev Notes → Category constraint), **In Stock only** (toggle), and a **Sort** control with: *Price: Low to High* (`price_asc`), *Price: High to Low* (`price_desc`), *Newest* (`newest`), *Most Popular* (`popularity`). **Applied filters render as dismissible chips** above the grid; **"Clear all"** resets every filter.

4. **URL-driven, shareable, persistent (AC #4)** — Applying/changing any filter or sort **updates the URL query params** (`q`, `category`, `minPrice`, `maxPrice`, `inStock`, `sort`) and refreshes the grid with filtered results. Because the URL is the single source of truth, the result is **shareable/bookmarkable** and filter state **persists across a page refresh** (the Server Component re-reads `searchParams` and re-fetches).

5. **Loading & error states (AC #5)** — During a client-side navigation that changes the query (new search / filter / sort), a **skeleton grid + a "Searching…" indicator** appear (via the route's `loading.tsx` Suspense fallback). If the products request fails (or exceeds a ~2s timeout), an error state shows **"Something went wrong. Please try again."** with a **retry** action (via the route's `error.tsx`).

6. **No regressions (AC carry-over)** — The existing `Header` (auth dropdown, nav, cart/account icons), the home page, and the **shipped `/categories/[name]` page (Story 2.2)** keep working. No remote assets/fonts introduced. `next.config.ts` untouched. The category page gains the filter panel **without** breaking its category resolution, `notFound()` behaviour, or infinite scroll.

## Tasks / Subtasks

- [ ] **Task 1 — `SearchBar` component, wired into the Header (AC: #1, #6)**
  - [x] Create `frontend/components/ui/SearchBar.tsx` (`"use client"`). A controlled `<input type="search">` inside a `<form role="search">`; on submit, `router.push('/search?q=' + encodeURIComponent(trimmed))` (skip navigation if empty). Seed the input from `useSearchParams().get('q')` so it reflects the active query on `/search`.
  - [x] Styling: Warm White field (`bg-warm-white`), `border border-hairline`, **`focus:border-clay`** (or focus ring `ring-clay`), `rounded-full`, **min height 44px** (`h-11` or `py-3`), comfortable padding, a leading `FiSearch` icon (reuse `react-icons/fi` — already a dep). An **X clear button** (`aria-label="Clear search"`) shows only when the field is non-empty; clicking clears the input (and refocuses it).
  - [x] Integrate into `frontend/components/layout/Header.tsx`: replace the non-functional `<button aria-label="Search">` (lines ~81-83) with the `SearchBar` (or a search-icon trigger that reveals it). The header is already `sticky top-0 z-40`, satisfying the "stays visible on mobile scroll" requirement — do not add a second sticky bar. Keep the header on one line at desktop (Section: nav must not wrap); on small screens the search field can sit on its own row or collapse to the icon (document your choice). Preserve the auth dropdown + nav + cart/account icons exactly.
  - [x] `Header.tsx` is already a Client Component; `useRouter`/`useSearchParams` are available. Wrap any `useSearchParams` usage so it does not break SSR/prerender of pages that render the header (Next 16 requires a Suspense boundary around `useSearchParams` in some cases — see Dev Notes → useSearchParams).
- [ ] **Task 2 — `/search` results route (AC: #2, #4, #5)**
  - [x] Create `frontend/app/search/page.tsx` as an **async Server Component**. **Next 16: `searchParams` is a Promise** — `const sp = await searchParams`. Read `q`, `category`, `minPrice`, `maxPrice`, `inStock`, `sort`.
  - [x] Build a `ProductQuery` from the params (coerce `minPrice`/`maxPrice` to numbers, `inStock` to boolean, validate `sort` against the allowed set) and call `getProducts({ search: q, ...filters, page: 1, limit: 12 })`. Do **not** wrap in a try/catch that swallows the throw — a failure must surface via `error.tsx` (AC #5).
  - [x] Render: the result count "Showing {data.length} of {total} results"; the `FilterSortPanel` (Task 3); then either the `ProductGrid` seeded with results, or the **empty state** "No results found. Try a different search or browse categories." + a `next/link` to `/` (when `total === 0`).
  - [x] `export async function generateMetadata({ searchParams })` → title like `"Search: {q} — Oren"` (or `"Search — Oren"` when `q` is empty); guard for missing `q`.
  - [x] Add `frontend/app/search/loading.tsx` — skeleton grid (reuse `ProductCardSkeleton`) + a **"Searching…"** status line (`role="status"`). Add `frontend/app/search/error.tsx` (`"use client"`, mirror `app/categories/[name]/error.tsx`) → "Something went wrong. Please try again." + `reset()` retry + back-home link (AC #5).
  - [x] (Optional, AC #5 ">2s") wrap the `getProducts` call for `/search` in an `AbortController` with a ~2s timeout so a slow backend trips `error.tsx` rather than hanging. Document if you implement it; otherwise the generic failure path covers it.
- [ ] **Task 3 — `FilterSortPanel` component (AC: #3, #4)**
  - [x] Create `frontend/components/ui/FilterSortPanel.tsx` (`"use client"`). Reads current filters from `useSearchParams()`; writes changes by composing a new query string and `router.push(pathname + '?' + params)` (use `usePathname()` so the SAME component works on `/search` and `/categories/[name]`). Always reset `page` to 1 on any filter change.
  - [x] Controls: **Price Range** — two number inputs (`min`, `max`), applied on blur/Enter or an "Apply" affordance (debounce or explicit apply — do NOT push on every keystroke). **In Stock** — a toggle (reuse `Chip` with `selected`/`aria-pressed`, or a labeled checkbox). **Sort** — a native `<select>` (accessible, simplest) mapping the 4 labels to `price_asc|price_desc|newest|popularity`. **Category** — see Dev Notes → Category constraint (single-select for MVP; fetch options via `getCategories()` — pass them in as a prop from the Server page to avoid a client fetch).
  - [x] **Applied-filter chips:** above the grid, render one dismissible chip per active filter (e.g. "Under 200.000 ₫", "In Stock", "Fashion", "Price ↑"). Each chip has an **X** that removes just that param (`router.push` without it). A **"Clear all"** control removes all filter params (keep `q` on `/search`; keep the category path on `/categories/[name]`). `Chip` is a toggle button — for dismissible chips, render a small custom chip with an X button (don't overload `Chip`'s semantics).
  - [x] Guard against invalid input: `minPrice > maxPrice` should not be submitted (the backend 400s on it — Story 2.1); clamp or block and show a hint. Empty/whitespace values are omitted from the URL.
- [ ] **Task 4 — Reuse the panel on results + category pages (AC: #3, #6)**
  - [x] In `frontend/app/search/page.tsx`, render `FilterSortPanel` with the category options.
  - [x] **Modify `frontend/app/categories/[name]/page.tsx`** (Story 2.2, `done`) to: read the same filter/sort `searchParams` (now also a Promise — add `searchParams` to the page props), merge them into the `getProducts({ category, ...filters })` call, and render `FilterSortPanel`. **Preserve** the existing category resolution (case-insensitive match → `notFound()` for unknown), the `revalidate`, `generateStaticParams`, `generateMetadata`, and `ProductGrid` infinite scroll. The panel must NOT offer a Category control on the category page (the category is fixed by the route) — or it offers it as a way to jump categories; pick one and document.
  - [x] Verify `ProductGrid`'s `queryParams` includes the active filters so **infinite-scroll pages inherit the same filters** (otherwise page 2 would drop the filters).
- [ ] **Task 5 — `ProductGrid` empty-state for search (AC: #2)**
  - [x] `ProductGrid` currently hardcodes the empty message "No products in this category yet" (`components/ui/ProductGrid.tsx:99-101`). Add an optional prop `emptyMessage?: string` (default to the current text) so `/search` can pass "No results found. Try a different search or browse categories." — OR render the empty state at the page level and only mount `ProductGrid` when `total > 0`. Prefer the page-level empty state on `/search` so it can include the "browse categories"/home link (AC #2). Keep `ProductGrid`'s default behaviour unchanged for the category page (no regression).
- [ ] **Task 6 — Tests (AC: all)**
  - [x] `SearchBar.test.tsx`: typing + submit calls `router.push('/search?q=...')` (mock `next/navigation`); the X clear button appears only with text and clears the field; submitting empty does nothing.
  - [x] `FilterSortPanel.test.tsx`: changing sort/inStock/price pushes the expected URL query (page reset to 1); an applied-filter chip's X removes only that param; "Clear all" strips filter params (and keeps `q` / category context). Mock `useRouter`/`useSearchParams`/`usePathname`.
  - [x] (Optional) a small test that the `/search` query-building helper coerces/validates params (pure function — extract it so it's unit-testable).
  - [x] Run `pnpm lint` and `pnpm test` (frontend is **pnpm**-managed — never npm). New files green; no regressions. (Pre-existing Epic 1 lint/type debt is out of scope.)

## Review Findings

_Code review (2026-06-29) — 3-layer adversarial (Blind Hunter + Edge Case Hunter + Acceptance Auditor). **Acceptance Auditor: all 6 ACs PASS**, every documented decision verified implemented. No security issues. The substantive findings cluster on the `FilterSortPanel` price inputs (local state vs URL). 6 dismissed as noise / approved decisions._

### Patch

- [x] [Review][Patch] **Price inputs don't resync to the URL (filter resurrection).** `FilterSortPanel` seeds `minPrice`/`maxPrice` via `useState` once at mount; on soft navigation (price-chip dismiss, Clear all, browser Back) the inputs keep stale values, and a later blur re-pushes them — resurrecting the just-removed filter. Add `useEffect([current.minPrice, current.maxPrice])` to resync local state. [frontend/components/ui/FilterSortPanel.tsx]
- [x] [Review][Patch] **`applyPriceRange` can push invalid input.** A non-numeric value makes `Number(x) > Number(y)` → `NaN > y` → `false`, bypassing the inverted-range guard, so `?minPrice=abc` is pushed → backend 400 → `error.tsx`. Also, an inverted range silently no-ops with no feedback. Validate finiteness + range, show an inline hint, and block the push. [frontend/components/ui/FilterSortPanel.tsx]
- [x] [Review][Patch] **Stray `?q=`/`?category=` echoed onto category URLs.** The category page passes the full parsed `current` to the panel, so `pushWith`/`clearAll` re-emit a hand-edited `q`/`category` onto `/categories/[name]` (cosmetic — the SSR fetch ignores them). Pass `current={{ ...current, q: undefined, category: undefined }}`. [frontend/app/categories/[name]/page.tsx]
- [x] [Review][Patch] **Dead `export const revalidate = 60` on `/search`.** Ignored on a `searchParams`-driven dynamic route (the `getProducts` fetch keeps its own revalidate). Remove for clarity. [frontend/app/search/page.tsx]

### Defer

- [x] [Review][Defer] "Showing X of Y results" counts only the first page (doesn't grow with infinite scroll) — accepted MVP per **Question #3**; revisit if the count should track grid state. [frontend/app/search/page.tsx]

### Dismissed (6, noise / approved decisions)

`SearchBar` not pre-seeding from `?q=` (approved build-safe trim; `/search` heading shows the query) · `loading.tsx` skeleton 8 vs 12 cards (cosmetic, matches the category loader) · a new keyword search resets filters (intended) · "Featured" default-sort label (the 4 required sort options are all present; placeholder = unset) · "Most Popular" = `createdAt DESC` proxy (documented Story 2.1 decision) · In-Stock shown as both a toggle and an applied chip (redundant, both remove it; not a defect).

## Dev Notes

### Reuse the Story 2.2/2.3 catalogue kit — do NOT reinvent

Everything below already exists and is verified:
- **Data layer:** `frontend/features/product/services/productApi.ts` — `getProducts(query, opts)` already accepts the full `ProductQuery` (`search`, `category`, `minPrice`, `maxPrice`, `inStock`, `sort`, `page`, `limit`) and `buildProductQueryString` serializes it (omitting empty values). `getCategories()` returns `string[]`. **No new API functions needed.**
- **Grid:** `frontend/components/ui/ProductGrid.tsx` (client, infinite scroll, skeleton, dedupe, error-retry). Props `{ initialProducts, total, queryParams }`. It **re-seeds when `initialProducts` identity changes** (so a URL-driven SSR re-fetch resets it) and **carries `queryParams` into infinite-scroll fetches** — so you MUST pass the active filters in `queryParams` (Task 4) or page 2 silently drops them.
- **Card / skeleton:** `ProductCard`, `ProductCardSkeleton`.
- **Chip:** `frontend/components/Chip.tsx` — toggle button (`aria-pressed`, blush+clay when selected). Good for the In-Stock toggle and sort/category pills; NOT a dismissible chip (no X) — build a tiny dismiss-chip for applied filters.
- **Boundaries to mirror:** `app/categories/[name]/error.tsx` + `loading.tsx`, `app/not-found.tsx`.
- **Price:** `formatPrice` (VND) from `lib/helpers.ts` for the price-range chip labels.
- **Tokens:** `bg-warm-white`, `border-hairline`, `border-clay`/`ring-clay`, `text-brown`, `text-warm-gray`, `.text-label-sm`, `.text-body-md`, `rounded-full`, 300ms `cubic-bezier(0.4,0,0.2,1)` easing, `motion-safe:`.

### Architecture: URL params are the single source of truth (AC #4)

The whole feature is **URL-driven** so it is shareable, bookmarkable, and refresh-safe with zero client state to persist:
- The **Server Component** page (`/search`, `/categories/[name]`) reads `searchParams`, builds a `ProductQuery`, fetches SSR, and renders.
- The **`FilterSortPanel` (client)** never holds filter state in `useState` as the source of truth — it reads `useSearchParams()` and, on change, `router.push(`${pathname}?${newParams}`)`. Next re-runs the Server Component with the new params → fresh SSR results → `ProductGrid` re-seeds. (A light local `useState` for the in-progress price inputs before "Apply" is fine.)
- **Always reset `page=1`** when any filter/sort changes (stale page numbers + new filters = wrong/empty results).
- This means the "filter change" round-trips through the server. That is the intended, simplest correct design (matches AC #4's persistence requirement). The `loading.tsx` Suspense fallback covers the transition (AC #5).

### Next.js 16 specifics (verified against 2.2/2.3)

- **`searchParams` is a Promise** in Next 16 Server Components: `export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; minPrice?: string; maxPrice?: string; inStock?: string; sort?: string }> }) { const sp = await searchParams; }`. Same for `generateMetadata({ searchParams })`. (All `searchParams` values are `string | string[] | undefined` — coerce defensively.)
- **`useSearchParams()` requires a Suspense boundary** at build time: a Client Component calling `useSearchParams()` that is rendered on a statically-prerendered route must be wrapped in `<Suspense>`, or Next throws "useSearchParams() should be wrapped in a suspense boundary" during `next build`. The `Header` renders on every page (including static ones like `/`, `/login`), so if `SearchBar` calls `useSearchParams()`, **wrap `SearchBar` in `<Suspense fallback={...}>` inside the header** (or read the query a different way). Verify `pnpm build` passes. This is the single most likely build-breaker in this story.
- `useRouter` / `usePathname` from `next/navigation` (not `next/router`).

### Category filter — backend constraint (single-value) ⚠️

The backend filters by **one exact `category`** (`products.service.ts`: `qb.andWhere('product.category = :category', { category })`). It does **not** support multiple categories. The epic AC says "Category (**checkboxes**)", which implies multi-select — **not supported without a backend change** (an `IN (...)` / CSV param on `ProductQueryDto` + service). For this frontend story, implement Category as **single-select** (a row of `Chip`s or a `<select>`, one active category at a time) and treat it honestly. Multi-select is **Question #1** (needs a backend story). On `/categories/[name]` the category is fixed by the route — either hide the Category control there or use it to navigate between categories (document the choice). Do **not** fake multi-select that silently only sends one value.

### Search bar placement — integrate into the existing sticky Header (recommended)

The AC wants a sticky search bar on "any page in the shopper experience". The `Header` is **already** `sticky top-0 z-40` and rendered globally via `LayoutShell`. Putting the search input **in the header** satisfies sticky + mobile-visible for free and avoids a second sticky band that would eat viewport and risk layout shift on every page. Replace the dead `FiSearch` button with the live `SearchBar`. (If a full-width bar is preferred on mobile, let the field wrap to a second header row under `md`.) Avoid introducing a separate global `<SearchBar>` layout band unless you have a reason — note the decision either way.

### Sort options mapping

| UI label | `sort` value |
|---|---|
| Price: Low to High | `price_asc` |
| Price: High to Low | `price_desc` |
| Newest | `newest` |
| Most Popular | `popularity` |

`popularity` is a **`createdAt DESC` proxy** today (no sales data until Epic 4 — Story 2.1 decision). That is fine; the label can still read "Most Popular". Default sort (no `sort` param) is newest-first server-side.

### Result count semantics (AC #2)

`getProducts` returns `{ data, total, page, limit }`. "Showing X of Y" → **Y = `total`** (full match count). **X** = items currently shown. On SSR initial render that is `data.length` (the first page, ≤ limit); as infinite scroll appends, the visible count grows. Simplest correct MVP: show "Showing {data.length} of {total} results" from the SSR page (the first-page count). If you want the count to track infinite-scroll growth, it must live in/observe `ProductGrid` state — optional; the static first-page count satisfies the AC. Document which you chose.

### Loading / error (AC #5)

- `app/search/loading.tsx` = skeleton grid (`ProductCardSkeleton` × 8 in the same `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4` shape) + a `role="status"` "Searching…" line. This is the Suspense fallback shown during client navigation to a new query.
- `app/search/error.tsx` (`"use client"`) = "Something went wrong. Please try again." + `reset()` retry + back-home link. Mirror `app/categories/[name]/error.tsx` exactly (log the error, calm easing, focus ring).
- The ">2s" timeout is optional polish via `AbortController` (see Task 2). Without it, any real failure still lands on `error.tsx` — the AC's intent (don't hang, offer retry) is met.

### Accessibility

- Search: `<form role="search">`, `<input type="search" aria-label="Search products">`, clear button `aria-label="Clear search"` and keyboard-reachable.
- Sort `<select>` with an associated `<label>` (visually-hidden is fine).
- Price inputs: `<label>` each (e.g. "Min price"/"Max price"), `inputMode="numeric"`.
- Applied-filter chips: each X button `aria-label="Remove {filter}"`. "Clear all" is a real `<button>`.
- Filter toggles keyboard-operable (`Chip` already is). Respect `prefers-reduced-motion` for any panel open/close animation.

### Project Structure Notes

- **New files (all under `frontend/`):** `components/ui/SearchBar.tsx` (+test), `components/ui/FilterSortPanel.tsx` (+test), `app/search/page.tsx`, `app/search/loading.tsx`, `app/search/error.tsx`.
- **Modified files:** `components/layout/Header.tsx` (wire SearchBar), `components/ui/ProductGrid.tsx` (optional `emptyMessage` prop), `app/categories/[name]/page.tsx` (read filter params + render panel).
- **Routing:** `/search?q=` is a **flat route** (consistent with `/categories/[name]` and `/products/[id]` — the same intentional divergence from the architecture's `(shop)/products/?category=` sketch that 2.2/2.3 documented). No `(shop)` route group.
- **pnpm only.** `pnpm lint` / `pnpm test`; `pnpm add` for deps (none expected — `react-icons` already present).

### Testing standards

- Jest + React Testing Library, colocated `*.test.tsx` (see `ProductCard.test.tsx`). Mock `next/navigation` (`useRouter`, `useSearchParams`, `usePathname`) — follow how other client components are tested. `jest.setup.ts` already mocks `IntersectionObserver` (used by `ProductGrid`).
- Prioritise the interactive client components (`SearchBar` submit/clear, `FilterSortPanel` URL writes + chip removal + clear-all). Server pages are hard to unit-test in jsdom — manual/e2e is the gate for SSR/metadata: `pnpm build && pnpm start`, then hit `/search?q=linen`, `/search?q=linen&sort=price_asc&inStock=true`, `/categories/Dresses?sort=price_desc`, and a no-result query; confirm URL params drive results and survive refresh.
- **Verify `pnpm build` passes** (the `useSearchParams` Suspense rule is the likely failure — see Next 16 specifics).

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-2-product-catalog-discovery.md#Story 2.4] — acceptance criteria (authoritative).
- [Source: _bmad-output/implementation-artifacts/2-1-product-entity-api-and-seed-data.md] — the API + query params this story drives (`search` LIKE-escaped, `minPrice>maxPrice` → 400, `sort` enum, `inStock`, single-`category` exact match, `forbidNonWhitelisted`).
- [Source: _bmad-output/implementation-artifacts/2-2-home-page-and-category-pages.md] — the catalogue kit (`productApi`, `ProductGrid`, `ProductCard`, skeleton, boundaries), the flat-route decision, ISR pattern, and the `/categories/[name]` page this story extends.
- [Source: _bmad-output/implementation-artifacts/2-3-product-detail-page.md] — Next 16 async params pattern, error/loading boundary conventions, dedupe/guard patterns.
- [Source: frontend/features/product/services/productApi.ts] — `getProducts`/`buildProductQueryString`/`getCategories` (verified param support).
- [Source: frontend/components/ui/ProductGrid.tsx] — reuse + the hardcoded empty message + `queryParams`-into-infinite-scroll behaviour.
- [Source: frontend/components/Chip.tsx] — toggle chip API.
- [Source: frontend/components/layout/Header.tsx] — the sticky header + the dead `FiSearch` button to replace; `react-icons/fi` already imported.
- [Source: backend/src/modules/products/products.service.ts & dto/product-query.dto.ts] — single-category constraint, validation, sort proxy.
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-ecommerce-2026-06-22/DESIGN.md] — search/filter visual language (Warm White field, Soft Clay focus, chips, calm motion).

## Previous Story Intelligence

From **Story 2.2** (frontend, done) + its review:
- `ProductGrid` was hardened (in-flight ref guard, id-dedupe, short-page termination, `total` from response, observer-pause-on-error). Its empty state is **hardcoded** for categories — parameterize or page-handle for search.
- The flat-route decision (`/categories/[name]`) is the precedent for `/search`.
- VND price display is settled (`formatPrice`); the "$"-vs-VND copy is a tracked deferral (don't introduce new currency strings without noting it).
- Latent: with the current seed, most categories fit on one page, so **infinite scroll rarely fires** — search results will often be one page too. Don't block on infinite-scroll being exercised; correctness is what matters.

From **Story 2.3** (frontend, done) + its review:
- Next 16 async `params`/`searchParams` are Promises — await them.
- 404-vs-error discipline: let real failures hit `error.tsx`; don't swallow throws. Tighten input coercion (the 2.3 review caught loose numeric handling). Apply the same care to `minPrice`/`maxPrice` parsing here.
- Guard malformed responses defensively (the 2.3 `getProduct` 200-body fix) — `getProducts` already throws on non-OK; the page should let that bubble to `error.tsx`.

## Git Intelligence Summary

Recent commits land Story 2.3 (the PDP: bento gallery, glass info panel, `getProduct`, boundaries) and its code-review patches. The catalogue data layer and UI kit are mature and stable — this story is pure composition on top: a search input, a results route, and a URL-driven filter panel, all reusing `getProducts`/`ProductGrid`/`Chip`. No backend or new-dependency work. Baseline for this story: `c8a5f331`. The most likely friction is the Next 16 `useSearchParams` Suspense rule at build time (call it out, verify the build).

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Claude Opus 4.8, 1M context)

### Debug Log References

- `pnpm test` (scoped: SearchBar, FilterSortPanel, productFilters) → 3 suites / 13 tests passing.
- `pnpm test` (full) → **23 suites / 105 tests passing**, no regressions (was 20/92 after Story 2.3; +3 suites, +13 tests).
- `eslint` on all new files → clean. (`Header.tsx` reports one **pre-existing** `react-hooks/set-state-in-effect` error on the Epic-1 auth-dropdown effect at lines 48-51 — untouched by this story, same Header debt scoped out by 2.2/2.3; does not block `next build`.)
- `pnpm build` → **exit 0**, 33 pages. `/search` is `ƒ Dynamic` (reads `searchParams`); `/categories/[name]` is now `ƒ Dynamic` too (see Completion Notes → category-route tradeoff).

### Completion Notes — Implementation (Story 2.4)

- **Scope delivered:** a sticky `SearchBar` wired into the existing `Header` (replacing the dead search button); a `/search?q=` SSR results route (page + `loading.tsx` "Searching…" skeleton + `error.tsx`); a shared `FilterSortPanel` (sort `<select>`, price range, In-Stock toggle, category chips, dismissible applied-filter chips, "Clear all"); and the same panel added to `/categories/[name]`. A pure, tested `parseProductFilters` helper centralizes URL-param → query coercion.
- **Build-safe design decision (deviation from the spec's "FilterSortPanel reads useSearchParams"):** to avoid the Next 16 `useSearchParams` Suspense de-opt on the global Header and the prerendered category pages, **no component uses `useSearchParams`**. The Server pages parse `searchParams` and pass `current` filters to `FilterSortPanel` as **props**; the panel uses `useRouter` + `usePathname` only. `SearchBar` uses `useRouter` only (it does not pre-seed from `?q=`, a minor UX trim — the `/search` heading shows the active query instead). This made the build pass cleanly with zero Suspense boundaries.
- **URL is the single source of truth (AC #4):** every filter/sort change `router.push`es a new query string (page reset to 1), the Server Component re-fetches, and `ProductGrid` re-seeds — shareable, bookmarkable, refresh-safe. Active filters carry into `ProductGrid.queryParams` so infinite-scroll pages keep the filters.
- **Category filter is single-select (AC #3, Question #1):** the backend filters by one exact `category`. On `/search` the Category control is a chip row (single active); on `/categories/[name]` it's hidden (the route fixes the category). No fabricated multi-select.
- **Empty state handled page-level on `/search`** ("No results found. Try a different search or browse categories." + home link) so `ProductGrid` stayed unmodified (no regression to the category empty state). Task 5's optional `emptyMessage` prop was therefore unnecessary.
- **`minPrice > maxPrice` guarded** both in `parseProductFilters` (drops the inverted bound) and in the panel's price-apply (blocks the push) — avoids the backend 400.
- **⚠️ Category-route rendering tradeoff (affects Story 2.2's SSG optimization):** reading `searchParams` on `/categories/[name]` opts the route from **SSG → dynamic** (`ƒ`). This is inherent to URL-param filtering and required by AC #3 (filters on category pages). The `getProducts` fetch keeps `revalidate: 60`, so the data layer stays ISR-cached and the LCP impact is small (cached data, cheap render). Flagged for review; not a defect.
- **No backend changes, no new dependencies** (`react-icons` already present). `next.config.ts` untouched; no remote assets.

### Completion Notes — Story Authoring

- Story context created via bmad-create-story. Comprehensive frontend guide assembled from the epic AC, the as-built 2.1 API (all query params verified in source), the 2.2 catalogue kit + 2.3 boundary/async-params conventions (verified against live code), DESIGN.md, and the architecture. Key decisions documented: (1) URL-params-as-single-source-of-truth so filters are shareable/persistent; (2) integrate the search bar into the existing sticky Header rather than a new band; (3) Category filter is single-select due to the backend's single-value exact match (multi-select flagged as a backend question); (4) reuse `ProductGrid` (parameterize its empty state); (5) the shared `FilterSortPanel` drives both `/search` and `/categories/[name]` via `usePathname`. Flagged the Next 16 `useSearchParams` Suspense build rule as the top risk.

### File List

**Added**
- `frontend/features/product/productFilters.ts`
- `frontend/features/product/productFilters.test.ts`
- `frontend/components/ui/SearchBar.tsx`
- `frontend/components/ui/SearchBar.test.tsx`
- `frontend/components/ui/FilterSortPanel.tsx`
- `frontend/components/ui/FilterSortPanel.test.tsx`
- `frontend/app/search/page.tsx`
- `frontend/app/search/loading.tsx`
- `frontend/app/search/error.tsx`

**Modified**
- `frontend/components/layout/Header.tsx` (wired `SearchBar`, removed the dead search button + unused `FiSearch` import)
- `frontend/app/categories/[name]/page.tsx` (reads filter `searchParams`, renders `FilterSortPanel`, threads filters into `getProducts` + `ProductGrid`)

_(`components/ui/ProductGrid.tsx` was NOT modified — the `/search` empty state is handled page-level, so no `emptyMessage` prop was needed.)_

## Change Log

| Date | Change |
|------|--------|
| 2026-06-29 | Implemented Story 2.4 — sticky `SearchBar` in the Header; `/search?q=` SSR results route (+ loading/error boundaries); shared `FilterSortPanel` (sort, price range, in-stock, category chips, dismissible applied-filter chips, clear-all) on `/search` and `/categories/[name]`; `parseProductFilters` URL-param helper. URL-driven (shareable/persistent). No backend changes. 3 new test suites; full suite 105/105 green; build exit 0. Build-safe design: no `useSearchParams` (filters passed as props), avoiding the Next 16 Suspense de-opt. Category route became dynamic (filter tradeoff, documented). |
| 2026-06-29 | Code review (3-layer adversarial) — all 6 ACs PASS, 6 dismissed. Applied 4 patches: price inputs resync via parent `key` (fixes filter-resurrection on chip-dismiss/Clear-all/Back, lint-clean — no prop-sync effect); `applyPriceRange` rejects NaN + inverted range with an inline hint (no backend 400); category page strips `q`/`category` from the panel (no stray-param echo); removed dead `revalidate` on the dynamic `/search`. 1 deferred (first-page result count → `deferred-work.md`). Lint clean; 105/105 tests green; build exit 0. Status → done. |

## Questions / Clarifications for the Team

1. **Multi-select categories.** The epic AC says "Category (checkboxes)" but the backend filters by a single exact `category`. Ship **single-select** for this frontend story, or schedule a backend story to support multiple categories (`IN (...)`/CSV on `ProductQueryDto` + service) so the checkboxes are real? **Recommendation:** single-select now; defer multi-select to a backend story.
2. **Category control on `/categories/[name]`.** Since the route fixes the category, should the filter panel there (a) hide the Category control, or (b) show it as a category switcher that navigates to another `/categories/[x]`? **Recommendation:** hide it on the category page; the Category control appears only on `/search`.
3. **Result count vs infinite scroll.** "Showing X of Y" — keep X as the static first-page count (simplest), or have it track the growing infinite-scroll count (needs grid-state observation)? **Recommendation:** static first-page count for MVP.
