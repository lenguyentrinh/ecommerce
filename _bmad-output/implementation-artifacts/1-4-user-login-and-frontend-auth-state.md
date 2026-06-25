# Story 1.4: User Login & Frontend Auth State

---
baseline_commit: c773f93
---

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to log in with my email and password and stay signed in across page visits,
So that I don't have to re-authenticate every time I return to the store.

## Acceptance Criteria

**AC1 — Login page renders with Oren design**
Given the shopper navigates to `/login`,
When the page renders,
Then Email and Password fields appear using `<InputField>` Oren styling; a primary pill "Sign In" button is present; a "Forgot password?" link is visible; the page uses the Oren palette (Soft Ivory background, Warm White card, ambient shadow, Nunito Sans typography).

**AC2 — Successful login authenticates and redirects**
Given the shopper submits valid credentials for a verified account,
When `POST /api/auth/login` succeeds,
Then auth is established per the existing `loginThunk` (httpOnly cookie) pattern; Redux `authSlice` sets `isAuthenticated: true` and `user: { id, email, userName, role }`; the shopper is redirected to the home page (or the `return` URL if present); a toast "Welcome back!" appears.

**AC3 — Invalid credentials / unverified email show inline error**
Given the shopper submits wrong credentials or an unverified email,
When the API returns 401,
Then the password field clears; an inline error shows "Invalid email or password." (for `Invalid credentials`) or "Please verify your email first." (for `Email not verified`); the form stays on `/login` and no success toast appears.

**AC4 — Auth state hydrates; expired session redirects with return URL**
Given a logged-in user visits a protected page,
When the page loads,
Then auth state is hydrated from the session cookie via `fetchMeThunk`; while hydration is pending the guard does not prematurely redirect; if the session is missing/expired the user is redirected to `/login?return=<current-path>`.

**AC5 — Sign Out clears auth and redirects home**
Given the shopper clicks "Sign Out",
When the action completes,
Then `POST /api/auth/logout` is called; Redux auth state resets to initial (`isAuthenticated: false`, `user: null`); the shopper is redirected to `/`.

## Tasks / Subtasks

- [x] **Task 1: Fix `authSlice` to handle hydration & logout** (AC2, AC4, AC5)
  - [x] Add `extraReducers` cases for `fetchMeThunk`: `.pending` → `meLoading = true`; `.fulfilled` → `meLoading = false`, `isAuthenticated = true`, `user = action.payload`, `authChecked = true`; `.rejected` → `meLoading = false`, `isAuthenticated = false`, `user = null`, `authChecked = true`
  - [x] Add `authChecked: boolean` to `AuthState` (initial `false`) — lets route guards wait for hydration before deciding
  - [x] Add `extraReducers` cases for `logoutThunk.fulfilled` → reset `isAuthenticated = false`, `user = null`
  - [x] Do NOT remove the existing synchronous `logout`/`setAuth` reducers (keep for backward compat)
  - [x] Import `fetchMeThunk` and `logoutThunk` (already exported from `authThunk.ts`) into the slice

- [x] **Task 2: Restyle Login page to Oren design system** (AC1)
  - [x] Update `frontend/app/(auth)/login/page.tsx` — Soft Ivory bg, centered Warm White `max-w-md` card with ambient shadow, Headline MD title (e.g. "Welcome back"); use `next/link` for the "Sign up" link (no raw `<a href>`)
  - [x] Remove the non-functional "Or login with" Facebook/Google social buttons — no OAuth backend exists and they are not in any AC (precedent: Story 1.3 removed out-of-AC UI). Drop the unused `react-icons` imports.
  - [x] Remove the old `bg-login` / `bg-white` classes in favor of Oren tokens (`bg-ivory`, `bg-surface`)

- [x] **Task 3: Restyle & rewire LoginForm** (AC1, AC2, AC3)
  - [x] Update `frontend/app/(auth)/login/LoginForm.tsx` — replace `TextInput` with `InputField`; replace the raw green `<button>` with `<Button>` (label "Sign In", disabled+`loginLoading` text "Signing in...")
  - [x] Use `register` spread on `InputField` (forwardRef — no `Controller`); email pattern + password `required` validators via react-hook-form (`mode: 'onTouched'`)
  - [x] "Forgot password?" link → `next/link` to `/forgotPassword` (existing route), styled `text-warm-gray hover:text-brown`
  - [x] On success: `showToast.success('Welcome back!')`, then redirect to `return` param if present else `/`
  - [x] On error (`loginThunk` rejects with the message string): clear the password field (`resetField('password')` or `setValue('password','')`); `setError('password', { message })` where message = `'Please verify your email first.'` if `err === 'Email not verified'`, else `'Invalid email or password.'`; do NOT show an error toast for 401
  - [x] Read `return` via `useSearchParams().get('return')`; guard against open-redirect by only honoring values starting with `/`

- [x] **Task 4: Create reusable auth guard hook for protected pages** (AC4)
  - [x] Create `frontend/hooks/useRequireAuth.ts` (`'use client'`): selects `{ isAuthenticated, authChecked }`; in `useEffect`, when `authChecked && !isAuthenticated` → `router.replace('/login?return=' + encodeURIComponent(pathname))`
  - [x] Return `{ isAuthenticated, authChecked }` so pages can render a loading state until `authChecked` is true
  - [x] NOTE: the `/account` page itself is **out of scope** (Story 1.5). This task only builds the hook + hydration so 1.5 can consume it. Do not create `/account`.

- [x] **Task 5: Fix Sign Out redirect target** (AC5)
  - [x] In `frontend/components/layout/Header.tsx`, change `handleLogout` redirect from `router.replace('/login')` to `router.replace('/')` per AC5
  - [x] Confirm logout now resets Redux state (works once Task 1 adds the `logoutThunk.fulfilled` reducer)
  - [x] Full Oren restyle of the Header chrome is OUT of scope (global component, not in any 1.4 AC) — leave styling as-is aside from any change needed to make sign-out correct

- [x] **Task 6: Write tests** (all ACs)
  - [x] `frontend/app/(auth)/login/LoginForm.test.tsx` — renders Email/Password/`Sign In` (AC1); success path calls `loginThunk`, shows "Welcome back!" toast, redirects (AC2); `Invalid credentials` → inline "Invalid email or password." + password cleared, no toast (AC3); `Email not verified` → inline "Please verify your email first." (AC3); honors `?return=`
  - [x] `frontend/store/authSlice.test.ts` — `fetchMeThunk.fulfilled` sets user+isAuthenticated+authChecked; `.rejected` clears+sets authChecked; `logoutThunk.fulfilled` resets state (AC2/AC4/AC5)
  - [x] `frontend/hooks/useRequireAuth.test.tsx` — redirects to `/login?return=...` when `authChecked && !isAuthenticated`; does NOT redirect while `authChecked === false` (AC4)

## Dev Notes

### This is primarily a Frontend Restyle + Gap-Fill Story — No Backend Changes

All backend endpoints already exist and work. The login/auth *plumbing* is mostly wired already; this story restyles the UI to Oren and fixes two real state-management gaps.

| Endpoint | Method | Behavior |
|---|---|---|
| `/api/auth/login` | POST | Sets httpOnly cookie; returns `{ message: 'Login successful' }` (NO token in body) |
| `/api/auth/me` | GET | Returns `{ id, email, userName, role }` from the cookie session |
| `/api/auth/logout` | POST | Clears the cookie; returns `{ message }` |

### CRITICAL: Auth is Cookie-Based — Do NOT Store a JWT Client-Side

The epic text says "the token is stored" / "hydrated from stored token" — this is **figurative**. Reality:
- `frontend/services/api.ts` axios client uses `withCredentials: true`; the JWT lives in an **httpOnly cookie** set by the backend.
- There is nothing to put in `localStorage`/`sessionStorage`. Do not add token storage.
- "Hydrate auth state" = dispatch `fetchMeThunk()` (already done on mount in `providers.tsx` `AuthBootstrap`) and store the result in Redux.

### THE TWO BUGS TO FIX (Task 1) — Highest Priority

`frontend/store/authThunk.ts` already defines `fetchMeThunk` and `logoutThunk`, and `providers.tsx`/`Header.tsx` already dispatch them — **but `authSlice.ts` has no `extraReducers` for either**, so:
1. `AuthBootstrap` calls `fetchMeThunk()` on every load, but the user is **never stored** → returning users appear logged out until they log in again. (Breaks AC4.)
2. `Header` Sign Out calls `logoutThunk()`, but Redux state is **never reset** → UI still shows the user as logged in. (Breaks AC5.)

Current `authSlice.ts` only handles `signupThunk`, `loginThunk`, `verifyEmailThunk`. Add the missing cases exactly as in Task 1.

### What Already Works (do not reinvent)

- `loginThunk` (in `authThunk.ts`) already does `loginAPI(data)` → then `meAPI()` → returns `{ message, user }`. On `loginThunk.fulfilled` the slice already sets `isAuthenticated`/`user`. **AC2's Redux wiring is done** — you only restyle the form + change the toast to "Welcome back!" + add `return`-URL redirect.
- `loginThunk.rejected` already clears auth state.
- `AuthBootstrap` in `providers.tsx` already dispatches `fetchMeThunk()` once on app mount — keep it; Task 1 makes it actually populate state.

### AC3 — Backend 401 Messages (exact strings)

From `backend/src/modules/auth/auth.service.ts`:
- User not found → `UnauthorizedException('Invalid credentials')`
- Password mismatch → `UnauthorizedException('Invalid credentials')`
- Email not verified → `UnauthorizedException('Email not verified')`

The message reaches the form as the `rejectWithValue` string (`err.response?.data?.message`). Discriminate:

```tsx
const onSubmit = async (data: FormData) => {
  try {
    await dispatch(loginThunk(data)).unwrap();
    showToast.success('Welcome back!');
    router.push(safeReturn);            // see return-URL note
  } catch (err) {
    resetField('password');            // AC3: clear password
    const message =
      err === 'Email not verified'
        ? 'Please verify your email first.'
        : 'Invalid email or password.';
    setError('password', { message }); // inline, NOT a toast
  }
};
```

### Return-URL Handling (AC2 + AC4)

`useRequireAuth` redirects unauthenticated users to `/login?return=<path>`. LoginForm must honor it after a successful login, with an open-redirect guard:

```tsx
const returnParam = useSearchParams().get('return');
const safeReturn = returnParam && returnParam.startsWith('/') ? returnParam : '/';
```

Only accept paths beginning with `/` (reject `//evil.com`, `https://…`).

### useRequireAuth — Pattern

```tsx
// frontend/hooks/useRequireAuth.ts
'use client';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { usePathname, useRouter } from 'next/navigation';
import { RootState } from '@/store/store';

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, authChecked } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.replace(`/login?return=${encodeURIComponent(pathname)}`);
    }
  }, [authChecked, isAuthenticated, pathname, router]);

  return { isAuthenticated, authChecked };
}
```

`authChecked` (added in Task 1) prevents a flash-redirect before `fetchMeThunk` resolves on first load.

### Oren Page Layout for Login (match Story 1.3 auth-card pattern)

```tsx
// login/page.tsx — Server Component wrapper (no hooks)
import Link from 'next/link';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-sm">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-ambient p-md">
        <h1 className="text-headline-md text-brown text-center mb-md tracking-[0.03em]">
          Welcome back
        </h1>
        <LoginForm />
        <p className="text-center text-body-md text-warm-gray mt-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-brown underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
```

`max-w-md` (448px) for auth cards. LoginForm must be wrapped in `<Suspense>` only if it reads search params at the page level — since `useSearchParams()` is used inside the Client Component `LoginForm`, wrap the form usage in a `<Suspense>` boundary to satisfy Next.js (mirrors Story 1.3 verify-email page which used `Suspense`).

### LoginForm — Implementation Pattern

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import InputField from '@/components/InputField';
import Button from '@/components/Button';
import { AppDispatch, RootState } from '@/store/store';
import { loginThunk } from '@/store/authThunk';
import { showToast } from '@/lib/toast';

type FormData = { email: string; password: string };

export default function LoginForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const returnParam = useSearchParams().get('return');
  const safeReturn = returnParam && returnParam.startsWith('/') ? returnParam : '/';
  const { loginLoading } = useSelector((s: RootState) => s.auth);

  const { register, handleSubmit, setError, resetField, formState: { errors } } =
    useForm<FormData>({ mode: 'onTouched' });

  const onSubmit = async (data: FormData) => {
    try {
      await dispatch(loginThunk(data)).unwrap();
      showToast.success('Welcome back!');
      router.push(safeReturn);
    } catch (err) {
      resetField('password');
      const message =
        err === 'Email not verified'
          ? 'Please verify your email first.'
          : 'Invalid email or password.';
      setError('password', { message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-sm">
      <InputField
        {...register('email', {
          required: 'Email is required',
          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
        })}
        label="Email" type="email" placeholder="you@example.com"
        error={errors.email?.message}
      />
      <InputField
        {...register('password', { required: 'Password is required' })}
        label="Password" type="password" placeholder="Your password"
        error={errors.password?.message}
      />
      <div className="text-right">
        <Link href="/forgotPassword" className="text-body-md text-warm-gray hover:text-brown underline transition-colors duration-300">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" disabled={loginLoading} className="w-full mt-xs">
        {loginLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
```

### authSlice — Required Additions (Task 1)

```ts
// add to imports (already exported from authThunk.ts)
import { fetchMeThunk, logoutThunk /* ...existing */ } from './authThunk';

// AuthState: add
authChecked: boolean; // initial: false

// extraReducers: add
.addCase(fetchMeThunk.pending, (state) => { state.meLoading = true; })
.addCase(fetchMeThunk.fulfilled, (state, action) => {
  state.meLoading = false;
  state.isAuthenticated = true;
  state.user = action.payload;
  state.authChecked = true;
})
.addCase(fetchMeThunk.rejected, (state) => {
  state.meLoading = false;
  state.isAuthenticated = false;
  state.user = null;
  state.authChecked = true;
})
.addCase(logoutThunk.fulfilled, (state) => {
  state.isAuthenticated = false;
  state.user = null;
})
```

Note: `User` type in the slice is `{ id, email, userName, role }` and `meAPI`/`MeResponse` returns exactly that shape — `fetchMeThunk.fulfilled` payload is assignable directly.

### Oren Token Class Reference

| Token | Tailwind Class | Value |
|---|---|---|
| Soft Ivory background | `bg-ivory` | `#faf7f2` |
| Warm White surface | `bg-surface` | `#fff8f4` |
| Primary text | `text-brown` | `#4a3f35` |
| Secondary text | `text-warm-gray` | `#787770` |
| Inline error text | `text-error` | `#b8998a` (via `InputField` `error` prop) |
| Ambient shadow | `shadow-ambient` | `0 8px 40px rgba(74,63,53,0.04)` |
| Headline MD | `text-headline-md` | 24px / 600 / 1.3 |
| Body MD | `text-body-md` | 16px / 400 / 1.5 |
| Label SM | `text-label-sm` | 12px / 600 / uppercase |
| Padding MD / SM | `p-md` / `p-sm` | 24px / 16px |
| Gap SM / XS | `gap-sm` / `gap-xs` | 16px / 8px |
| Margin top XS / SM | `mt-xs` / `mt-sm` | 8px / 16px |

### File Locations Reference

| Action | File Path |
|---|---|
| UPDATE | `frontend/store/authSlice.ts` (add fetchMe/logout reducers + `authChecked`) |
| UPDATE | `frontend/app/(auth)/login/page.tsx` (Oren restyle, remove social buttons, Suspense) |
| UPDATE | `frontend/app/(auth)/login/LoginForm.tsx` (InputField/Button, AC3 errors, return URL) |
| UPDATE | `frontend/components/layout/Header.tsx` (logout redirect → `/`) |
| NEW | `frontend/hooks/useRequireAuth.ts` |
| NEW | `frontend/app/(auth)/login/LoginForm.test.tsx` |
| NEW | `frontend/store/authSlice.test.ts` |
| NEW | `frontend/hooks/useRequireAuth.test.tsx` |

### Do NOT Touch

- `frontend/store/authThunk.ts` — `loginThunk`, `fetchMeThunk`, `logoutThunk` all already exist and are correct
- `frontend/services/authAPI.ts` / `frontend/services/api.ts` — `loginAPI`, `meAPI`, `logoutAPI`, axios client all wired
- `frontend/app/providers.tsx` — `AuthBootstrap` already dispatches `fetchMeThunk` on mount; leave as-is
- `frontend/components/InputField.tsx`, `frontend/components/Button.tsx` — use as-is
- `frontend/components/inputs/TextInput.tsx` — old, non-Oren; do NOT use it in new code

### Out of Scope (future stories)

- `/account` page and its protection — Story 1.5 (this story only builds `useRequireAuth` + hydration it will consume)
- Header `/my-account` dropdown link still points at `/my-account`; Story 1.5 introduces `/account`. Do not change routing here unless an AC requires it.
- Social login (Facebook/Google) — no OAuth backend; removed, not deferred.

### Testing Pattern (from Story 1.3 learnings)

- **pnpm only** — never `npm install`
- **Single quotes + trailing commas** — Prettier enforced on all `.ts`/`.tsx`
- **Jest 30** — test filter flag is `--testPathPatterns` (plural)
- **No CSS imports in tests** — `jest.config.ts` has no CSS transform
- Mock `next/navigation` (`useRouter`, `useSearchParams`, `usePathname`) and `@/store/authThunk` at module level; wrap components in `<Provider store={store}>`
- For `react-redux`, use `jest.mock('react-redux', () => ({ ...jest.requireActual('react-redux'), ... }))` — direct `jest.spyOn` on ESM `useDispatch` throws "Cannot redefine property"
- Use `resetAllMocks()` (not `clearAllMocks()`) when a test needs implementations reset between cases
- Auth forms are Client Components (Architecture D15); no `generateMetadata()` needed

```tsx
// LoginForm.test.tsx skeleton
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
  usePathname: () => '/login',
}));
jest.mock('@/store/authThunk', () => ({
  loginThunk: jest.fn(() => ({ type: 'auth/login', unwrap: jest.fn() })),
}));
```

### Project Structure Notes

- New `frontend/hooks/` directory is consistent with Next.js/React conventions; no conflict with existing structure (`store/`, `services/`, `components/`, `lib/`).
- Redux slice/thunk naming (`authSlice.ts`, `authThunk.ts`) matches architecture rule "Redux slices: `{feature}Slice.ts`, thunks: `{feature}Thunk.ts`". [Source: planning-artifacts/architecture/implementation-patterns-consistency-rules.md#Code Naming]
- Auth forms as Client Components matches D15 SSR/CSR boundary. [Source: planning-artifacts/architecture/core-architectural-decisions.md#Frontend Architecture]

### References

- [Source: planning-artifacts/epics/epic-1-design-system-user-authentication.md#Story 1.4] — acceptance criteria
- [Source: planning-artifacts/architecture/core-architectural-decisions.md#Authentication & Security] — single access token, `JWT_EXPIRES_IN=1d`, no refresh tokens
- [Source: planning-artifacts/architecture/core-architectural-decisions.md#Frontend Architecture] — auth forms are Client Components
- [Source: implementation-artifacts/1-3-user-registration-and-email-verification-pages.md] — Oren auth-card pattern, InputField/Button usage, testing patterns
- [Source: backend/src/modules/auth/auth.service.ts] — 401 messages `Invalid credentials` / `Email not verified`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m]

### Debug Log References

- `pnpm jest` → 8 suites / 44 tests pass (was 27; +17: 8 authSlice, 6 LoginForm, 3 useRequireAuth). Zero regressions.
- `pnpm exec eslint` on the 3 new/edited source files (`login/page.tsx`, `login/LoginForm.tsx`, `hooks/useRequireAuth.ts`, `store/authSlice.ts`) → clean (exit 0).
- Pre-existing repo lint/tsc issues NOT introduced by this story and left as-is (out of scope): `store/authThunk.ts` `no-explicit-any` (×7), `components/layout/Header.tsx:59` `react-hooks/set-state-in-effect` (effect unchanged at HEAD — confirmed via `git show`), and the `(x as jest.Mock)` test-mock cast pattern shared with the existing Story 1.3 test files. The configured `pnpm test` gate is green.

### Completion Notes List

- **Task 1 (authSlice fix — the two core bugs):** Added `extraReducers` for `fetchMeThunk` (pending→`meLoading`; fulfilled→set `user`/`isAuthenticated`/`authChecked`; rejected→clear + `authChecked`) and `logoutThunk.fulfilled` (reset auth). Added `authChecked: boolean` (initial `false`) to `AuthState` so guards wait for hydration. This makes the already-wired `AuthBootstrap` (hydration) and `Header` Sign Out actually update Redux state. Kept the synchronous `logout`/`setAuth` reducers. Removed 3 genuinely-unused thunk imports while editing the file.
- **Task 2 (Login page Oren restyle):** Rewrote `login/page.tsx` to Soft Ivory bg + Warm White `max-w-md` card + ambient shadow + Headline MD "Welcome back"; `<Suspense>` around `LoginForm` (it reads `useSearchParams`); `next/link` for the Sign-up link. Removed the non-functional Facebook/Google social buttons (no OAuth backend, not in any AC) and their `react-icons` imports + the old `bg-login` background.
- **Task 3 (LoginForm rewire):** Replaced `TextInput` with `<InputField>` and the raw button with `<Button>` ("Sign In" / "Signing in..."). Success → `showToast.success('Welcome back!')` then redirect to a sanitized `return` URL (only paths starting with `/`, else `/`). 401 handling: `resetField('password')`, inline `setError('password', …)` with "Please verify your email first." for `Email not verified` else "Invalid email or password."; no error toast on 401. "Forgot password?" → `next/link` to `/forgotPassword`.
- **Task 4 (useRequireAuth):** New `frontend/hooks/useRequireAuth.ts` — waits for `authChecked`, then `router.replace('/login?return=<encoded pathname>')` when unauthenticated; returns `{ isAuthenticated, authChecked }`. `/account` page itself deferred to Story 1.5 as specified.
- **Task 5 (Sign Out redirect):** `Header.tsx` `handleLogout` now `router.replace('/')` per AC5 (was `/login`); state reset now works via Task 1's `logoutThunk.fulfilled` reducer. No other Header changes (full restyle out of scope).
- **Task 6 (Tests):** `authSlice.test.ts` (8), `LoginForm.test.tsx` (6 — render/AC1, success+toast/AC2, return-URL + open-redirect guard, Invalid credentials inline+password-cleared/AC3, Email-not-verified inline/AC3), `useRequireAuth.test.tsx` (3 — no redirect while `authChecked` false, redirect with return when unauth, no redirect when authed). Mocks mirror the established Story 1.3 test conventions.

**AC coverage:** AC1 ✓ (Task 2/3) · AC2 ✓ (Task 1/3) · AC3 ✓ (Task 3) · AC4 ✓ (Task 1 hydration + Task 4 guard; `/account` consumer deferred to 1.5) · AC5 ✓ (Task 1 + Task 5).

### File List

- `frontend/store/authSlice.ts` (updated — fetchMe/logout extraReducers, `authChecked`, import cleanup)
- `frontend/app/(auth)/login/page.tsx` (updated — Oren restyle, Suspense, social buttons removed)
- `frontend/app/(auth)/login/LoginForm.tsx` (updated — InputField/Button, AC3 errors, return-URL)
- `frontend/components/layout/Header.tsx` (updated — Sign Out redirect → `/`)
- `frontend/hooks/useRequireAuth.ts` (new)
- `frontend/store/authSlice.test.ts` (new)
- `frontend/app/(auth)/login/LoginForm.test.tsx` (new)
- `frontend/hooks/useRequireAuth.test.tsx` (new)

### Change Log

- 2026-06-25: Implemented Story 1.4 — Oren-styled login page/form, "Welcome back!" + return-URL redirect, AC3 inline 401 errors (clear password), fixed `authSlice` to handle session hydration (`fetchMeThunk`) and sign-out (`logoutThunk`) with new `authChecked` flag, added `useRequireAuth` guard hook, fixed Header sign-out redirect to `/`. 17 new tests (44 total, zero regressions).
