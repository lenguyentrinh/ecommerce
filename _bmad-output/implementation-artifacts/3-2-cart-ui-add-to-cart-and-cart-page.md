# Story 3.2: Cart UI — Add to Cart & Cart Page

---
baseline_commit: e2504da
---

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to add items to my cart from any product page and manage them on the cart page,
so that I can collect the products I want before checking out.

> This is a **frontend-only** story (Next.js 16 + React 19 + Redux Toolkit 2.x, **pnpm**). It wires the already-rendered (but inert) "Add to Cart" buttons on the ProductCard and PDP to the **Story 3.1 cart API**, introduces a `cart` Redux slice + thunks + a `cartAPI` service (mirroring the shipped `auth` slice/thunk/service pattern), adds a cart-count badge to the Header, and builds the `/cart` page (item list, qty controls, remove, order summary, empty state). **No backend work** — the API contract is fixed by Story 3.1 (`@Controller('api/cart')`). **3.2 is authenticated-only**: every cart call is JWT-guarded, so the cart UI gates on auth. The **guest (localStorage) cart, the guest→user merge, and the out-of-stock/low-stock cart warnings are Story 3.3** — do not build them here (see Dev Notes → Scope boundaries).

## Acceptance Criteria

1. **Add to Cart — success feedback** — Clicking "Add to Cart" on a ProductCard or the PDP dispatches `POST /api/cart` `{ productId, quantity: 1 }`. On success: the button label briefly changes to **"✓ Added to Cart"** for ~1.5s then resets; a toast appears (bottom-left, 3s auto-dismiss) reading **"Added to cart! View cart or keep shopping."**; the Header cart-count badge increments to reflect the new total quantity. Transitions use the 300ms calm easing `cubic-bezier(0.4,0,0.2,1)`.

2. **Add to Cart — failure** — If the call fails (network error, **400 "Insufficient stock"**, 404 inactive product, or 401 unauthenticated): a toast **"Failed to add to cart. Please try again."** appears; the button returns to its default state; **no silent failures**. (For the insufficient-stock 400 you MAY surface the server message instead — see Dev Notes → Error copy.)

3. **Add to Cart while logged out** — Because the cart API is JWT-only in 3.2, an unauthenticated shopper who clicks "Add to Cart" is **not** silently dropped: show a toast **"Please sign in to add items to your cart."** and route to `/login?return=<current-path>` (reuse the existing `useRequireAuth` redirect convention). Guest localStorage carts are Story 3.3. [Recommended default — confirm in Questions #1.]

4. **Cart page layout — `/cart`** — Navigating to `/cart` (authenticated) renders, from `GET /api/cart`: a **list of cart items**, each with product image (16px-radius thumb), product name (16px / 600), price (16px / 400 / Warm Gray), quantity **+ / –** controls, and a **remove (×)** button; plus an **order summary** panel showing **subtotal** (from the API), **flat shipping** and **tax** (computed client-side — see Dev Notes → Shipping & tax), and **total**; a **"Continue Shopping"** secondary button (→ `/`) and a **"Proceed to Checkout"** primary button. Money is rendered with the existing `formatPrice` (VND).

5. **Quantity adjust** — Clicking **+ / –** calls `PATCH /api/cart/:itemId { quantity }` immediately and the summary (subtotal/shipping/tax/total) updates from the API response in real time. The **–** button is disabled at `quantity === 1` (use the remove × to go lower); the **+** button is disabled when `quantity === product.stockQuantity`. The control is disabled while its request is in flight (no double-fire / no negative interleaving).

6. **Remove item** — Clicking **×** calls `DELETE /api/cart/:itemId`; on success the row disappears with a **fade-out**, the summary updates, and if the cart is now empty the empty state (AC7) renders.

7. **Empty cart** — When `GET /api/cart` returns `{ items: [], subtotal: 0 }` (or after the last item is removed), the page shows a centered empty state: an icon, **"Your cart is empty"**, and a **"Continue shopping"** primary button linking to `/`.

8. **Auth gating + loading/hydration** — `/cart` is a protected route in 3.2: it uses `useRequireAuth` so it waits for session hydration (`authChecked`) before deciding, never flash-redirects, and sends unauthenticated users to `/login?return=/cart`. While the cart is loading it shows a calm loading state (skeleton or spinner consistent with the app); a fetch error shows a non-silent inline error with a retry. (3.3 will relax this so guests see their localStorage cart.)

9. **No regressions / tests green** — The Header search, account dropdown, nav, and all existing routes keep working. The `cart` reducer is registered in `store/store.ts` alongside `auth` without disturbing it. `pnpm test` (frontend) and `pnpm lint` are green; new unit tests cover the cart slice/thunks, the wired Add-to-Cart button, and the cart page composition.

## Tasks / Subtasks

- [ ] **Task 1 — `cartAPI` service (AC: #1, #4, #5, #6)**
  - [ ] Create `frontend/services/cartAPI.ts` using the shared axios instance `import { api } from './api'` (the **cookie-JWT** client — `withCredentials: true`; **do NOT** use `lib/axiosClient.ts`, it is empty/unused, nor the `fetch`-based `features/product/services/productApi.ts`, which is for public SSR reads only).
  - [ ] **Paths carry the `/api` prefix** (the cart controller is `@Controller('api/cart')`, exactly like `/api/products`; this is unlike `/auth/*` and `/users/*` which are unprefixed). Functions returning `res.data` typed as `CartView`:
    - `getCartAPI(): Promise<CartView>` → `api.get('/api/cart')`
    - `addCartItemAPI(productId: number, quantity: number): Promise<CartView>` → `api.post('/api/cart', { productId, quantity })`
    - `updateCartItemAPI(itemId: number, quantity: number): Promise<CartView>` → `api.patch(\`/api/cart/${itemId}\`, { quantity })`
    - `removeCartItemAPI(itemId: number): Promise<CartView>` → `api.delete(\`/api/cart/${itemId}\`)`
  - [ ] **There is NO `/api/cart/items`, `/api/cart/clear`, or `/api/cart/merge` endpoint** — those do not exist in 3.1 (merge is 3.3). Use only the four routes above.

- [ ] **Task 2 — Cart types (AC: #4)**
  - [ ] Add `frontend/types/cart.ts` mirroring the 3.1 contract **exactly** (`backend/src/modules/cart/cart.service.ts` `CartLine`/`CartView`):
    ```ts
    export interface CartLine {
      id: number;            // cart_items row id — used for PATCH/DELETE :itemId
      product: {
        id: number; name: string; price: number;
        imageUrl: string | null; stockQuantity: number; isActive: boolean;
      };
      quantity: number;
    }
    export interface CartView { items: CartLine[]; subtotal: number; }
    ```
  - [ ] **Critical id distinction:** `line.id` is the **cart-item** id (the `:itemId` for PATCH/DELETE); `line.product.id` is the **product** id (the `productId` for POST). Never cross them. (This `line.id` exists because of the 3.1 contract fix logged 2026-06-30 — see References.)

- [ ] **Task 3 — `cartThunk` (AC: #1, #2, #5, #6, #8)**
  - [ ] Create `frontend/store/cartThunk.ts` mirroring `store/authThunk.ts` (`createAsyncThunk`, `try/catch` → `rejectWithValue(err.response?.data?.message || 'fallback')`):
    - `fetchCartThunk()` → `getCartAPI()`
    - `addCartItemThunk({ productId, quantity })` → `addCartItemAPI(...)`
    - `updateCartItemThunk({ itemId, quantity })` → `updateCartItemAPI(...)`
    - `removeCartItemThunk({ itemId })` → `removeCartItemAPI(...)`
  - [ ] Every thunk resolves to a `CartView` so reducers can **replace** cart state from the authoritative server response (no client-side recomputation of subtotal/quantities).

- [ ] **Task 4 — `cartSlice` (AC: #1, #4, #5, #6, #7, #8, #9)**
  - [ ] Create `frontend/store/cartSlice.ts` mirroring `store/authSlice.ts`. State: `{ items: CartLine[]; subtotal: number; loading: boolean; error: string | null; loaded: boolean }`.
  - [ ] `extraReducers`: on each thunk's `fulfilled`, set `items`/`subtotal` from `action.payload`, clear `error`, set `loaded: true`; `pending` sets `loading: true`; `rejected` sets `loading: false` + `error` from `action.payload`. Add a `clearCart` reducer (logout hook — see Task 8).
  - [ ] Add selectors: `selectCartItems`, `selectCartSubtotal`, and **`selectCartCount` = Σ `item.quantity`** (total units, for the Header badge), plus `selectCartLoading`.

- [ ] **Task 5 — Register the reducer (AC: #9)**
  - [ ] In `frontend/store/store.ts` add `cart: cartReducer` to the `reducer` map (keep `auth` untouched). `RootState`/`AppDispatch` types update automatically.

- [ ] **Task 6 — Wire ProductCard "Add to Cart" (AC: #1, #2, #3)**
  - [ ] `frontend/components/ui/AddToCartButton.tsx` is a client component currently firing a "coming soon" toast. Change its props to `{ productId: number; productName: string }`; replace the `onClick` with: read `isAuthenticated` (`useSelector`), if not authed → AC3 (toast + `router.push('/login?return=' + encodeURIComponent(pathname))`); else `dispatch(addCartItemThunk({ productId, quantity: 1 })).unwrap()` then success path (AC1: 1.5s "✓ Added to Cart" label via local state, then reset) / catch → AC2 toast + reset. Keep the existing visibility/hover/focus classes and `aria-label` intact.
  - [ ] Update `frontend/components/ui/ProductCard.tsx:34` to pass `productId={product.id}` alongside `productName`. (ProductCard stays a Server Component — only the button is client.)

- [ ] **Task 7 — Wire PDP "Add to Shopping Bag" (AC: #1, #2, #3)**
  - [ ] `frontend/components/ui/PdpAddToCart.tsx` — same wiring as Task 6. Its props are currently `{ productName, inStock }`; add `productId: number`. Keep the in-stock `Button variant="primary"` / out-of-stock disabled branch. The success label may read "✓ Added to Cart" (the success microcopy is shared). Pass `productId={product.id}` from `ProductInfo` (in `app/products/[id]/page.tsx`).

- [ ] **Task 8 — Header cart badge + bootstrap fetch (AC: #1, #8, #9)**
  - [ ] `frontend/components/layout/Header.tsx` — change the shopping-bag `Link href="/product"` (line 83) to **`/cart`**, update `aria-label` to "Cart". Render a small count badge when `selectCartCount > 0` (Oren tokens: blush/clay or brown pill, `text-label-sm`, positioned top-right of the icon). The Header is already a client component reading Redux.
  - [ ] **Fetch the cart on session start:** when authenticated, dispatch `fetchCartThunk()` once so the badge and `/cart` are populated. Do this where auth becomes known — extend `providers.tsx` `AuthBootstrap` (after `fetchMe`) **or** add a small client effect keyed on `isAuthenticated`. Do **not** fetch when logged out (would 401). Clear cart state on logout (dispatch `clearCart` in/after `logoutThunk`).

- [ ] **Task 9 — `/cart` page + components (AC: #4, #5, #6, #7, #8)**
  - [ ] Create `frontend/app/cart/page.tsx` (client component — it dispatches thunks and reads Redux). Gate with `useRequireAuth()`; while `!authChecked` render the loading state; once authed, read cart from the slice (dispatch `fetchCartThunk` if not `loaded`).
  - [ ] Components (PascalCase, colocate under `frontend/components/cart/` per the components convention): `CartItemRow` (image, name, price, qty +/– per AC5, remove × per AC6, fade-out on removal), `CartSummary` (subtotal/shipping/tax/total per AC4 + Dev Notes, "Continue Shopping" secondary + "Proceed to Checkout" primary `Button`s), `EmptyCart` (AC7). Reuse the shared `@/components/Button` (`primary`/`secondary`) and `formatPrice`.
  - [ ] **"Proceed to Checkout"** has no destination yet (checkout is Epic 4). Render it as a primary button that, for now, routes to a placeholder or is disabled with a tooltip — **confirm in Questions #3.** Do not build checkout.
  - [ ] Use Oren tokens only (no new colors): page on the warm canvas (consider the existing `.account-mesh`/`.glass-panel`/`.soft-shadow` utilities used by account/product pages), 16px radii, pill buttons, 300ms easing. Mobile-first (stacked), summary panel beside/below the list on desktop.

- [ ] **Task 10 — Tests (AC: #9)**
  - [ ] `store/cartSlice.spec.ts` — reducer transitions: each thunk `fulfilled` replaces `items`/`subtotal`; `selectCartCount` sums quantities; `clearCart` empties state; `rejected` sets `error`.
  - [ ] `store/cartThunk.spec.ts` — mock `@/services/cartAPI`; assert each thunk calls the right API fn and resolves the `CartView` (and `rejectWithValue` on error). Mirror existing thunk tests.
  - [ ] `components/ui/AddToCartButton.spec.tsx` — mock `react-redux` `useSelector`/`useDispatch` (per the `useRequireAuth.test.tsx` pattern) and `next/navigation`: authed click dispatches `addCartItemThunk` and shows the success label; unauthed click routes to `/login`; failure shows the error toast and resets. Mock `@/lib/toast`.
  - [ ] `app/cart/page.test.tsx` — composition test mocking child components + Redux: renders item rows for a populated cart, renders `EmptyCart` for `{ items: [], subtotal: 0 }`, and shows the loading state while `!authChecked`. Mock `next/navigation` and `useRequireAuth`.
  - [ ] `pnpm test` and `pnpm lint` green. (Frontend is **pnpm**, jsdom + ts-jest; `*.spec.tsx`/`*.test.tsx`; `@/` path alias.)

## Dev Notes

### ⚠️ The API contract is FIXED by Story 3.1 — consume it exactly (verified against as-built code)

`GET /api/cart`, `POST /api/cart`, `PATCH /api/cart/:itemId`, `DELETE /api/cart/:itemId` — **all four return the full updated cart** as `CartView` (`{ items: CartLine[]; subtotal }`). Always update Redux from that response; never recompute the cart client-side. [Source: backend/src/modules/cart/cart.controller.ts, cart.service.ts]

```jsonc
// GET /api/cart  →  200
{
  "items": [
    { "id": 10,                         // cart_items row id  → PATCH/DELETE :itemId
      "product": { "id": 1, "name": "…", "price": 189000,
                   "imageUrl": "/images/placeholders/…svg",
                   "stockQuantity": 7, "isActive": true },
      "quantity": 2 }
  ],
  "subtotal": 378000
}
// empty → { "items": [], "subtotal": 0 }
```

- **POST** body `{ productId, quantity }` → 400 `"Insufficient stock"` if over stock, 404 if product missing/inactive, 401 if unauthenticated, 400 (ValidationPipe) if `quantity < 1` or non-numeric.
- **PATCH** body `{ quantity }`: `quantity === 0` **removes** the line; `> stock` → 400 `"Insufficient stock"`; other-user/missing item → 404. (For the +/– UI, prefer the `–`-to-1-then-× flow; you MAY use `PATCH {quantity:0}` as an alternate remove, but DELETE is the explicit remove.)
- **DELETE** → removes; 404 if missing/other-user.
- Items are returned **even when** `stockQuantity === 0` or `isActive === false` (so 3.3 can warn). **In 3.2 do not build the out-of-stock cart warning UI** — just render the line; 3.3 owns the badge, the low-stock cap, and disabling checkout. [Source: 3-1 AC4; epic-3 Story 3.3]

### Two axios clients + two service layouts — use the RIGHT one

| Layer | File | Use it for cart? |
|---|---|---|
| **Shared axios (cookie-JWT)** | `frontend/services/api.ts` (`withCredentials: true`) | ✅ **YES** — cart is authenticated + client-side. Mirrors `authAPI`/`usersAPI`. |
| Empty stub | `frontend/lib/axiosClient.ts` (effectively empty) | ❌ no — dead file |
| `fetch` + Next cache | `frontend/features/product/services/productApi.ts` | ❌ no — that's for **public SSR reads** (revalidate), not authed mutations |

Auth is **cookie-based JWT**: the HttpOnly cookie rides on `withCredentials: true`, so cart calls authenticate automatically with **no Authorization header and no token plumbing** (same as how `/account` works today). [Source: services/api.ts; services/authAPI.ts; features/product/services/productApi.ts]

### Path prefix gotcha — cart is `/api/cart`, auth/users are unprefixed

The backend has **no global `/api` prefix**; each controller self-prefixes. `auth`/`users` controllers are unprefixed (`/auth/login`, `/users/profile`) but **`products` and `cart` carry `api/`** (`/api/products`, `/api/cart`). So `cartAPI` paths **must include `/api`**. The frontend survey's `/cart/items` / `/cart/clear` guesses are **wrong** — there are only the four routes above. [Source: backend/src/modules/cart/cart.controller.ts:25; products.controller.ts]

### Established frontend patterns to copy (verified against live code)

- **Slice/thunk/service trio:** `store/authSlice.ts` + `store/authThunk.ts` + `services/authAPI.ts` is the exact shape to mirror for cart. `createAsyncThunk` with `try/catch → rejectWithValue(err.response?.data?.message || '…')`; slice uses `extraReducers` builder with pending/fulfilled/rejected. [Source: store/authSlice.ts, store/authThunk.ts, services/authAPI.ts]
- **Store registration:** `store/store.ts` is a flat `configureStore({ reducer: { auth } })` — add `cart`. [Source: store/store.ts]
- **Protected page:** `useRequireAuth()` waits on `authChecked`, redirects to `/login?return=<path>`; used by `/account`. Reuse verbatim for `/cart`. [Source: hooks/useRequireAuth.ts]
- **Bootstrap:** `providers.tsx` `AuthBootstrap` dispatches `fetchMeThunk()` on mount — the natural place to also kick `fetchCartThunk()` once auth is known. [Source: app/providers.tsx]
- **Toast:** `showToast.success/error/info` from `@/lib/toast`; `<Toaster position="bottom-left" duration={3000}>` is already configured in `providers.tsx` — AC1's bottom-left/3s requirement is already met by the global config, just call `showToast.*`. [Source: lib/toast.tsx, app/providers.tsx]
- **Button:** `@/components/Button` — `variant="primary"` (brown pill, ivory text) / `"secondary"` (outline → blush hover). Already used by `PdpAddToCart`. [Source: components/Button.tsx]
- **Money:** `formatPrice(value)` from `@/lib/helpers` renders **VND** (`189000 → "189.000 ₫"`). Use it for every price/subtotal/total. [Source: lib/helpers.ts]
- **Component/file naming:** PascalCase component files, named exports (except `page.tsx` default); route dirs kebab-case; tests `*.spec.tsx`/`*.test.tsx` colocated. [Source: project-context/critical-implementation-rules.md Rule 5/11]
- **Self-hosted assets:** placeholder SVGs under `/images/placeholders/...`; `imageUrl` may be `null` → fall back to `/images/placeholders/fashion-1.svg` like `ProductCard` does. **No remote images / Google Fonts.** [Source: ProductCard.tsx:12; memory: self-hosted-fonts-and-images]

### Shipping & tax — compute in the UI, but mind the currency

Epic 3.2 AC says "flat shipping fee ($5), flat tax (10%)". **The app displays VND**, not USD (`formatPrice` → ₫), so a literal "$5" is currency-mismatched. Recommendation: define constants in `frontend/lib/constants.ts` (e.g. `TAX_RATE = 0.10` and `SHIPPING_FEE = <VND amount, team-confirmed>`), compute `tax = round(subtotal * TAX_RATE)`, `total = subtotal + SHIPPING_FEE + tax`, all client-side in `CartSummary`. Centralizing them lets Epic 4 (order backend) reuse the same numbers. **Confirm the actual shipping fee + whether tax is 10% of subtotal in Questions #2** — do not hardcode "$5" literally. [Source: epic-3 Story 3.2; lib/helpers.ts VND; lib/constants.ts]

### Add-to-Cart button state machine (AC1/AC2)

Local component state (not Redux) drives the transient label: `idle → adding (disabled) → added ("✓ Added to Cart", ~1.5s) → idle`. On `.unwrap()` reject → toast + back to `idle`. The Header badge increment is **not** local — it falls out of the slice update from the thunk's `CartView` response. Guard against unmount during the 1.5s timer (clear the timeout in cleanup) to avoid a React state-update-after-unmount warning. The current buttons pass `productName` only — you are **adding** `productId`; update both call sites (ProductCard, ProductInfo/PDP).

### Quantity control concurrency (AC5)

Disable the +/– buttons (and ideally show a subtle in-flight state) while `updateCartItemThunk` is pending for that line, so rapid clicks can't interleave and land the cart in a stale quantity. Because the server returns the authoritative `CartView`, the simplest correct approach is **await each PATCH and replace state from the response** (no optimistic local increment). The `+` disables at `quantity === product.stockQuantity`; `–` disables at `quantity === 1` (× removes).

### Scope boundaries — what is NOT in this story

- **No guest / localStorage cart.** All 3.2 cart calls are JWT-authenticated; logged-out add-to-cart routes to login (AC3). The `oren_cart` localStorage cart + `GET /api/products/:id` hydration is **Story 3.3**. [Source: epic-3 Story 3.3]
- **No cart merge.** `POST /api/cart/merge` does not exist and is **3.3** (guest→user on login). [Source: 3-1 Dev Notes → Scope boundaries]
- **No out-of-stock / low-stock cart UI.** The "Out of stock" badge, the "Only X left" cap, and disabling checkout for OOS lines are **3.3**. In 3.2 just render whatever `GET /api/cart` returns. [Source: epic-3 Story 3.3]
- **No checkout.** "Proceed to Checkout" is a button with no real destination yet (Epic 4). [Source: epic-4]
- **No backend changes.** The 3.1 contract is fixed (incl. the `line.id` fix). If you find a genuine contract gap, flag it — do not silently patch the backend in a frontend story.

### Design tokens (Oren — DESIGN.md) quick reference

- Colors (Tailwind v4 `@theme` in `globals.css`): `brown #4a3f35` (text/primary), `warm-gray #787770` (price/secondary), `blush #e7c6c1` / `clay #c9b2a6` (accents/hover), `warm-white #fff8f4` / `warm-beige #e8dccb` / `sand` (surfaces), `alert #c4a896` (3.3's OOS — not used here). No tech colors, no pure black/white.
- Radii: cards/inputs/thumbs **16px (`rounded-lg`)**; buttons/chips **pill (`rounded-full`)**.
- Motion: **300ms `cubic-bezier(0.4,0,0.2,1)`** on every transition (`ease-[cubic-bezier(0.4,0,0.2,1)]`).
- Utilities available: `.shadow-ambient`, `.shadow-hover`, `.soft-shadow`, `.glass-panel`, `.account-mesh`, type classes `.text-headline-md` / `.text-body-md` / `.text-label-sm`. [Source: app/globals.css; DESIGN.md]

### File Locations Reference

| Action | Path |
|---|---|
| NEW | `frontend/services/cartAPI.ts` |
| NEW | `frontend/types/cart.ts` |
| NEW | `frontend/store/cartThunk.ts` |
| NEW | `frontend/store/cartSlice.ts` |
| NEW | `frontend/app/cart/page.tsx` |
| NEW | `frontend/components/cart/CartItemRow.tsx` |
| NEW | `frontend/components/cart/CartSummary.tsx` |
| NEW | `frontend/components/cart/EmptyCart.tsx` |
| NEW | `frontend/store/cartSlice.spec.ts` |
| NEW | `frontend/store/cartThunk.spec.ts` |
| NEW | `frontend/components/ui/AddToCartButton.spec.tsx` |
| NEW | `frontend/app/cart/page.test.tsx` |
| UPDATE | `frontend/store/store.ts` (register `cart` reducer) |
| UPDATE | `frontend/components/ui/AddToCartButton.tsx` (wire dispatch, add `productId`) |
| UPDATE | `frontend/components/ui/ProductCard.tsx` (pass `productId`) |
| UPDATE | `frontend/components/ui/PdpAddToCart.tsx` (wire dispatch, add `productId`) |
| UPDATE | `frontend/app/products/[id]/page.tsx` (ProductInfo passes `productId` to PdpAddToCart) |
| UPDATE | `frontend/components/layout/Header.tsx` (→ `/cart` link + count badge) |
| UPDATE | `frontend/app/providers.tsx` (bootstrap `fetchCartThunk` when authed) — or a small client effect |
| UPDATE | `frontend/lib/constants.ts` (`TAX_RATE`, `SHIPPING_FEE`) |
| MAYBE | `frontend/store/authThunk.ts` / logout flow (dispatch `clearCart` on logout) |

### Testing standards

Jest + jsdom + ts-jest, `@/` alias; `*.spec.tsx`/`*.test.tsx` colocated; `@testing-library/react` + `jest-dom` (set up in `jest.setup.ts`). Redux-connected units mock `react-redux` `useSelector`/`useDispatch` (see `hooks/useRequireAuth.test.tsx`); page tests mock child components and `next/navigation`. Mock `@/services/cartAPI` in thunk tests and `@/lib/toast` in button tests. **pnpm** (`pnpm test`, `pnpm lint`) — not npm. [Source: jest.config.ts, jest.setup.ts, hooks/useRequireAuth.test.tsx, components/Button.spec.tsx]

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-shopping-cart.md#Story 3.2] — acceptance criteria (authoritative); #Story 3.3 — the guest-cart/merge/OOS work explicitly deferred out of 3.2.
- [Source: _bmad-output/implementation-artifacts/3-1-cart-backend-entity-api-and-inventory-reserve.md] — the cart API contract (AC4 shape incl. the `line.id` fix logged 2026-06-30), error codes, scope split.
- [Source: backend/src/modules/cart/cart.controller.ts, cart.service.ts] — as-built routes (`@Controller('api/cart')`), `CartView`/`CartLine` shape, 400/404 semantics.
- [Source: frontend/store/authSlice.ts, authThunk.ts; frontend/services/authAPI.ts, api.ts] — the slice/thunk/service trio + cookie-JWT axios to mirror.
- [Source: frontend/hooks/useRequireAuth.ts; frontend/app/providers.tsx] — protected-route + bootstrap patterns.
- [Source: frontend/components/ui/AddToCartButton.tsx, PdpAddToCart.tsx, ProductCard.tsx; frontend/app/products/[id]/page.tsx] — the inert Add-to-Cart affordances to wire.
- [Source: frontend/components/layout/Header.tsx] — the shopping-bag icon to retarget + badge.
- [Source: frontend/components/Button.tsx; frontend/lib/helpers.ts (formatPrice); frontend/lib/toast.tsx; frontend/app/globals.css] — shared UI primitives + tokens.
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-ecommerce-2026-06-22/DESIGN.md, EXPERIENCE.md] — Oren visual + behavioral spec (cart surface, Add-to-Cart feedback, empty/error states, microcopy).
- [Source: _bmad-output/project-context/critical-implementation-rules.md] — Rule 5 (component naming), Rule 6 (Redux Thunk), Rule 10 (toast), Rule 11 (tests).
- [Source: memory: frontend-uses-pnpm, self-hosted-fonts-and-images, modal-scroll-lock] — pnpm discipline, no remote assets, scroll-lock note (if any overlay is added).

## Questions / Clarifications for the Team

1. **Logged-out add-to-cart (3.2 vs 3.3).** 3.2's cart API is JWT-only; the guest localStorage cart is 3.3. I've specced AC3 as "toast + redirect to `/login?return=…`". Confirm that's the desired bridge for 3.2, or should logged-out add-to-cart be disabled / hidden until 3.3 ships the guest cart? **Recommendation:** toast + redirect (keeps the affordance live and funnels to login).
2. **Shipping fee & tax in VND.** The epic says "flat $5 shipping, 10% tax" but the app displays **VND**. What is the actual flat shipping fee in đồng, and is tax 10% of subtotal? I'll put both in `lib/constants.ts`. **Recommendation:** team sets `SHIPPING_FEE` (VND) + `TAX_RATE = 0.10`; do not render a literal "$5".
3. **"Proceed to Checkout" with no checkout yet (Epic 4).** Should the button be (a) disabled with a "Checkout coming soon" tooltip, (b) route to a placeholder `/checkout`, or (c) hidden? **Recommendation:** (a) disabled with tooltip — visible intent, no dead route.
4. **Cart fetch trigger.** Bootstrap `fetchCartThunk()` inside `providers.tsx` `AuthBootstrap` (after `fetchMe`) vs. a dedicated effect keyed on `isAuthenticated`. **Recommendation:** in `AuthBootstrap` after auth is known, gated on `isAuthenticated`, so the Header badge is correct app-wide on first paint.

## Dev Agent Record

### Agent Model Used

_(to be filled by the dev agent)_

### Debug Log References

### Completion Notes List

### File List
