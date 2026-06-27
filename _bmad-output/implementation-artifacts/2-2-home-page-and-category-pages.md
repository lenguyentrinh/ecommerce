# Story 2.2: Home Page & Category Pages

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to land on a beautiful home page and browse products by category,
so that I can discover what Oren offers without knowing exactly what I'm looking for.

> This is a **frontend-only** story (Next.js 16 App Router + React 19). It builds the first **shopper-facing pages** of the catalogue: the home page (`/`) and category pages (`/categories/[name]`), both rendered as **Server Components** that consume the read API shipped in Story 2.1. It also establishes the **reusable catalogue UI kit** — `ProductCard`, `ProductGrid` (with infinite scroll), and skeleton placeholders — that Stories 2.3 (PDP) and 2.4 (Search/Filter) will reuse. No backend changes. The "Add to Cart" affordance is rendered per the design but is **not wired** (the cart arrives in Epic 3).

## Acceptance Criteria

1. **Home page (`/`) — SSR** — Visiting `/` server-renders: a hero/banner section (Oren styling — large image, Display LG headline, primary pill CTA); a **featured products** section showing the **first 8 active products** fetched from `GET /api/products?limit=8`; a **category navigation row** (pill chips, one per category from `GET /api/products/categories`, each linking to `/categories/[name]`). `generateMetadata()` returns a meaningful page title and Open Graph description. The hero image is prioritized for an LCP target < 2.5s.

2. **Category page (`/categories/[name]`) — SSR** — Visiting `/categories/[name]` server-renders a product grid filtered to that category via `GET /api/products?category=<name>`; the category name appears as a **Headline MD** heading; `generateMetadata()` sets a category-specific `<title>` and OG tags; if the category has no active products, an empty state shows **"No products in this category yet"**.

3. **Skeleton loading state** — When a product grid is fetching data **client-side** (infinite-scroll batches and route transitions), 4–6 skeleton cards render (Warm Beige `#e8dccb` placeholder, 16px radius, 4:5 aspect ratio) and fade in; once data resolves, skeletons fade out and real cards fade in. (SSR-rendered initial content needs no skeleton — it arrives already populated.)

4. **Infinite scroll** — On a product grid, as the shopper scrolls near the bottom, the next page of products loads automatically (client-side, incrementing `page`); a subtle loading indicator appears between batches; **no visible pagination buttons** exist. Loading stops when all products are loaded (`loaded.length >= total`).

5. **Product card** — Each card shows: a 4:5 aspect image (16px radius, Warm Beige bg placeholder, `next/image`, `alt={product.name}`), product name (16px / 600 / Deep Muted Brown), price (16px / 400 / Warm Gray, formatted as USD). On **desktop**: an "Add to Cart" CTA fades in (300ms) on **hover _or_ keyboard focus** (`group-hover` **and** `group-focus-within`) and the image zooms 1.02×. On **mobile**: a persistent subtle CTA button is shown. The CTA must be keyboard-focusable and reachable by screen readers (never hover-only). **Out-of-stock** products (`stockQuantity === 0`) show a disabled "Out of Stock" label instead of the CTA. The card's image + name link to `/products/[id]`.

6. **Responsive grid & motion** — Card grids use a uniform responsive grid: `grid-cols-2` (mobile) / `md:grid-cols-3` (tablet) / `lg:grid-cols-4` (desktop), ≥80px section gaps, 24px desktop / 20px mobile side padding. (The DESIGN.md "staggered masonry" treatment is an **aspiration deferred** — a uniform grid is the MVP target for this story; see Dev Notes → Masonry.) All hover/focus/fade transitions use the calm `cubic-bezier(0.4,0,0.2,1)` easing over 300ms and respect `prefers-reduced-motion`.

7. **Resilient SSR / graceful failure** — Server-side product fetches degrade gracefully: a failed/unavailable backend never white-screens the page. The home and category routes render a friendly fallback (and `error.tsx` boundaries exist), and `next build` does not hard-fail when the backend is unreachable at build time (see Dev Notes → Rendering strategy).

8. **No regressions / no new remote assets** — The existing client-side auth flow, Redux store, and `Header`/`Footer` shell continue to work. No remote image hosts or font CDNs are introduced (images remain local SVGs under `/public/images/placeholders/`). `next.config.ts` is not modified (local SVGs already render via `dangerouslyAllowSVG`).

## Tasks / Subtasks

- [ ] **Task 1 — Product types + data-access layer (AC: #1, #2, #4)**
  - [ ] Create `frontend/types/product.ts` with a `Product` interface matching the API response **exactly** (see Dev Notes → API contract). Include `imageUrls: string[]`, `price: number`, `stockQuantity: number`, `category: string`. Add `ProductListResponse = { data: Product[]; total: number; page: number; limit: number }`.
  - [ ] Implement `frontend/features/product/services/productApi.ts` (currently an empty placeholder file). Export:
    - `getProducts(params)` — server-safe fetch using the **native `fetch`** API (NOT the axios `api` client — see Dev Notes → SSR data fetching) returning `ProductListResponse`. Accepts `{ category?, search?, page?, limit?, sort?, ... }` and builds the query string.
    - `getCategories()` — returns `string[]` from `GET /api/products/categories`.
    - A shared `apiBaseUrl()` helper reading `process.env.NEXT_PUBLIC_API_URL`.
  - [ ] Server-side calls use Next.js fetch caching: `fetch(url, { next: { revalidate: 60 } })` so the home/category pages are statically-cached-but-fresh (tune revalidate; document the choice). Client-side infinite-scroll calls use a normal `fetch` (no cache hint needed).
  - [ ] **Resilient fetch (AC #7):** `getProducts`/`getCategories` throw on non-OK so callers can catch. Server Component pages must wrap fetches in `try/catch` and degrade to a safe fallback (empty product list / hidden category row) rather than letting the throw bubble — and choose a build-safe rendering strategy (see Dev Notes → Rendering strategy). Do not swallow errors silently in the client-side infinite-scroll path; stop loading and show a subtle non-blocking indicator instead.
- [ ] **Task 2 — `ProductCard` component (AC: #5, #6)**
  - [ ] Implement `frontend/components/ui/ProductCard.tsx` (the existing empty `components/ProductCard.tsx` may be removed/replaced — confirm location; prefer `components/ui/` per the architecture's frontend tree). Props: `{ product: Product }`.
  - [ ] Layout per DESIGN.md → Product Card: Warm White `#fff8f4` container, 16px radius, ambient shadow (`.shadow-ambient`), **no border**; image 4:5 aspect, 16px radius, Warm Beige placeholder bg, via `next/image` with `fill` + `sizes` + **`alt={product.name}`** (AC #5 — never empty alt); name (`.text-headline-md` scaled to 16px or a 16px/600 class) Deep Muted Brown; price Warm Gray 16px/400 formatted `formatPrice(price)` → `$165.00` (add helper to `lib/helpers.ts` using `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`).
  - [ ] Reveal (desktop, `group` + `group-hover:` **and** `group-focus-within:`): CTA fades in (opacity 0→1, 300ms), image scales 1.02×. **Accessibility (AC #5):** the CTA must appear on keyboard focus too (focus-within), stay in the tab order, and be screen-reader reachable — it must never be hover-only. Mobile: persistent subtle CTA (always visible). Use Tailwind `md:` breakpoints + the existing easing.
  - [ ] "Add to Cart" CTA: render the **`Button` component** (`variant="primary"` or a blush-filled variant per design) but **non-functional** this story — wire an `onClick` that is a no-op or shows `showToast.info('Coming soon')` (decide; see Dev Notes → Add-to-Cart scope). Out-of-stock (`stockQuantity === 0`): replace CTA with a disabled "Out of Stock" label (Alert `#c4a896`/Warm Gray, `cursor: not-allowed`), and do not render the active CTA.
  - [ ] Wrap image + name in a `next/link` to `/products/${product.id}` (PDP arrives in Story 2.3 — link is forward-compatible and will 404 until then; that is expected).
- [ ] **Task 3 — `ProductGrid` with skeletons + infinite scroll (AC: #3, #4, #6)**
  - [ ] Implement `frontend/components/ui/ProductGrid.tsx` as a **Client Component** (`"use client"`). Props: `{ initialProducts: Product[]; total: number; queryParams: {...}; }`. Renders a uniform responsive card grid — `grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6` — of `ProductCard`s. (Uniform grid only; masonry is deferred — see Dev Notes → Masonry.)
  - [ ] Infinite scroll: an `IntersectionObserver` on a sentinel `<div>` near the bottom; when intersecting and `loaded.length < total` and not already loading, fetch the next page (`page += 1`) via `getProducts`, append results. Show a subtle loading indicator between batches. No pagination buttons.
  - [ ] Skeleton: implement `frontend/components/ui/ProductCardSkeleton.tsx` (Warm Beige block, 16px radius, 4:5 aspect, gentle pulse). Render 4–6 skeletons while a client-side batch is loading; fade in/out with the 300ms easing. Guard all motion behind `prefers-reduced-motion`.
  - [ ] Empty state: when `initialProducts.length === 0`, render the "No products in this category yet" message (Body MD, Warm Gray, centered) — used by the category page (AC #2).
- [ ] **Task 4 — Home page rework (`/`) (AC: #1, #6, #7, #8)**
  - [ ] Convert `frontend/app/page.tsx` into an **async Server Component** (remove the stale "Daily Food Store" demo content and the `BestSellerSection` mock-data section). Fetch the featured products with a **deterministic sort** — `getProducts({ limit: 8, sort: 'newest' })` (do NOT rely on undefined default ordering for "featured") — and `getCategories()` server-side in parallel (`Promise.all`), inside a `try/catch` that degrades to an empty featured strip + hidden category row on failure (AC #7).
  - [ ] Add `export async function generateMetadata()` returning an Oren-branded title (e.g. `"Oren — Soft Minimal Luxury Fashion"`) and OG description.
  - [ ] **Hero/banner**: reuse/rework the existing hero. The current `HomeCarousel` (`components/home/HomeCarousel.tsx`, a client component using `/images/slide-*.svg`) can remain as a client component embedded in the server page, OR be replaced by a simpler static hero — pick the lighter path that hits LCP < 2.5s. The hero image must use `next/image` with `priority` for LCP. Headline = Display LG; primary pill CTA (e.g. "Shop the Collection" → links to a category or `/categories/Fashion`).
  - [ ] **Featured products section**: Headline MD section title (e.g. "Featured"); render the 8 fetched products through `ProductGrid` (or a static grid of `ProductCard` if infinite scroll is not desired on the home featured strip — featured is a fixed 8, so a plain grid is fine; reserve `ProductGrid` infinite scroll for category pages).
  - [ ] **Category nav row**: render a pill chip per category (reuse `components/Chip.tsx`), each a `next/link` to `/categories/${encodeURIComponent(category)}`.
  - [ ] Verify `Header`/`Footer` (via `LayoutShell`) still wrap the page and no auth regressions occur.
- [ ] **Task 5 — Category page (`/categories/[name]`) (AC: #2, #3, #4, #6)**
  - [ ] Create `frontend/app/categories/[name]/page.tsx` as an **async Server Component**. Read the `name` route param (Next.js 16: `params` is a Promise — `const { name } = await params`). Decode it and use it as the `category` query.
  - [ ] Fetch `getProducts({ category: decodedName, page: 1, limit: 12 })` server-side.
  - [ ] `export async function generateMetadata({ params })` → title like `"<Category> — Oren"` and OG tags.
  - [ ] Render: a Headline MD heading with the category name; the `ProductGrid` seeded with the initial 12 products + `total` for infinite scroll; the empty state when `total === 0`.
  - [ ] Add `frontend/app/categories/[name]/loading.tsx` rendering a skeleton grid (Suspense fallback for route transitions — satisfies AC #3 on navigation).
  - [ ] Add `frontend/app/categories/[name]/error.tsx` (Client Component error boundary) and a home-level `frontend/app/error.tsx`, rendering an Oren-styled "Something went wrong" message with a retry (`reset()`) action (AC #7). A fetch failure must hit this boundary, not a white screen.
  - [ ] (Optimization — AC #1/perf) Add `export async function generateStaticParams()` to the category route that returns the categories from `getCategories()` so known category pages prerender at build. **Guard for build-time backend availability** (wrap in try/catch returning `[]` so the build still succeeds when the backend is down — see Dev Notes → Rendering strategy).
  - [ ] Category-name casing: link using the **exact** category strings returned by `getCategories()` (the API filter is case-sensitive exact match — `Fashion`, `Electronics`, `Lifestyle`). Do not lowercase in URLs unless you also map back to the exact stored value.
- [ ] **Task 6 — Tests (AC: all)**
  - [ ] Add `ProductCard.test.tsx`: renders name + formatted price + image **with non-empty `alt`** (AC #5 a11y); shows a **keyboard-focusable** "Add to Cart" affordance when in stock; shows disabled "Out of Stock" when `stockQuantity === 0`; links to `/products/:id`. Follow the style of `components/Button.spec.tsx` / `LoginForm.test.tsx` (Jest + React Testing Library).
  - [ ] Add `ProductGrid.test.tsx`: renders the initial products; renders the empty state when given `[]`; renders skeletons while a (mocked) fetch is pending. Mock `IntersectionObserver` (jsdom does not implement it — add a setup mock).
  - [ ] Optionally test `formatPrice` and the `productApi` query-string builder (pure functions, cheap to cover).
  - [ ] Run `pnpm lint` and `pnpm test` (frontend is **pnpm**-managed — do NOT use npm) — both green.

## Dev Notes

### ⚠️ The single most important decision: SSR data fetching (AC #1, #2)

The existing frontend has **zero server-side data fetching** — every API call goes through the axios `api` client (`frontend/services/api.ts`, `baseURL: process.env.NEXT_PUBLIC_API_URL`, `withCredentials: true`) inside Redux thunks that run **after hydration on the client**. This story's ACs explicitly require **Server Components** + `generateMetadata()` + an LCP target, so you must introduce a server-side fetch path. Do not try to call the axios `api` client or dispatch Redux thunks from a Server Component.

**Approach — use the native `fetch` API in a small server-safe service:**

```ts
// frontend/features/product/services/productApi.ts
import type { Product, ProductListResponse } from '@/types/product';

const apiBaseUrl = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ProductQuery {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popularity';
  page?: number;
  limit?: number;
}

function toQueryString(q: ProductQuery): string {
  const sp = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// Server-safe (no axios, no withCredentials — these are public endpoints).
export async function getProducts(
  q: ProductQuery = {},
  opts?: { revalidate?: number },
): Promise<ProductListResponse> {
  const res = await fetch(`${apiBaseUrl()}/api/products${toQueryString(q)}`, {
    next: { revalidate: opts?.revalidate ?? 60 },
  });
  if (!res.ok) throw new Error(`Failed to load products (${res.status})`);
  return res.json();
}

export async function getCategories(opts?: { revalidate?: number }): Promise<string[]> {
  const res = await fetch(`${apiBaseUrl()}/api/products/categories`, {
    next: { revalidate: opts?.revalidate ?? 300 },
  });
  if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);
  const json = (await res.json()) as { data: string[] };
  return json.data;
}
```

- The endpoints are **public** (no auth) — do not send credentials/JWT.
- The same `getProducts` function is reused **client-side** for infinite-scroll batches (in `ProductGrid`). When called from a Client Component, the `next.revalidate` hint is harmless. If you prefer, branch on a flag to drop the cache hint client-side; not required.
- **Base URL note:** `NEXT_PUBLIC_API_URL = http://localhost:3001` (from `frontend/.env.local`). This resolves the same server-side and client-side in local dev. In some production topologies the server container needs an internal URL while the browser needs the public one — see Questions #1. For this story, reusing `NEXT_PUBLIC_API_URL` is correct.
- **CORS (client-side only):** the server-side fetch is server→server (no CORS). The **browser→`localhost:3001`** infinite-scroll fetch is cross-origin and depends on the backend's existing CORS config (already enabled in `backend/src/main.ts` — the auth flow proves `localhost:3000` is allowed). Native `fetch` here needs **no credentials** (public endpoints). If you hit a CORS error, the fix belongs in backend CORS config, not in the frontend — but it should already work; do not change it speculatively.

### Rendering strategy & resilience (AC #7) — the build-safe SSR decision

A live `fetch` inside a Server Component interacts with `next build`. If you do nothing, Next will try to **statically prerender `/` at build time**, and `next build` will **hard-fail** if the Nest backend isn't running during the build. You must make a deliberate choice and handle failure:

1. **Every Server Component fetch is wrapped in `try/catch`** and degrades to a safe fallback (home → empty featured strip + omit the category row; category → empty state) — a backend hiccup must never white-screen a page.
2. **Add `error.tsx` boundaries** (`app/error.tsx` and `app/categories/[name]/error.tsx`, both `"use client"`) with an Oren-styled message + `reset()` retry — the catch-all for unexpected throws.
3. **Pick a rendering mode** and document it in the story's completion notes. Either:
   - **ISR (preferred):** keep `next: { revalidate: 60 }`. Ensure the build does not require the backend — guard `generateStaticParams()` with try/catch returning `[]`, and rely on the per-page try/catch so a build-time prerender of `/` with the backend down still produces a (degraded-but-valid) page rather than failing. Verify `pnpm build` succeeds with the backend **stopped**.
   - **Dynamic:** add `export const dynamic = 'force-dynamic'` to `/` and the category page so they render per-request and are never prerendered at build. Simpler/safer for guaranteeing builds; trades away static caching. Acceptable for MVP.
   - Choose ISR if you want the LCP/caching win (AC #1); choose dynamic if build determinism matters more. Either is acceptable — just be explicit and verify the build.

### Masonry (AC #6) — uniform grid is the MVP target

DESIGN.md describes a **2-col staggered masonry** ("cards stagger at different heights") as the aspirational catalogue aesthetic. **This story intentionally ships a uniform responsive grid** (`grid-cols-2 / md:grid-cols-3 / lg:grid-cols-4`), which is what the epic AC actually requires. Do **not** build CSS-columns/masonry here — it complicates infinite scroll (column-balancing on append) and is not graded. Masonry can be revisited as a later polish story if desired. Stated explicitly so the uniform grid reads as a decision, not an omission.

### API contract (as built in Story 2.1 — verified against source)

Base: `http://localhost:3001`. Controller prefix is `api/products` (there is **no** global `/api` prefix — auth routes live at `/auth/*`). Do not assume a global prefix.

| Endpoint | Response shape |
|---|---|
| `GET /api/products` (+ query) | `{ data: Product[], total: number, page: number, limit: number }` |
| `GET /api/products/categories` | `{ data: string[] }` |
| `GET /api/products/:id` | `{ data: Product }` or **404** if inactive/soft-deleted |

**`Product` object the frontend receives (all fields present):**

```ts
// frontend/types/product.ts
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;            // a NUMBER (backend ColumnNumericTransformer parses the MySQL DECIMAL string)
  stockQuantity: number;
  category: string;         // 'Fashion' | 'Electronics' | 'Lifestyle' (seeded)
  imageKeys: string[];      // storage keys, e.g. ['fashion-1.svg', 'fashion-2.svg']
  imageUrls: string[];      // computed at read time, e.g. ['/images/placeholders/fashion-1.svg', ...]
  isActive: boolean;
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  deletedAt: string | null;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}
```

- **Use `imageUrls[0]`** as the card image src — it is a relative path (`/images/placeholders/fashion-1.svg`) that resolves against the **frontend's own** `public/` dir. Do not build URLs from `imageKeys` yourself.
- **List query params:** `category` (exact, case-sensitive), `search`, `minPrice`, `maxPrice`, `inStock` (`true`/`false`), `sort` (`price_asc|price_desc|newest|popularity`), `page` (default 1), `limit` (default **12**, max **100**). Unknown params are **400-rejected** by the backend's `forbidNonWhitelisted` ValidationPipe — only send the params above.
- **Seed reality:** 21 active products — `Fashion` (7), `Electronics` (7), `Lifestyle` (7). Each product carries 2 shared placeholder SVGs. So all cards in a category currently render the same image — expected for MVP placeholder data.
- **Pagination for infinite scroll:** `total` is the full match count. Stop loading when `loadedCount >= total` (equivalently `page >= Math.ceil(total / limit)`).

> Note: backend **unit-test fixtures** (`products.service.spec.ts`) use mock categories like `Dresses`/`Blazer`/`Tops`. Those are test doubles only — the **real seed** categories are `Fashion`/`Electronics`/`Lifestyle`. The category nav row is data-driven from `getCategories()`, so it will always reflect whatever is actually seeded — do not hardcode category names.

### Design tokens & reusable building blocks (reuse — do NOT reinvent)

Everything below already exists. **Reuse it.** (Source: `frontend/app/globals.css`, `frontend/components/`.)

- **Colors** (Tailwind v4 `@theme` tokens → use as `bg-warm-white`, `text-brown`, `bg-warm-beige`, `text-warm-gray`, `border-hairline`, `bg-blush`, `border-clay`, `text-alert`, etc.): ivory `#faf7f2`, warm-white `#fff8f4`, warm-beige `#e8dccb`, sand `#fdebdc`, blush `#e7c6c1`, clay `#c9b2a6`, brown `#4a3f35`, warm-gray `#787770`, hairline `#c8c7be`, alert `#c4a896`.
- **Type utilities:** `.text-display-lg` (hero headline, auto 32px on mobile), `.text-headline-md` (section/category headings, product card name can use 16px/600), `.text-body-md`, `.text-body-lg`, `.text-label-sm` (uppercase tracked — for chips/CTA labels).
- **Radius:** `rounded-lg` = 16px (cards/images), `rounded-full` (pills/chips/buttons).
- **Shadows:** `.shadow-ambient` (cards), `.shadow-hover`.
- **Grid:** `.container-oren` (64px desktop / 20px mobile side padding) + `.section-gap` (80px vertical) for page-level layout. **For the card grid, use a dedicated Tailwind grid — `grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6` — not `.grid-oren`.** (`.grid-oren` is a 12-col page scaffold; do not force cards into it via `span`. This is the single directive — don't offer the dev a choice here.)
- **`Button`** (`components/Button.tsx`, default export): props `variant?: 'primary' | 'secondary'` + native button attrs. Primary = brown fill / ivory text, pill, hover scale 1.02. Already uses the 300ms calm easing and clay focus ring. Reuse for the card CTA and hero CTA.
- **`Chip`** (`components/Chip.tsx`, default export): props `{ label, selected?, onClick?, className? }`, pill, selected = blush bg + clay border. For the category nav row, wrap a `Chip` in a `next/link` (or render a link styled like a chip) — `Chip`'s `onClick` is optional so a link wrapper is clean.
- **Fonts:** Nunito Sans is already loaded locally via `next/font/local` in `app/layout.tsx` (`--font-nunito`). Do not add Google Fonts. (See [[self-hosted-fonts-and-images]].)
- **Film grain + warm background** are applied globally in `globals.css` (`body::before`, `body { background: #faf7f2 }`) — no per-page work needed.

### Component conventions (match the existing codebase)

- **Default export** for components (PascalCase filename): `export default function ProductCard(...)`. (Matches `Button.tsx`, `Chip.tsx`, `Header.tsx`.)
- `"use client"` only where interactivity is needed: `ProductGrid` (IntersectionObserver, state), interactive card hover is CSS-only so `ProductCard` **can stay a Server Component** unless its CTA needs `onClick`/toast — if you wire `showToast` on the CTA, `ProductCard` (or just the CTA button) must be a Client Component. Keep the client boundary as small as possible (e.g. extract an `<AddToCartButton>` client subcomponent) to preserve SSR of the card body.
- **Path alias** `@/*` → project root (e.g. `import Button from '@/components/Button'`).
- **Toast:** `import { showToast } from '@/lib/toast'` → `showToast.info(...)`, `.success(...)`, `.error(...)`. Do not use `alert()`/`console.log` for user feedback.
- **`next/image`:** required for all imagery. Use `fill` + a sized wrapper with `aspect-[4/5]` + `sizes="(max-width:767px) 50vw, (max-width:1023px) 33vw, 25vw"`. The hero image gets `priority`. SVGs already render (`dangerouslyAllowSVG: true` in `next.config.ts`) — **do not modify `next.config.ts`**; no `remotePatterns` are needed because images are local/relative.
- **`next/link`** for all internal navigation.

### Routing decision — `/categories/[name]` (intentional variance from architecture doc)

- The **epic AC** (source of truth for this story) specifies `/categories/[name]`. Build exactly that: `frontend/app/categories/[name]/page.tsx`.
- The architecture/consistency docs (`project-structure-boundaries.md`, `implementation-patterns-consistency-rules.md`) sketch `app/(shop)/products/page.tsx` with a `?category=` query param instead. **Follow the AC, not the doc**, for this story. Rationale: the AC is explicit and user-facing; a pretty per-category path is better for SEO/`generateMetadata` and is what the story is graded against. The `(shop)` route group is not introduced here (no other shop pages exist yet); placing `categories/` at the app root is fine and avoids an empty route group. Document this so Story 2.4 (search at `/search?q=`) and 2.3 (PDP at `/products/[id]`) can reconcile structure later.
- **Next.js 16 dynamic params are async:** `export default async function Page({ params }: { params: Promise<{ name: string }> }) { const { name } = await params; ... }`. Same for `generateMetadata({ params })`. Decode with `decodeURIComponent(name)`.

### Add-to-Cart scope (cart does not exist yet)

The cart backend + UI land in **Epic 3** (Stories 3.1/3.2). This story renders the "Add to Cart" affordance **visually** per the design (hover-reveal desktop, persistent mobile, out-of-stock disabled state) but it is **not functional**. Implement the click handler as either a no-op or `showToast.info('Coming soon')` — keep it trivial to swap for the real cart dispatch in Story 3.2. Do **not** build a cart slice/thunk here. (See Questions #2.)

### Skeleton & motion details (AC #3, #6)

- Skeleton card = a `bg-warm-beige` block, `rounded-lg` (16px), `aspect-[4/5]`, with a gentle pulse. Use Tailwind `animate-pulse` **only** under `motion-safe:` (or guard with a `prefers-reduced-motion` media query) — the codebase already respects `prefers-reduced-motion` (see `globals.css` `.account-rise`, and `BestSellerSection`).
- SSR pages deliver the first paint already populated, so **no skeleton on initial load**. Skeletons appear for: (a) client-side infinite-scroll batches (render 4–6 while the next-page fetch is in flight), and (b) `categories/[name]/loading.tsx` as the Suspense fallback during client-side route transitions.
- Fade transitions: opacity 0→1 over 300ms with `ease-[cubic-bezier(0.4,0,0.2,1)]` (the same easing `Button` uses).

### Project Structure Notes

- New files (all under `frontend/`): `types/product.ts`; `features/product/services/productApi.ts` (fill the existing empty placeholder); `components/ui/ProductCard.tsx`, `components/ui/ProductGrid.tsx`, `components/ui/ProductCardSkeleton.tsx` (+ optional `components/ui/AddToCartButton.tsx` client subcomponent); `app/categories/[name]/page.tsx`; `app/categories/[name]/loading.tsx`; `app/categories/[name]/error.tsx`; `app/error.tsx`; tests alongside components.
- Modified files: `app/page.tsx` (rework to Server Component); `lib/helpers.ts` (add `formatPrice`).
- **Stale demo to remove/replace:** `app/page.tsx` currently renders a "Daily Food Store" hero + `components/home/BestSellerSection.tsx` (a complex client carousel fed by **mock data**). The featured-products section must come from the real API. Decide whether to delete `BestSellerSection`/`HomeCarousel` or adapt them. Recommendation: keep `HomeCarousel` (or a simpler static hero) for the banner; **replace** the `BestSellerSection` mock section with a real `ProductGrid`/card grid driven by `getProducts({ limit: 8 })`. If you retire `BestSellerSection`, check for other imports first.
- **`components/ProductCard.tsx` exists but is empty.** Prefer creating the real card at `components/ui/ProductCard.tsx` (matches the architecture's frontend tree) and delete the empty root-level stub to avoid confusion. Likewise `Navbar.tsx`/`components/Footer.tsx` empties are unrelated — leave them.
- **pnpm only.** The frontend is pnpm-managed; `npm install` corrupts `node_modules`. Use `pnpm` for any deps and `pnpm lint` / `pnpm test`. (See [[frontend-uses-pnpm]].)

### Testing standards

- Jest + React Testing Library (frontend convention; files `*.test.tsx` / `*.spec.tsx` colocated with source — see `components/Button.spec.tsx`, `LoginForm.test.tsx`). Config: `jest.config.ts` + `jest.setup.ts`.
- **Mock `IntersectionObserver`** in the test (jsdom lacks it). A minimal stub in the test file or `jest.setup.ts` is fine.
- Cover the AC-critical card states (in-stock CTA, out-of-stock disabled, price formatting, PDP link) and grid states (initial render, empty state, skeleton-while-loading). Server Component pages are hard to unit-test in jsdom — prioritise the presentational components; an e2e/manual check of `/` and `/categories/Fashion` is the acceptance gate for SSR/metadata.
- Manual SSR verification: `pnpm build && pnpm start`, then `curl -s localhost:3000/ | grep -i "<title>"` and view-source to confirm product markup is server-rendered (not just a client shell), and check the category page title differs per category.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-2-product-catalog-discovery.md#Story 2.2] — acceptance criteria (the authoritative spec for this story).
- [Source: _bmad-output/implementation-artifacts/2-1-product-entity-api-and-seed-data.md] — the API this story consumes; response shapes, query params, image-URL strategy, no-global-`/api`-prefix guardrail.
- [Source: backend/src/modules/products/products.controller.ts & products.service.ts] — verified endpoint paths, route order (`categories` before `:id`), `{data,total,page,limit}` vs `{data}` shapes, `toResponse()` image-URL generation.
- [Source: backend/src/database/seeds/product.seed.ts] — real seeded categories (Fashion/Electronics/Lifestyle, 21 products) and `imageKeys`.
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-ecommerce-2026-06-22/DESIGN.md#Components] — Product Card spec, button/chip specs, colors, type scale, 300ms easing, image-first philosophy.
- [Source: frontend/app/globals.css] — design tokens, `.text-*` utilities, `.grid-oren`/`.container-oren`/`.section-gap`, `.shadow-ambient`.
- [Source: frontend/components/Button.tsx, frontend/components/Chip.tsx] — reusable CTA + chip components and their props.
- [Source: frontend/services/api.ts, frontend/app/providers.tsx] — existing client-only axios+Redux pattern (the reason a new server-fetch path is required).
- [Source: frontend/next.config.ts] — `dangerouslyAllowSVG` already set; do not modify; no `remotePatterns` needed for local SVGs.
- [Source: frontend/app/layout.tsx] — Nunito Sans loaded via `next/font/local`; `LayoutShell` provides Header/Footer.
- [Source: _bmad-output/planning-artifacts/architecture/project-structure-boundaries.md] — frontend tree (`components/ui/ProductCard.tsx`, `features/products/`), and the `(shop)/products/?category=` structure this story intentionally diverges from.

## Previous Story Intelligence

From Story 2.1 (backend, done):
- The API contract was honoured precisely: list = `{ data, total, page, limit }`, single = `{ data }`, categories = `{ data: string[] }`. Build types to match exactly.
- `price` is returned as a **number** (a `ColumnNumericTransformer` was added specifically so the frontend can do price math/formatting without parsing strings).
- `imageUrls` are generated at read time as **relative** paths (`/images/placeholders/*.svg`) precisely so the Next.js frontend resolves them against its own `public/`. Use `imageUrls`, never `imageKeys`.
- **No global `/api` prefix exists** — the controller is `@Controller('api/products')`. Hit `${NEXT_PUBLIC_API_URL}/api/products`. Do not prepend another `/api`.
- Open questions carried from 2.1 that touch this story: `popularity` sort is a `createdAt DESC` proxy (fine — sort UI is Story 2.4 anyway); placeholder images are relative and shared per category (expected); single-product shape is `{ data: Product }` (relevant to Story 2.3, not this one).

## Git Intelligence Summary

Recent commits (`d246d37`, `e2c63cb`, `4713951`) are all **Story 2.1 backend** work — Product entity, API, seed data, and test-fixture cleanup (the fixtures switched mock categories to Dresses/Blazer/Tops, but the **seed** stayed Fashion/Electronics/Lifestyle). Epic 1 frontend (auth pages, account, design-system foundation in Story 1.1) established the conventions this story builds on: `next/font/local`, the Oren token set in `globals.css`, `Button`/`Chip`/`InputField`, Redux for client state, `showToast`, pnpm. No catalogue **frontend** code exists yet — `features/product/*` and `components/ProductCard.tsx` are empty placeholders ready to fill. This is the first SSR page in the repo, so there is no prior server-fetch pattern to copy — establish a clean one (Dev Notes → SSR data fetching) that 2.3/2.4 will reuse.

## Dev Agent Record

### Agent Model Used

(to be filled by dev agent)

### Debug Log References

### Completion Notes List

- Story context created via bmad-create-story. Comprehensive frontend implementation guide assembled from: the epic AC, the as-built 2.1 API (verified directly against backend controller/service/seed source, not just the spec), the Oren DESIGN.md, the live frontend codebase (tokens, components, conventions, existing stale home page), and the architecture docs. Key decisions documented with rationale: (1) introduce a native-`fetch` server-side data layer because the app is currently 100% client-side; (2) build `/categories/[name]` per the AC, an intentional variance from the architecture's `?category=` sketch; (3) render but do not wire "Add to Cart" (cart is Epic 3); (4) reuse all existing Oren tokens/components. Three open questions flagged for the team.

### File List

(to be filled by dev agent — expected: types/product.ts, features/product/services/productApi.ts, components/ui/ProductCard.tsx, components/ui/ProductGrid.tsx, components/ui/ProductCardSkeleton.tsx, optional AddToCartButton.tsx, app/page.tsx (rework), app/error.tsx, app/categories/[name]/page.tsx, app/categories/[name]/loading.tsx, app/categories/[name]/error.tsx, lib/helpers.ts (formatPrice), tests, plus removal of empty/stale stubs)

## Questions / Clarifications for the Team

1. **Server-side API base URL.** This story reuses `NEXT_PUBLIC_API_URL` (`http://localhost:3001`) for both server- and client-side fetches, which is correct for local dev. In production (containerised), the server may need an internal URL while the browser needs the public one. Confirm a single public URL is fine for now, or whether to introduce a server-only `API_URL`/`API_INTERNAL_URL` env var (would also touch deployment config in Epic 5).
2. **"Add to Cart" placeholder behaviour.** The CTA is rendered per design but non-functional until Epic 3. Preferred no-op behaviour: silent no-op, `showToast.info('Coming soon')`, or hide the CTA entirely until the cart ships? (Recommendation: render it disabled-but-styled or show a brief "coming soon" toast so the design is verifiable now.)
3. **Fate of `BestSellerSection`/`HomeCarousel`.** The existing home page uses a rich client-side `BestSellerSection` carousel on **mock** data. Replace it wholesale with an API-driven featured grid (recommended), or adapt the carousel to consume real products? And keep `HomeCarousel` as the hero, or swap to a simpler static hero for a better LCP? Confirm the desired home-page hero treatment.
