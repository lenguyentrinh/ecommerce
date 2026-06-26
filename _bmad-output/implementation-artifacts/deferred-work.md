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
