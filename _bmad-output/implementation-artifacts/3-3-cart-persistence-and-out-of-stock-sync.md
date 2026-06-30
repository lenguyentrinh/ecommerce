# Story 3.3: Cart Persistence & Out-of-Stock Sync

Status: ready-for-dev

## Story

As a shopper,
I want my cart to persist when I close the browser and to warn me if a product goes out of stock,
So that I never lose my selections or attempt to buy unavailable items.

> **Full-stack story** — backend (`POST /api/cart/merge` + `GET /api/products/:id` public read) + frontend (guest localStorage cart, merge-on-login, out-of-stock/low-stock warnings on the cart page). The existing `CartService.getCart` already returns `stockQuantity`/`isActive` so the UI can render warnings — no changes to `GET /api/cart` needed.
>
> Story 3.2 owns the **authenticated** cart page. 3.3 adds the **guest** (localStorage) cart path so unauthenticated shoppers can add items, and when they log in the cart is merged to the server. It also adds the OOS/low-stock warning UI on the cart page (both guest and auth paths). **No changes to AddToCartButton / PdpAddToCart** — they already toast + redirect to login for unauthenticated users (3.2 AC3). 3.3 changes the logged-out behaviour: instead of redirecting to login, store the item in localStorage.

## Acceptance Criteria

1. **Guest cart — add while logged out** — An unauthenticated shopper clicking "Add to Cart" stores the item in `localStorage` as `oren_cart: [{ productId: number, quantity: number }]` (append to existing array, incrementing quantity for duplicate `productId`). The Header cart-count badge increments to reflect the total units in localStorage. A toast "Added to cart!" appears (same 3.2 success toast). **No redirect to login.** No backend call for guest adds.

2. **Guest cart — view `/cart` while logged out** — When the shopper navigates to `/cart` while unauthenticated, the page reads `oren_cart` from localStorage, fetches product data from `GET /api/products/:id` (public, no auth), and renders the same `CartItemRow` / `CartSummary` / `EmptyCart` components that the authenticated path uses. The item count in the Header reflects the localStorage count. Money, image URLs, and quantity controls work identically to the auth path.

3. **Guest cart — merge on login** — When authentication completes (after `loginThunk.fulfilled`), the frontend reads `oren_cart` from localStorage; if non-empty, calls `POST /api/cart/merge { items: [{ productId, quantity }] }`. The backend merges each localStorage item into the server cart: duplicate `(userId, productId)` rows have their quantities summed (capped at `product.stockQuantity`). The backend returns the full updated `CartView`. On success, `oren_cart` is cleared from localStorage and the Redux cart is replaced from the merge response. On failure, the localStorage cart is preserved (retry on next login).

4. **Out-of-stock badge** — When `GET /api/cart` (or guest-fetched product data) returns a cart item where `product.stockQuantity === 0`, the `CartItemRow` shows a warning badge "Out of stock" in Oren alert color `#c4a896`. The item is still shown (not removed) but the +/– controls are hidden for that row.

5. **Checkout gated when OOS items present** — If any cart item has `stockQuantity === 0`, the "Proceed to Checkout" button in `CartSummary` is disabled with tooltip "Remove out-of-stock items before checking out." This applies to both guest and authenticated carts.

6. **Low stock warning** — When a product's `stockQuantity` is greater than 0 but less than the cart's quantity for that item, the quantity is automatically capped to `stockQuantity` and an inline note "Only X left in stock" appears below the row. The +/– controls enforce the new max. This applies at cart load time (backend already returns `stockQuantity`; the frontend applies the cap client-side).

7. **No regressions — tests green** — All existing cart flows (auth add/update/remove, cart page, Header badge) keep working. The new merge endpoint has unit + e2e coverage. The guest cart + OOS warnings have frontend tests. `pnpm test` and `pnpm lint` green on both sides.

## Tasks / Subtasks

### Backend

- [ ] **Task B1 — `POST /api/cart/merge` endpoint (AC: #3)**
  - [ ] Add `MergeCartDto` in `backend/src/modules/cart/dto/merge-cart.dto.ts` — `export default class MergeCartDto { @IsArray() @ValidateNested({ each: true }) @Type(() => MergeItem) items: MergeItem[] }` where `MergeItem { @IsInt() @IsPositive() productId: number; @IsInt() @IsPositive() quantity: number }`.
  - [ ] Add `mergeCart(userId, dto: MergeCartDto)` method to `CartService`: for each localStorage item, upsert a `CartItem` row for `(userId, productId)` where quantity = min(existing + new, product.stockQuantity). Return the full `CartView` via `this.getCart(userId)`. Inside a transaction for atomicity.
  - [ ] Add `@Post('merge')` route to `CartController`: JWT-guarded, returns `this.cartService.mergeCart(userId, dto)`.
  - [ ] `cart.module.ts` already exports `CartService` and imports `TypeOrmModule.forFeature([CartItem, Product])` — no module changes needed.
  - [ ] Test: `cart.service.spec.ts` — merge empty array, merge 2 items (one new, one existing → sum), merge beyond stock → capped, overwriting existing. `cart.controller.spec.ts` or e2e: `POST /api/cart/merge` returns `CartView`.

- [ ] **Task B2 — Ensure `GET /api/products/:id` is publicly accessible (AC: #2)**
  - [ ] Verify that the existing `GET /api/products/:id` route in `ProductsController` is **not** JWT-guarded (it is public for PDP SSR). If it's guarded, remove the guard. The guest cart needs to fetch product data without auth.

### Frontend — Guest Cart

- [ ] **Task F1 — Guest cart localStorage utilities (AC: #1, #2)**
  - [ ] Create `frontend/lib/guestCart.ts`:
    - `GUEST_CART_KEY = 'oren_cart'`
    - `getGuestCart(): GuestCartItem[]` — read + parse from localStorage, return `[]` if missing/invalid JSON
    - `setGuestCart(items: GuestCartItem[])` — write to localStorage
    - `addToGuestCart(productId: number, quantity: number)` — append/increment by productId, write back
    - `removeFromGuestCart(productId: number)` — remove by productId, write back
    - `updateGuestCartQuantity(productId: number, quantity: number)` — set quantity (0 = remove), write back
    - `clearGuestCart()` — `localStorage.removeItem(GUEST_CART_KEY)`
    - `getGuestCartCount(): number` — Σ item.quantity
    - Type: `GuestCartItem { productId: number; quantity: number }`
  - [ ] **No `lib/guestCart.spec.ts`** — pure functions, test them (Jest, no DOM needed).

- [ ] **Task F2 — Wire guest add-to-cart in `useAddToCart` (AC: #1)**
  - [ ] In `frontend/hooks/useAddToCart.ts`, when `!isAuthenticated`: instead of toast + redirect to login, call `addToGuestCart(productId, quantity)`, show the same success toast, return a status similar to the auth path. The status type stays `AddStatus = "idle" | "adding" | "added"` — guest adds are instant (no async), so the "adding" → "added" transition can be immediate.
  - [ ] The Header badge reads from both Redux (auth) and localStorage (guest). Add a `selectEffectiveCartCount` selector or compute it in the component by reading both sources.

- [ ] **Task F3 — Guest product fetch service (AC: #2)**
  - [ ] Create `frontend/services/productPublicAPI.ts` with `getProductById(id: number): Promise<CartLineProduct>` — calls the **public (no auth)** `GET /api/products/:id` via a plain `fetch` or the existing `productApi` service (which uses SSR-friendly fetch). The response shape is the product entity needed to build a `CartLine`.

- [ ] **Task F4 — Guest cart page renderer (AC: #2)**
  - [ ] Create `frontend/hooks/useGuestCart.ts` — hook that:
    - Reads `getGuestCart()` on mount
    - For each unique `productId`, calls `getProductById(id)` in parallel
    - Returns `{ items: GuestCartView, loading, error }` where `GuestCartView = { items: (CartLine)[], subtotal: number }`
    - Caches fetched products in a local ref to avoid refetch on re-render
  - [ ] Update `frontend/app/cart/page.tsx`:
    - When `!isAuthenticated && authChecked`: render the guest cart using `useGuestCart` hook output, feeding the same `CartItemRow`/`CartSummary`/`EmptyCart` components as the auth path.
    - `handleUpdateQuantity` for guest calls `updateGuestCartQuantity` + re-fetch product data (or recompute locally).
    - `handleRemove` for guest calls `removeFromGuestCart` + re-fetch.
  - [ ] The page currently gates on `useRequireAuth()` — **remove the redirect** for the guest path. Use `authChecked` to decide whether to show auth cart, guest cart, or loading state.

- [ ] **Task F5 — Cart merge on login (AC: #3)**
  - [ ] In `frontend/store/authThunk.ts`, after `loginThunk.fulfilled` dispatches and before the UI updates, add merge logic in `providers.tsx` or in a dedicated effect:
    - Listen for `isAuthenticated` transitioning `false → true`
    - If `getGuestCartCount() > 0`: call `POST /api/cart/merge` via a `mergeCartAPI` in `cartAPI.ts`, then `clearGuestCart()`, then `dispatch(fetchCartThunk())` to refresh from server.
    - If guest cart is empty: just `dispatch(fetchCartThunk())` as today.
  - [ ] Add `mergeCartAPI(items: GuestCartItem[]): Promise<CartView>` to `frontend/services/cartAPI.ts` — `api.post('/api/cart/merge', { items })`.
  - [ ] The merge should fire from `AuthBootstrap` in `providers.tsx` where `isAuthenticated` transitions. Add a `useRef` to detect the `false → true` edge.

### Frontend — Out-of-Stock / Low-Stock UI

- [ ] **Task F6 — Out-of-stock badge in CartItemRow (AC: #4)**
  - [ ] Update `frontend/components/cart/CartItemRow.tsx`:
    - When `product.stockQuantity === 0`: render a "Out of stock" badge (pill chip, text `text-label-sm`, bg `#c4a896` / text white or `#4a3f35`, positioned after the product name). Use the Oren `alert` token.
    - Hide the +/- controls and quantity display; show only the product info + remove button.
    - The item is still visible and removable — the shopper can remove OOS items.

- [ ] **Task F7 — Checkout gating for OOS items (AC: #5)**
  - [ ] Update `frontend/components/cart/CartSummary.tsx`:
    - Accept a `hasOutOfStock: boolean` prop.
    - When `hasOutOfStock`: disable the "Proceed to Checkout" button with `title="Remove out-of-stock items before checking out."`
  - [ ] Update `frontend/app/cart/page.tsx` to compute `hasOutOfStock` from `items.some(i => i.product.stockQuantity === 0)` and pass it to `CartSummary`.

- [ ] **Task F8 — Low stock cap + inline note (AC: #6)**
  - [ ] In `frontend/components/cart/CartItemRow.tsx`:
    - When `product.stockQuantity > 0 && line.quantity > product.stockQuantity`: cap the displayed quantity to `stockQuantity`, show an inline note "Only X left in stock" in warm-gray `text-label-sm` below the controls.
    - The + button max is `product.stockQuantity` (already enforced by `atMax`).
  - [ ] **Important:** the backend already caps the `PATCH` quantity to `product.stockQuantity` and returns 400 if exceeded. The frontend cap is a UX polish that prevents the 400 and informs the user.

- [ ] **Task F9 — Header badge reflects guest + auth (AC: #1, #2)**
  - [ ] Update `frontend/components/layout/Header.tsx`:
    - Read `selectCartCount` from Redux (auth) and `getGuestCartCount()` from localStorage.
    - Show the larger of the two (they should never overlap — guest cart is cleared on merge).
    - Use `useSyncExternalStore` or a simple `useState` + `useEffect` with a `storage` event listener to keep the badge in sync across tabs.

- [ ] **Task F10 — Tests (AC: #7)**
  - [ ] `lib/guestCart.spec.ts` — add/remove/update/getCount, handles invalid JSON, handles empty.
  - [ ] `hooks/useAddToCart.spec.tsx` — update mock to test guest path (localStorage write + no redirect).
  - [ ] `app/cart/page.test.tsx` — add test case for guest cart (unauthenticated + localStorage items).
  - [ ] `components/cart/CartItemRow.spec.tsx` — OOS badge renders when `stockQuantity === 0`, low-stock note renders when `quantity > stockQuantity`.
  - [ ] `components/cart/CartSummary.spec.tsx` — `hasOutOfStock` disables checkout button.
  - [ ] `services/cartAPI.spec.ts` — `mergeCartAPI` calls correct endpoint.
  - [ ] Backend: `cart.service.spec.ts` — merge test cases.
  - [ ] `pnpm test` and `pnpm lint` green on both backend and frontend.

## Dev Notes

### The cart contract — items returned even when OOS (already done in 3.1)

`GET /api/cart` returns items even where `stockQuantity === 0` or `isActive === false`, including `stockQuantity`/`isActive` in the response. The 3.3 OOS UI is why this contract exists. **No changes to `GET /api/cart`.**

### Guest cart architecture — localStorage only, no backend

Guest cart items are stored as `oren_cart: [{ productId, quantity }]` in localStorage. When the guest views `/cart`, the frontend fetches full product data from `GET /api/products/:id` (public, no auth). This means:
- `CartLine` shape is constructed client-side (no `id` field — guest rows don't exist in DB)
- Guest cart rows use `productId` as a synthetic key for the `.map()` rendering
- The +/– and remove operations mutate localStorage and re-fetch product data (or recompute from cached product data)
- The `subtotal` is computed client-side from fetched product prices × quantities
- The `imageUrl` is the read-time URL from the product response

### Merge endpoint — `POST /api/cart/merge`

New backend endpoint, JWT-guarded, one route added to the existing `CartController`. It accepts `{ items: [{ productId, quantity }] }` and upserts each into the server cart. For each item:
- If `(userId, productId)` row exists: `newQty = min(existing.qty + incoming.qty, product.stockQuantity)`
- If not: `newQty = min(incoming.qty, product.stockQuantity)`
- If `product.stockQuantity === 0` or product is inactive: skip that item (don't add OOS items to server cart)
- Runs inside a transaction
- Returns the full `CartView`

### `useAddToCart` — dual path (auth → API, guest → localStorage)

Current behaviour (3.2): `!isAuthenticated` → toast + redirect to `/login?return=...`.
New behaviour (3.3): `!isAuthenticated` → `addToGuestCart(productId, 1)` → toast "Added to cart!" → increment Header badge from localStorage count.

The button component (`AddToCartButton`, `PdpAddToCart`) calls `useAddToCart().addToCart(productId)` — no props change needed, just the hook implementation changes.

### Cart page — dual renderer

The `/cart` page currently gates on `useRequireAuth()` and shows loading while `!authChecked`. For 3.3:
- While `!authChecked`: show same loading state
- When `authChecked && isAuthenticated`: use existing Redux-driven auth cart (Task F4 in 3.2)
- When `authChecked && !isAuthenticated`: use new `useGuestCart` hook that reads localStorage + fetches product data
- The page layout, components (`CartItemRow`, `CartSummary`, `EmptyCart`), and styling are shared between both paths
- **Remove** the `useRequireAuth()` redirect — the guest path replaces it

### Out-of-stock badge — visual spec

The Oren alert color `#c4a896` is available in the Tailwind config as `alert`. The badge should be a pill chip:
- `bg-[#c4a896]` or use the `bg-alert` utility
- Text: `text-label-sm` (12px/600/0.08em), uppercase
- Positioned after the product name, inline or below
- For accessibility: `role="status"` and `aria-label="Out of stock"`
- The row keeps the remove (×) button so the shopper can dismiss OOS items

### Low stock — client-side cap

The backend already enforces `PATCH /api/cart/:itemId` qty ≤ `product.stockQuantity` (returns 400). The frontend cap prevents the 400 from ever needing to fire:
- On cart load: if `line.quantity > product.stockQuantity`, display the item with quantity = `stockQuantity` + inline note
- The + button already has `atMax = quantity >= product.stockQuantity` — no change needed
- For guest cart, the cap is applied at render time

### Checkout gating

`CartSummary` already accepts a `subtotal` prop. Add a `hasOutOfStock` prop. The existing disabled button is:
```tsx
<Button variant="primary" disabled title="Remove out-of-stock items before checking out.">
  Proceed to Checkout
</Button>
```
When `hasOutOfStock` is true, use `disabled` + `title`. The existing button is already disabled (waiting for Epic 4). The tooltip is additive.

### Merge trigger — where to hook in

In `providers.tsx` `AuthBootstrap`, the current effect:
```tsx
useEffect(() => {
  if (!authChecked) return;
  if (isAuthenticated) {
    dispatch(fetchCartThunk());
  } else {
    dispatch(clearCart());
  }
}, [authChecked, isAuthenticated, dispatch]);
```

Change to:
```tsx
useEffect(() => {
  if (!authChecked) return;
  if (isAuthenticated) {
    const guestItems = getGuestCart();
    if (guestItems.length > 0) {
      mergeCartAPI(guestItems).then(() => {
        clearGuestCart();
        dispatch(fetchCartThunk());
      }).catch(() => {
        // merge failed — keep localStorage, just load server cart as fallback
        dispatch(fetchCartThunk());
      });
    } else {
      dispatch(fetchCartThunk());
    }
  } else {
    dispatch(clearCart());
  }
}, [authChecked, isAuthenticated, dispatch]);
```

Use a `useRef` to track the previous `isAuthenticated` value to only fire on `false → true` transition (not on initial mount if already authenticated).

### Scope boundaries — what is NOT in this story

- **No guest checkout.** All checkout requires authentication (PRD assumption). The guest path here is only for cart persistence.
- **No stock decrement on cart-add.** Stock is decremented on order confirmation (Epic 4). Cart only validates against `product.stockQuantity`.
- **No inventory reserve for guest carts.** The `inventory_reserves` table is populated during checkout (Epic 4), not at cart-add time. Guest cart items have no server-side reservation.
- **No infinite scroll / pagination on cart.** The cart is always a full-item list.
- **No cart expiry for guest carts.** Guest carts persist indefinitely in localStorage until merged or cleared. No TTL.
- **No `/api/cart/clear`.** The guest cart is cleared client-side after merge. No backend clear endpoint exists.

### Established patterns to copy

- **Backend DTO:** `export default class`, class-validator, `@Type(() => Number)` — mirror `merge-cart.dto.ts` off `add-cart-item.dto.ts`.
- **Backend service method in transaction:** mirror `CartService.addItem` — same `DataSource.createQueryRunner()` pattern.
- **Frontend localStorage pattern:** the codebase doesn't use localStorage yet. Use plain `window.localStorage.getItem/setItem/removeItem` with try/catch (SSR safety — `typeof window !== 'undefined'` guard).
- **Frontend thunk/Slice:** existing `cartThunk`/`cartSlice` patterns — add `mergeCartThunk` if needed, or call `mergeCartAPI` directly from `providers.tsx` for simplicity.
- **Test style (frontend):** jest + jsdom, mock `localStorage` via `Object.defineProperty(window, 'localStorage', { value: mockStore })` in test setup, spy on `getItem`/`setItem`.

### File Locations Reference

| Action | Path |
|---|---|
| NEW | `backend/src/modules/cart/dto/merge-cart.dto.ts` |
| UPDATE | `backend/src/modules/cart/cart.service.ts` (add `mergeCart`) |
| UPDATE | `backend/src/modules/cart/cart.controller.ts` (add `@Post('merge')`) |
| UPDATE | `backend/src/modules/cart/cart.service.spec.ts` (merge tests) |
| NEW | `frontend/lib/guestCart.ts` |
| NEW | `frontend/lib/guestCart.spec.ts` |
| UPDATE | `frontend/hooks/useAddToCart.ts` (guest path for `!isAuthenticated`) |
| NEW | `frontend/services/productPublicAPI.ts` (or reuse existing) |
| NEW | `frontend/hooks/useGuestCart.ts` |
| UPDATE | `frontend/services/cartAPI.ts` (add `mergeCartAPI`) |
| UPDATE | `frontend/app/providers.tsx` (merge trigger on login) |
| UPDATE | `frontend/app/cart/page.tsx` (dual auth/guest render, remove `useRequireAuth`) |
| UPDATE | `frontend/components/cart/CartItemRow.tsx` (OOS badge, low-stock note) |
| UPDATE | `frontend/components/cart/CartSummary.tsx` (hasOutOfStock prop) |
| UPDATE | `frontend/components/layout/Header.tsx` (guest badge count) |
| UPDATE | `frontend/store/cartSlice.ts` (add `selectEffectiveCartCount` or similar) |
| NEW | `frontend/components/cart/CartItemRow.spec.tsx` (or update existing) |
| NEW | `frontend/components/cart/CartSummary.spec.tsx` (or update existing) |
| NEW | `frontend/hooks/useAddToCart.spec.tsx` (update for guest path) |
| UPDATE | `frontend/app/cart/page.test.tsx` (guest cart test case) |

### Testing standards

- **Backend:** Jest, `*.spec.ts`, mock `@InjectRepository` via `getRepositoryToken`, mock `DataSource`/`queryRunner`. `pnpm test` (backend is pnpm-managed).
- **Frontend:** Jest + jsdom + ts-jest, `@/` alias, `@testing-library/react`, `jest-dom`. Mock localStorage in setup. `pnpm test` (frontend is pnpm-managed).
- **lint:** `pnpm lint` on both sides.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-shopping-cart.md#Story 3.3] — authoritative acceptance criteria.
- [Source: _bmad-output/implementation-artifacts/3-2-cart-ui-add-to-cart-and-cart-page.md] — existing authenticated cart UI, `useAddToCart` hook, `providers.tsx` AuthBootstrap pattern.
- [Source: _bmad-output/implementation-artifacts/3-1-cart-backend-entity-api-and-inventory-reserve.md] — cart API contract, `CartService.getCart` returns `stockQuantity`/`isActive` for OOS sync.
- [Source: frontend/store/cartSlice.ts] — existing cart Redux state.
- [Source: frontend/hooks/useAddToCart.ts] — hook to modify for guest add-to-cart.
- [Source: frontend/app/providers.tsx] — AuthBootstrap where merge trigger goes.
- [Source: frontend/components/cart/CartItemRow.tsx] — component to add OOS badge + low-stock cap.
- [Source: frontend/components/cart/CartSummary.tsx] — component to add hasOutOfStock prop.
- [Source: frontend/components/layout/Header.tsx] — component to show guest cart count.
- [Source: frontend/app/cart/page.tsx] — page to dual-render guest + auth.
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-ecommerce-2026-06-22/DESIGN.md] — Oren design tokens (alert `#c4a896`, typography).
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-ecommerce-2026-06-22/EXPERIENCE.md] — empty cart state, add-to-cart feedback patterns.
- [Source: _bmad-output/project-context/critical-implementation-rules.md] — Rule 5 (component naming), Rule 6 (Redux Thunk), Rule 10 (toast), Rule 11 (tests).

## Questions / Clarifications for the Team

1. **Guest cart merge failure.** If `POST /api/cart/merge` fails (network error, server error), the guest cart is preserved in localStorage and the server cart is fetched as fallback. The user will see only their old server cart items. Is this acceptable, or should we retry the merge?

2. **Product fetch for guest cart — caching.** `GET /api/products/:id` is called for each unique `productId` in the guest cart. For a cart with ~5 items this is 5 parallel requests — acceptable. For larger carts we may want to batch. Do we add a `GET /api/products?ids=1,2,3` batch endpoint or keep per-item fetches for MVP?

3. **OOS items in cart — subtotal.** Currently `subtotal` sums all items (including OOS). The epic only mentions disabling checkout. Should OOS items be excluded from the subtotal, or keep summing all and let the UI handle it?

4. **Merge endpoint — quantity cap.** When merging, existing + incoming quantity is capped at `stockQuantity`. Should the cap be at `product.stockQuantity` or some percentage (e.g. 95% to leave buffer for other shoppers)?

## Dev Agent Record

### Agent Model Used

deepseek-v4-flash-free (Felix — frontend dev agent) + deepseek-v4-flash-free (Bruno — backend dev agent)

### Debug Log References

### Completion Notes List

### File List
