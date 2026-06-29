# Deferred Work

## Deferred from: code review of 1-1-oren-design-system-foundation (2026-06-23)

- **Header/Footer color mismatch** — Header uses `bg-white`, Footer uses `bg-slate-50 border-slate-200`, which clash visually with the new warm-ivory system. Out of scope for Story 1.1 per story notes; revisit when design system rollout covers layout components.
- **Semantic color token contrast** — `--color-success`, `--color-alert`, and `--color-error` are all desaturated warm neutrals with no perceptible hue difference. Risks WCAG 1.4.1 failure for color-only feedback. Color palette is owned by UX design artifacts; flag to UX for next design iteration.
- **`body` background-color transition initial flash** — `transition-property: background-color` on `html, body` may cause a brief animated flash from browser default white to `#faf7f2` on first paint. Cosmetic issue; address if visible in user testing.
- **jest.config.ts missing CSS module transform** — No `moduleNameMapper` entry for `.css` files. Currently latent (component specs don't import CSS). Will throw `SyntaxError` if any integration test renders `layout.tsx` or imports a CSS file directly. Add a `moduleNameMapper` entry for `.css` → `identity-obj-proxy` before writing integration tests.

## Deferred from: code review of 1-2-user-role-extension-and-rate-limiting (2026-06-24)

- **`/me` response omits `role` field** — `auth.controller.ts:52-61` returns no `role` in the me endpoint response. Optional per story dev notes; revisit when frontend needs role-gating for UI display.
- **`resetPassword` does not validate reset token** — `auth.service.ts` accepts email alone and resets the password without checking `resetPasswordToken` or `resetPasswordExpired`. Critical pre-existing security bug; tackle as a dedicated security story before production.
- **Fresh DB migration ordering** — `1782206839023-AddRoleToUsers.ts` has no guard for a missing `users` table (fresh schema). A baseline migration creating the `users` table is needed. Affects greenfield deployment only.
- **Per-account brute-force protection absent** — ThrottlerGuard is per-IP only. Distributed attackers cycling IPs face no per-account lockout. Out of scope for Story 1.2 (spec explicitly requires per-IP); address in a dedicated security hardening story.
- **`migrationsRun: false` requires manual deployment step** — App will not auto-apply migrations on start. Must be documented in deployment runbook and/or CI pipeline as an explicit `migration:run` step before each release.
- **ThrottlerGuard proxy trust not confirmed** — If app runs behind a reverse proxy, swap to `ThrottlerBehindProxyGuard` and add `app.set('trust proxy', 1)` in `main.ts`. Deferred: deployment infrastructure not yet decided.
- **Role table vs enum column (architectural)** — Current implementation uses `ENUM('customer','admin')` on `users` table per Story 1.2 spec. A separate `roles` table would support dynamic roles, multiple roles per user, and role metadata without migrations. Revisit when either multiple roles per user or dynamic role creation becomes a requirement.

## Deferred from: code review of 1-4-user-login-and-frontend-auth-state (2026-06-26)

- **Login succeeds but `meAPI` fails → UI shows "Invalid email or password."** — `loginThunk` (in the pre-existing `authThunk.ts`, out of scope for 1.4) sets the auth cookie via `loginAPI`, then awaits `meAPI()`; a transient failure on the second call rejects the whole thunk, so the user is authenticated server-side but told their credentials are wrong (a refresh would silently log them in). Revisit alongside the auth-thunk error model.
- **Transient `fetchMeThunk` failure redirects logged-in users to /login** — `fetchMeThunk.rejected` (`authSlice.ts:99-104`) sets `isAuthenticated=false`/`authChecked=true` for ANY failure, including network/500, so `useRequireAuth` bounces a genuinely-authenticated user to the login page during a backend blip. Acceptable for MVP (treat all `/me` failures as unauthenticated); refine to distinguish 401 from transient errors.
- **`useRequireAuth` return URL drops the query string** — `usePathname()` excludes search params, so redirecting an unauthenticated user away from e.g. `/product?id=5&sort=price` loses the query. No protected page with query params exists yet (first consumer is `/account` in Story 1.5); add `useSearchParams`/`window.location.search` when one does.
- **`useRequireAuth` loading-state contract not enforced** — The hook returns `{ isAuthenticated, authChecked }` and relies on callers to render a loading state until `authChecked` is true; with no consumer in this story it is undemonstrated. Verify the first consumer (Story 1.5 `/account`) gates on `authChecked` to avoid flashing protected content.

## Deferred from: code review of 1-5-account-profile-and-shipping-address-management (2026-06-26)

- **Edit-form stale-row cross-tab race** — `AddressForm.tsx` opens edit by calling `getAddressesAPI()` and `list.find(id)`. If the address was deleted in another tab/session between list render and edit-open, `find` returns undefined, the form stays blank, and a submit 404s with a generic toast. Rare cross-session UX edge; address if it surfaces in testing.

## Deferred from: code review of 2-3-product-detail-page (2026-06-29)

- **Mixed currency on the PDP info panel** — product prices render in VND (e.g. `189.000 ₫` via `formatPrice`), but the trust line hardcodes "Free shipping over **$150**". Kept as decorative copy for this frontend story (story Question #2). Revisit alongside the deferred VND-magnitude re-seed so the threshold matches the displayed currency. [frontend/components/ui/ProductInfo.tsx]

## Deferred from: code review of 2-4-search-bar-and-filter-sort-ui (2026-06-29)

- **Search result count tracks first page only** — "Showing X of Y results" sets X = the SSR first-page count (≤ limit); it does not grow as infinite scroll appends more. Accepted MVP (story Question #3). To make X track the live count it must observe `ProductGrid` state (lift the count or have the grid report it). [frontend/app/search/page.tsx]

## Deferred from: code review of 1-5-account-profile-and-shipping-address-management-frontend (2026-06-29)

- **Deleting the default address doesn't re-promote another (backend)** — `backend/src/modules/users/user.service.ts removeAddress` deletes the row without promoting another address to default, leaving the account with no default address. Belongs to the 1-5 backend split story. The frontend mitigates by re-fetching the list after deleting a default so the UI is truthful, but the data-model invariant ("one default when ≥1 address exists") needs the backend fix. [backend/src/modules/users/user.service.ts]
