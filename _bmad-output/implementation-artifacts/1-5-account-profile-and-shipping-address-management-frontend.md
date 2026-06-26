# Story 1.5 (Frontend): Account Profile & Shipping Address Management

---
baseline_commit: f102bf8
---

Status: review

> **Split story — FRONTEND half.** This file covers the Next.js client work (Tasks 6–11).
> The NestJS API work lives in `1-5-account-profile-and-shipping-address-management-backend.md`.
> **The backend should land first** — integrate this UI against the working, unprefixed `/users/...` endpoints.
> Owner: `bmad-agent-dev-frontend` (Felix).

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to view and edit my profile and save up to two shipping addresses,
So that checkout is faster and my personal details are always current.

## Acceptance Criteria

The frontend owns all five ACs (AC2/AC3/AC4 in concert with the backend API).

**AC1 — Account page renders three sections (auth-gated)**
Given a logged-in shopper navigates to `/account`,
When the page renders,
Then three sections are visible: **Profile** (name editable, email read-only, phone editable), **Shipping Addresses** (list, up to 2), **Order History** link (to `/orders`); each section is a Warm White (`bg-surface`) card with ambient shadow (`shadow-ambient`); Nunito Sans typography and the Oren palette are used throughout.

**AC2 — Profile update**
Given the shopper edits their name and/or phone and clicks "Save Changes",
When `PATCH /users/profile` completes successfully,
Then the displayed values update immediately (Redux `user` is refreshed); a toast "Profile updated" appears; the email field is always read-only and is never sent as an editable value.

**AC3 — Add shipping address (under the limit)**
Given the shopper has fewer than 2 saved addresses,
When they submit the address form via `POST /users/addresses`,
Then the new address appears in the list immediately; a toast "Address saved" appears; once 2 addresses exist, the "Add address" affordance is hidden and replaced with the note "Maximum 2 addresses reached".

**AC4 — Remove shipping address**
Given the shopper clicks "Remove" on a saved address,
When `DELETE /users/addresses/:id` completes,
Then the address is removed from the list immediately; a toast "Address removed" appears; if the list drops below 2, the "Add address" affordance reappears.

**AC5 — Unauthenticated access is redirected and returns**
Given an unauthenticated user navigates to `/account`,
When the page loads,
Then they are redirected to `/login?return=/account` (via `useRequireAuth`); after a successful login they land back on `/account`.

## API Contract (consume the backend exactly)

The backend split story implements these — call them **unprefixed** via the shared axios `api` client:

- `PATCH /users/profile` → body `{ userName?, phoneNumber? }` (NEVER send `email`) → returns sanitized user `{ id, userName, email, phoneNumber, role }`.
- `GET /users/addresses` → returns `{ data: Address[] }` → read `res.data.data`.
- `POST /users/addresses` → body `{ fullName, line1, city, state, postalCode, country }` → returns the created `Address`.
- `DELETE /users/addresses/:id` → returns `{ message: 'Address removed' }`.
- A 3rd address returns `409` with message `Maximum 2 addresses reached` — surface via `showToast.error`.

## Tasks / Subtasks

### Frontend (Next.js — `/account` is NEW; consume the existing `useRequireAuth`)

- [x] **Task 6: Surface `phoneNumber` in the auth `User` model** (AC1, AC2)
  - [x] Add `phoneNumber: string | null` to the `User` interface in `frontend/store/authSlice.ts` and to `MeResponse` in `frontend/services/authAPI.ts`. Confirm `meAPI()`/`fetchMeThunk` pass `phoneNumber` through (backend `/auth/me` already returns it). This is what lets the Profile section display the current phone.

- [x] **Task 7: `usersAPI` + profile thunk** (AC2, AC3, AC4)
  - [x] Create `frontend/services/usersAPI.ts` using the shared `api` axios client (`withCredentials` already set): `updateProfileAPI(data)` → `api.patch('/users/profile', data)`; `getAddressesAPI()` → `api.get('/users/addresses')`; `createAddressAPI(data)` → `api.post('/users/addresses', data)`; `deleteAddressAPI(id)` → `api.delete('/users/addresses/' + id)`. Define `ProfilePayload`, `AddressPayload`, `Address` types. The address list comes back as `{ data: Address[] }` → read `res.data.data`.
  - [x] Add `updateProfileThunk` (in `frontend/store/authThunk.ts`, mirroring the existing thunk pattern: call API, `return res.data`, `rejectWithValue(err.response?.data?.message)`). In `authSlice.ts` add an `extraReducer` for `updateProfileThunk.fulfilled` that sets `state.user = action.payload` so the displayed profile + Header name refresh immediately.
  - [x] **Addresses use page-local React state, NOT Redux** — they are not needed globally. Fetch on mount with `getAddressesAPI`, mutate the local array after create/delete. (Rationale in Dev Notes.)

- [x] **Task 8: `/account` page (NEW, Client Component)** (AC1, AC5)
  - [x] Create `frontend/app/account/page.tsx` — `'use client'`; call `const { isAuthenticated, authChecked } = useRequireAuth();`. While `!authChecked` render a calm loading placeholder; when `authChecked && !isAuthenticated` the hook already redirects (render nothing). When authed, render the three Oren cards (compose the section components from Task 9). Page bg `bg-ivory`, constrained container, `gap-md` between cards.

- [x] **Task 9: Profile + Address section components** (AC1, AC2, AC3, AC4)
  - [x] First add `frontend/lib/validation/accountSchemas.ts` — `profileSchema` (`userName` required; `phoneNumber` optional) and `addressSchema` (all six fields required), each with `z.infer` types. (Mirror `lib/validation/authSchemas.ts`.)
  - [x] `frontend/features/account/components/ProfileSection.tsx` — read `user` from Redux; react-hook-form (`mode: 'onTouched'`, `resolver: zodResolver(profileSchema)`) with `userName` (`<InputField required>`) + `phoneNumber` (`<InputField>`, optional) editable; email shown read-only (disabled `<InputField>` or plain text, label "Email"); "Save Changes" `<Button>` dispatches `updateProfileThunk`, on success `showToast.success('Profile updated')`, on reject `showToast.error(...)`.
  - [x] `frontend/features/account/components/AddressSection.tsx` — on mount `getAddressesAPI()` into local state; render the list (each row shows the address + a "Remove" secondary `<Button>` → `deleteAddressAPI`, on success splice from state + `showToast.success('Address removed')`). Render an add-address form (`resolver: zodResolver(addressSchema)`; `<InputField required>` for fullName/line1/city/state/postalCode/country) only while `addresses.length < 2`; on submit `createAddressAPI` → push to state + `showToast.success('Address saved')`; when `length >= 2` hide the form/button and show the note "Maximum 2 addresses reached". Surface backend `ConflictException` message via `showToast.error`.
  - [x] Order History: a simple `next/link` to `/orders` inside its own card titled "Order History" (the `/orders` route arrives in Epic 4 — the link just needs to be present, per AC1).

- [x] **Task 10: Repoint Header to `/account`** (AC1)
  - [x] In `frontend/components/layout/Header.tsx` change the account dropdown link from `/my-account` to `/account`.
  - [x] Remove the now-orphaned placeholder route `frontend/app/my-account/page.tsx` (it only renders an `<h1>My Account</h1>` stub and nothing else links to it). Do not change unrelated Header styling.

- [x] **Task 11: Frontend tests** (all ACs)
  - [x] `frontend/app/account/page.test.tsx` — renders the three section headings when authed; does not crash while `authChecked` is false. Mock `useRequireAuth` and stub the section components.
  - [x] `frontend/features/account/components/ProfileSection.test.tsx` — email field is read-only; "Save Changes" dispatches the thunk and shows "Profile updated" (AC2).
  - [x] `frontend/features/account/components/AddressSection.test.tsx` — lists fetched addresses; add appends + toast "Address saved"; the add form is hidden with the "Maximum 2 addresses reached" note when 2 exist (AC3); remove deletes + toast "Address removed" (AC4). Mock `@/services/usersAPI`.

## Dev Notes

### Story shape: this is a FULL-STACK story (unlike 1.4)

Story 1.4 was frontend-only. **Story 1.5 builds real backend too** (separate split story). Integrate this UI only after the `/users/...` endpoints exist and work; the address list response is `{ data: Address[] }`.

### CRITICAL: API prefix — call UNPREFIXED routes (`/users/...`), not `/api/users/...`

The epic AC text says `PATCH /api/users/profile`, etc. **Reality check on the live system:**
- The backend does **NOT** set a global `api` prefix. Existing live routes are `/auth/login`, `/auth/me`, `/auth/logout` — **no `/api`**.
- The frontend `authAPI.ts` calls them **unprefixed** (`api.post('/auth/login')`) against `baseURL = NEXT_PUBLIC_API_URL`.
- Therefore the `/api` in the epic is **figurative/aspirational** (same as Story 1.4 treating "token is stored client-side" as figurative for cookie auth).

**Mandate:** `usersAPI.ts` must call `/users/profile`, `/users/addresses`, etc. — unprefixed, mirroring `authAPI.ts`.

### User column is `phoneNumber` (not `phone`)

The backend `User`/`GET /auth/me` already returns `phoneNumber` (nullable), but the frontend `User` type / `MeResponse` currently drop it (only `{ id, email, userName, role }`). Task 6 adds it so the Profile section can display and edit it. The profile PATCH updates `userName` and `phoneNumber`; **`email` is immutable** (read-only in UI and excluded from the request body).

### Frontend: consume `useRequireAuth` (already built in 1.4 — do NOT reinvent)

`frontend/hooks/useRequireAuth.ts` already exists and is correct:
```ts
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
On `/account` this yields exactly `/login?return=%2Faccount` (AC5), and `LoginForm` (1.4) already honors the `return` param. Render a loading state until `authChecked` so there's no flash-redirect on first load. **Account is a Client Component** per architecture D15 (Account = Client Component).

### Frontend data layer — profile in Redux, addresses in local state

- **Profile** lives in the global `auth.user` (Header reads `user.userName`). So `updateProfileThunk.fulfilled` must set `state.user = action.payload` to keep the Header and page in sync. Mirror the existing thunk shape in `authThunk.ts`.
- **Addresses** are only needed on this page → keep them in component `useState`, fetched on mount, mutated optimistically after create/delete. Adding a Redux slice for them would be over-engineering for a 0–2 item list. (Consistent with keeping global state minimal.)

### Established frontend patterns to reuse (do NOT reinvent)

- Forms: `react-hook-form` `useForm({ mode: 'onTouched', resolver: zodResolver(schema) })` — validation is **schema-driven with zod** (the established pattern; `zod` + `@hookform/resolvers` are installed). Define schemas in `frontend/lib/validation/` (e.g. a new `accountSchemas.ts` exporting `profileSchema` + `addressSchema` and their `z.infer` types). Do **NOT** use inline `register('x', { required, pattern })` rules — put all validation in the schema. Spread `register` into `<InputField>` (forwardRef, no `Controller`), `error={errors.x?.message}`. See `lib/validation/authSchemas.ts` and `login/LoginForm.tsx`.
- Feedback: `showToast.success/error` from `frontend/lib/toast` — never `alert()`/`console.log`. (Rule 10)
- Components: `<InputField label error required {...register}>`, `<Button variant disabled>` — already exist; use as-is. `InputField` now exposes a `required` boolean (renders a red `*`) and a `variant` — use the **`default`** variant (warm-beige) for `/account`, NOT the `glass` auth variant. Its inline error renders in `text-error-strong` (#ba1a1a). `<Chip>` exists if needed for the "max reached" note (optional). **No Card component exists** — build cards with Tailwind tokens directly: `bg-surface rounded-xl shadow-ambient p-md` (the same pattern as `login/page.tsx`).
- Prettier: single quotes + trailing commas, enforced on `.ts`/`.tsx`.

### Oren token class reference (same tokens Story 1.4 used)

| Purpose | Class | Value |
|---|---|---|
| Page background | `bg-ivory` | `#faf7f2` |
| Card surface | `bg-surface` | `#fff8f4` |
| Primary text | `text-brown` | `#4a3f35` |
| Secondary text | `text-warm-gray` | `#787770` |
| Inline error | `text-error-strong` | `#ba1a1a` (via `InputField` `error`) |
| Ambient shadow | `shadow-ambient` | `0 8px 40px rgba(74,63,53,0.04)` |
| Headline / Body / Label | `text-headline-md` / `text-body-md` / `text-label-sm` | 24/600 · 16/400 · 12/600 uppercase |
| Card corners | `rounded-xl` | 24px |
| Padding / Gap | `p-md` / `gap-md` / `gap-sm` | 24px / 24px / 16px |

### Testing patterns (carried from Story 1.3 / 1.4 learnings)

- **pnpm only** — never `npm install`. Frontend test runner: `pnpm test` (Jest 30); filter flag is `--testPathPatterns` (plural).
- Frontend: mock `next/navigation` (`useRouter`/`useSearchParams`/`usePathname`) and the service module (`@/services/usersAPI`) at module level. For `react-redux` use `jest.mock('react-redux', () => ({ ...jest.requireActual('react-redux'), ... }))` — direct `jest.spyOn` on ESM hooks throws "Cannot redefine property". No CSS imports in tests.
- Wrap components needing the store in `<Provider store={store}>` (or mock `useSelector`/`useDispatch`).

### File Locations Reference

| Action | File Path |
|---|---|
| UPDATE | `frontend/store/authSlice.ts` (User.phoneNumber, updateProfileThunk.fulfilled) |
| UPDATE | `frontend/store/authThunk.ts` (updateProfileThunk) |
| UPDATE | `frontend/services/authAPI.ts` (MeResponse.phoneNumber) |
| NEW | `frontend/services/usersAPI.ts` |
| NEW | `frontend/lib/validation/accountSchemas.ts` (zod `profileSchema` + `addressSchema`) |
| NEW | `frontend/app/account/page.tsx` |
| NEW | `frontend/features/account/components/ProfileSection.tsx` |
| NEW | `frontend/features/account/components/AddressSection.tsx` |
| UPDATE | `frontend/components/layout/Header.tsx` (`/my-account` → `/account`) |
| DELETE | `frontend/app/my-account/page.tsx` (orphan placeholder) |
| NEW | `frontend/app/account/page.test.tsx` |
| NEW | `frontend/features/account/components/ProfileSection.test.tsx` |
| NEW | `frontend/features/account/components/AddressSection.test.tsx` |

### Do NOT touch / Out of scope

- Do **not** modify `authThunk.ts`'s existing thunks, `services/api.ts`, `providers.tsx` `AuthBootstrap`, `useRequireAuth.ts`, `InputField`/`Button`/`Chip` — reuse as-is.
- `/orders` page itself is **Epic 4** — only the link is in scope here.
- No address-edit UI (`PATCH /users/addresses/:id`) — AC only covers add + remove. Edit = delete + re-add for MVP.
- All backend work (entity, migration, DTOs, service, controller) is in the BACKEND split story — out of scope here.

### Project Structure Notes

- New `frontend/features/account/components/` matches the established `features/{domain}/components/` convention. [Source: project-context/code-organization-summary.md]
- **Variance (flagged):** routes are unprefixed (`/users/...`) deliberately, diverging from the architecture's stated `/api` global prefix because the prefix was never implemented and the whole app currently runs unprefixed. See the API-prefix Dev Note.

### References

- [Source: planning-artifacts/epics/epic-1-design-system-user-authentication.md#Story 1.5] — acceptance criteria
- [Source: planning-artifacts/architecture/core-architectural-decisions.md#Frontend Architecture] — Account = Client Component (D15)
- [Source: planning-artifacts/architecture/implementation-patterns-consistency-rules.md] — API response shapes
- [Source: project-context/critical-implementation-rules.md] — toast/form/testing conventions
- [Source: implementation-artifacts/1-4-user-login-and-frontend-auth-state.md] — `useRequireAuth`, return-URL login, Oren card pattern, testing conventions
- [Companion: implementation-artifacts/1-5-account-profile-and-shipping-address-management-backend.md] — backend half (provides this API)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Felix — frontend dev agent)

### Debug Log References

- `pnpm jest account|ProfileSection|AddressSection` → 3 suites, 9 tests pass
- `pnpm jest` (full regression) → 11 suites, 55 tests pass
- `tsc --noEmit` → no source errors (one stale `.next/types` artifact for the deleted `my-account` route was cleared by regeneration)
- Routes: `/account` → 200, `/my-account` → 404 (removed), `/login` → 200

### Completion Notes List

- **All 6 frontend tasks (6–11) complete and tested.** Implemented against the backend API contract; tests mock `@/services/usersAPI`, so they pass independently of the backend.
- **⚠️ Runtime dependency:** the profile-save and address CRUD features call the NEW `/users/...` endpoints, which the **backend split story has not yet implemented**. Until the backend lands, those actions will 404 at runtime — by design (backend-first sequencing). `/auth/me` already returns `phoneNumber`, so the Profile section displays the current phone today.
- AC coverage: AC1 (3 auth-gated sections) ✓ page test; AC2 (profile update, email read-only) ✓ ProfileSection test; AC3 (add + max-2 gate) ✓ AddressSection test; AC4 (remove) ✓ AddressSection test; AC5 (unauth redirect) via `useRequireAuth` (built/tested in 1.4) — page renders nothing once checked & unauthenticated.
- Forms use the established **zod + `zodResolver`** pattern (new `lib/validation/accountSchemas.ts`), consistent with the auth forms.
- `InputField` `default` variant reused (warm-beige); required fields show the red `*`; errors render `text-error-strong`.
- **Lint note:** new error handling uses the codebase's pervasive `catch (err: any)` idiom (every existing thunk/form uses it for `err.response?.data?.message`). `@typescript-eslint/no-explicit-any` is pre-existing repo-wide debt; no new divergent pattern introduced.
- **Sprint status:** the combined sprint key remains `in-progress` because the **backend half is still outstanding**; only this frontend file is set to `review`.

### File List

- UPDATE `frontend/store/authSlice.ts` — `User.phoneNumber`, `updateProfileThunk.fulfilled` reducer
- UPDATE `frontend/store/authThunk.ts` — `updateProfileThunk`
- UPDATE `frontend/services/authAPI.ts` — `MeResponse.phoneNumber`
- NEW `frontend/services/usersAPI.ts`
- NEW `frontend/lib/validation/accountSchemas.ts`
- NEW `frontend/app/account/page.tsx`
- NEW `frontend/features/account/components/ProfileSection.tsx`
- NEW `frontend/features/account/components/AddressSection.tsx`
- UPDATE `frontend/components/layout/Header.tsx` — account link `/my-account` → `/account`
- DELETE `frontend/app/my-account/page.tsx` — orphan placeholder
- NEW `frontend/app/account/page.test.tsx`
- NEW `frontend/features/account/components/ProfileSection.test.tsx`
- NEW `frontend/features/account/components/AddressSection.test.tsx`

### Change Log

- 2026-06-26 — Implemented Story 1.5 frontend half (Tasks 6–11): `/account` page with Profile + Shipping Address + Order History sections, `usersAPI` service, `updateProfileThunk`, zod `accountSchemas`, Header repoint, my-account removal. 9 new tests; full suite 55/55 green. Status → review (backend half pending).
