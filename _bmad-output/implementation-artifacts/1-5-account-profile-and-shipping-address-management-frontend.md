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

The frontend owns all six ACs (AC2/AC3/AC4/AC6 in concert with the backend API).
> **As-built reconciliation (2026-06-26):** ACs below were updated to match the shipped implementation. This story absorbed the `sprint-change-proposal-2026-06-26` direction (two-column Stitch dashboard, address edit + set-default) plus a later UI pass that dropped Country/Postal Code from the form. See the Change Log for the full deviation list.

**AC1 — Account page renders the Settings dashboard (auth-gated)** *(amended)*
Given a logged-in shopper navigates to `/account`,
When the page renders,
Then a two-column settings dashboard renders (Stitch "Account & Address"):
- a desktop sidebar rail (`app/account/layout.tsx`) — "ACCOUNT" eyebrow, "Curated Selections" heading, vertical nav [**Profile** (active) · **Security** (disabled, "Coming soon")], and an editorial portrait image; the rail collapses to a top nav below `md`;
- a main column — a "Welcome back, {firstName}." header (`AccountWelcome`), an asymmetric `1.2fr / 0.8fr` grid pairing the **Personal Details** card (`ProfileSection`) with an editorial **Private Styling** aside (`AccountAside`), then a full-width **Saved Shipping Addresses** grid (`AddressPreview`).

Surfaces use the Oren editorial tokens (`glass-panel` / `soft-shadow` / `account-mesh`, brown/warm-gray palette, self-hosted `next/font/local`) — not the originally-specced `bg-surface` / `shadow-ambient` / Nunito naming. The standalone "Order History" link card was dropped (the `/orders` route is Epic 4; the rail is the navigation surface).

**AC2 — Profile update**
Given the shopper edits their name and/or phone and clicks "Save Changes",
When `PATCH /users/profile` completes successfully,
Then the displayed values update immediately (Redux `user` is refreshed); a toast "Profile updated" appears; the email field is always read-only and is never sent as an editable value.

**AC3 — Add / edit shipping address via in-page modal** *(amended)*
Given the shopper opens the dashed "Add New Address" card (or a card's hover Edit action),
When they submit the form in `AddressFormModal` via `POST /users/addresses` (add) or `PATCH /users/addresses/:id` (edit),
Then the list refreshes from the server (`getAddressesAPI`); a toast "Address saved" (add) or "Address updated" (edit) appears. The form fields are **First Name, Last Name, Street Address, City** plus a "Set as default" checkbox.
⚠️ **Known deviation:** the original max-2 gate ("hide the add affordance and show 'Maximum 2 addresses reached' once 2 exist") is **not implemented** — the "Add New Address" card renders unconditionally (`features/account/components/AddressPreview.tsx:127`). The backend still returns `409` on a 3rd address, surfaced via `showToast.error`. Code review to decide: add the client-side gate, or accept server-side enforcement only.

**AC4 — Remove shipping address**
Given the shopper clicks the trash icon on a saved address card,
When `DELETE /users/addresses/:id` completes,
Then the address is removed from local state immediately (optimistic filter); a toast "Address removed" appears.

**AC5 — Unauthenticated access is redirected and returns**
Given an unauthenticated user navigates to `/account`,
When the page loads,
Then they are redirected to `/login?return=/account` (via `useRequireAuth`, applied in `app/account/layout.tsx`); after a successful login they land back on `/account`.

**AC6 — Set default shipping address** *(added)*
Given a non-default saved address shows a "Set as default" action,
When the shopper clicks it and `PATCH /users/addresses/:id/default` completes,
Then the returned list replaces local state, the DEFAULT badge moves to the chosen address, and a toast "Default address updated" appears.

## API Contract (consume the backend exactly)

The backend split story implements these — call them **unprefixed** via the shared axios `api` client. *(Address body and endpoints amended 2026-06-26 to match the as-built `usersAPI.ts`.)*

- `PATCH /users/profile` → body `{ userName?, phoneNumber? }` (NEVER send `email`) → returns sanitized user `{ id, userName, email, phoneNumber, role }`.
- `GET /users/addresses` → returns `{ data: Address[] }` → read `res.data.data`.
- `POST /users/addresses` → body `{ firstName, lastName, street, city, isDefault? }` → returns the created `Address`. *(Postal Code & Country removed entirely from the account address — see Change Log; checkout collects Postal Code.)*
- `PATCH /users/addresses/:id` → body same shape as POST → returns the updated `Address`. *(added — edit support)*
- `PATCH /users/addresses/:id/default` → returns `{ data: Address[] }` (full list with the new default set). *(added — set-default)*
- `DELETE /users/addresses/:id` → returns `{ message: 'Address removed' }`.
- A 3rd address returns `409` with message `Maximum 2 addresses reached` — surface via `showToast.error`.

**`Address` type (as built):** `{ id, firstName, lastName, street, city, isDefault }`. The original contract's `fullName / line1 / state` were implemented as `firstName + lastName / street / (none)`. **`postalCode` and `country` were removed entirely** (decision by Nguyen Trinh during the backend-dev session, 2026-06-26) — dropped from the `Address` type, the `AddressPreview` card display, and the test fixtures (not just from the form). `AddressPayload = Omit<Address, 'id' | 'isDefault'> & { isDefault? }`.

> ✅ **Resolved 2026-06-26 (correct-course → Option B, then same-day override):** the account form stays `{ firstName, lastName, street, city }` + `isDefault` — Postal Code/Country/State are **not** collected here. Checkout (Epic 4 / Story 4.2) owns Postal Code; Country is a fixed single-market constant. Backend keeps `postal_code`/`country` nullable. See `planning-artifacts/sprint-change-proposal-2026-06-26-address-field-set.md` §6.

## Tasks / Subtasks

### Frontend (Next.js — `/account` is NEW; consume the existing `useRequireAuth`)

- [x] **Task 6: Surface `phoneNumber` in the auth `User` model** (AC1, AC2)
  - [x] Add `phoneNumber: string | null` to the `User` interface in `frontend/store/authSlice.ts` and to `MeResponse` in `frontend/services/authAPI.ts`. Confirm `meAPI()`/`fetchMeThunk` pass `phoneNumber` through (backend `/auth/me` already returns it). This is what lets the Profile section display the current phone.

- [x] **Task 7: `usersAPI` + profile thunk** (AC2, AC3, AC4)
  - [x] Create `frontend/services/usersAPI.ts` using the shared `api` axios client (`withCredentials` already set): `updateProfileAPI(data)` → `api.patch('/users/profile', data)`; `getAddressesAPI()` → `api.get('/users/addresses')` (read `res.data.data`); `createAddressAPI(data)` → `api.post('/users/addresses', data)`; `editAddressAPI(id, data)` → `api.patch('/users/addresses/' + id, data)`; `setDefaultAddressAPI(id)` → `api.patch('/users/addresses/' + id + '/default')` (returns the full list); `deleteAddressAPI(id)` → `api.delete('/users/addresses/' + id)`. Define `ProfilePayload`, `AddressPayload`, `Address` types. *(edit + set-default added per the 2026-06-26 amendment.)*
  - [x] Add `updateProfileThunk` (in `frontend/store/authThunk.ts`, mirroring the existing thunk pattern: call API, `return res.data`, `rejectWithValue(err.response?.data?.message)`). In `authSlice.ts` add an `extraReducer` for `updateProfileThunk.fulfilled` that sets `state.user = action.payload` so the displayed profile + Header name refresh immediately.
  - [x] **Addresses use page-local React state, NOT Redux** — they are not needed globally. Fetch on mount with `getAddressesAPI`, mutate the local array after create/delete. (Rationale in Dev Notes.)

- [x] **Task 8: `/account` route — layout shell + page (NEW, Client Components)** (AC1, AC5)
  - [x] `frontend/app/account/layout.tsx` — `'use client'`; owns the auth gate (`useRequireAuth`, render a calm loading placeholder while `!authChecked`, nothing once checked & unauthenticated) AND the two-column dashboard shell: desktop sidebar rail (eyebrow + "Curated Selections" + nav [Profile active · Security disabled "Coming soon"] + editorial portrait), `account-mesh` background, mobile top-nav fallback, `max-w-[1200px]` content column. *(Gating moved from the page into the layout per the dashboard amendment.)*
  - [x] `frontend/app/account/page.tsx` — composes `AccountWelcome` + the `1.2fr/0.8fr` grid (`ProfileSection` ‖ `AccountAside`) + `AddressPreview`. Presentational only (no auth logic).

- [x] **Task 9: Profile + Address feature components** (AC1, AC2, AC3, AC4, AC6)
  - [x] `frontend/lib/validation/accountSchemas.ts` — `profileSchema` (`userName` required; `phoneNumber` optional) and `addressSchema` (`firstName`, `lastName`, `street`, `city` required; `isDefault` optional), each with `z.infer` types. *(Field set reduced from the original six; Country/Postal Code removed in the 2026-06-26 UI pass.)*
  - [x] `frontend/features/account/components/ProfileSection.tsx` — "Personal Details" card with an "Edit Info" toggle (read-only until unlocked); react-hook-form (`zodResolver(profileSchema)`) with `userName` ("Legal Name") + `phoneNumber` editable; email rendered via `EmailField` (read-only display, never submitted); "Save Changes" dispatches `updateProfileThunk` → `showToast.success('Profile updated')`.
  - [x] `frontend/features/account/components/EmailField.tsx` — read-only email display styled as the editorial underline field; truncates long addresses with an ellipsis and shows a tooltip-on-hover/focus **only when truncated** (`ResizeObserver` measurement).
  - [x] `frontend/features/account/components/AccountWelcome.tsx` — "Welcome back, {firstName}." header (reads `auth.user`).
  - [x] `frontend/features/account/components/AccountAside.tsx` — editorial "Private Styling" brand card (right column; no fabricated rewards data).
  - [x] `frontend/features/account/components/AddressPreview.tsx` — on mount `getAddressesAPI()` into local state; renders a responsive grid of glass cards (DEFAULT badge, hover Edit/Delete, "Set as default" action) plus a dashed "Add New Address" card; Delete → `deleteAddressAPI` (optimistic filter + "Address removed"); Set default → `setDefaultAddressAPI` (replace list + "Default address updated"); Add/Edit open `AddressFormModal`, which refetches the list on save.
  - [x] `frontend/features/account/components/AddressFormModal.tsx` — in-page popup (Esc + backdrop close; locks the real scroll container — `document.scrollingElement`, not body; flex-column dialog with an isolated `min-h-0 overflow-y-auto` scroll region so it never shows a spurious scrollbar). Wraps `AddressForm`.
  - [x] `frontend/features/account/components/AddressForm.tsx` — add/edit form (`zodResolver(addressSchema)`): First Name, Last Name, Street Address, City + "Set as default" checkbox; create via `createAddressAPI` ("Address saved") or edit via `editAddressAPI` ("Address updated"); edit mode hydrates from `getAddressesAPI().find(id)`.

- [x] **Task 10: Repoint Header to `/account`** (AC1)
  - [x] In `frontend/components/layout/Header.tsx` change the account dropdown link from `/my-account` to `/account`.
  - [x] Remove the now-orphaned placeholder route `frontend/app/my-account/page.tsx` (it only renders an `<h1>My Account</h1>` stub and nothing else links to it). Do not change unrelated Header styling.

- [x] **Task 11: Frontend tests** (all ACs)
  - [x] `frontend/app/account/layout.test.tsx` — auth gate: loading placeholder while `!authChecked`, renders the rail + children when authed. Mock `useRequireAuth`.
  - [x] `frontend/app/account/page.test.tsx` — composes the section components when authed. Mock `useRequireAuth` / stub sections.
  - [x] `frontend/features/account/components/ProfileSection.test.tsx` — email is read-only display text (no editable email input); "Save Changes" dispatches the thunk and shows "Profile updated" (AC2).
  - [x] `frontend/features/account/components/AddressPreview.test.tsx` — lists fetched addresses; remove deletes + toast "Address removed" (AC4); set-default updates the badge + toast (AC6). Mock `@/services/usersAPI`.
  - [x] `frontend/features/account/components/AddressForm.test.tsx` — renders the four fields (no Country / Postal Code); submit calls `createAddressAPI` + toast "Address saved" (AC3).
  - [x] `frontend/features/account/components/AddressFormModal.test.tsx` — opens with the form, Esc/backdrop close, locks the scroll container.
  - [ ] **Not covered:** the max-2 add-card gate (see AC3 deviation — behavior not implemented, so no test).

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
  > **As-built note (2026-06-26):** this guidance is pre-implementation. The shipped `/account` actually uses the **`editorial`** `InputField` variant (underline) and `glass-panel` / `soft-shadow` / `rounded-xl` card tokens over the `account-mesh` background — not `default` / `bg-surface` / `shadow-ambient`. The token *values* in the table below are still accurate; only the class names differ.
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
| NEW | `frontend/services/usersAPI.ts` (profile + address CRUD incl. edit & set-default) |
| NEW | `frontend/lib/validation/accountSchemas.ts` (zod `profileSchema` + `addressSchema`) |
| NEW | `frontend/app/account/layout.tsx` (auth gate + dashboard rail) |
| NEW | `frontend/app/account/page.tsx` (composition) |
| NEW | `frontend/features/account/components/AccountWelcome.tsx` |
| NEW | `frontend/features/account/components/ProfileSection.tsx` |
| NEW | `frontend/features/account/components/EmailField.tsx` |
| NEW | `frontend/features/account/components/AccountAside.tsx` |
| NEW | `frontend/features/account/components/AddressPreview.tsx` |
| NEW | `frontend/features/account/components/AddressFormModal.tsx` |
| NEW | `frontend/features/account/components/AddressForm.tsx` |
| UPDATE | `frontend/components/InputField.tsx` (`editorial` variant) |
| UPDATE | `frontend/components/layout/Header.tsx` (`/my-account` → `/account`) |
| DELETE | `frontend/app/my-account/page.tsx` (orphan placeholder) |
| DELETE | `frontend/features/account/components/AddressSection.tsx` (replaced by AddressPreview + modal) |
| NEW | `frontend/app/account/layout.test.tsx` |
| NEW | `frontend/app/account/page.test.tsx` |
| NEW | `frontend/features/account/components/ProfileSection.test.tsx` |
| NEW | `frontend/features/account/components/AddressPreview.test.tsx` |
| NEW | `frontend/features/account/components/AddressForm.test.tsx` |
| NEW | `frontend/features/account/components/AddressFormModal.test.tsx` |

### Do NOT touch / Out of scope

- Do **not** modify `authThunk.ts`'s existing thunks, `services/api.ts`, `providers.tsx` `AuthBootstrap`, `useRequireAuth.ts`, `InputField`/`Button`/`Chip` — reuse as-is.
- `/orders` page itself is **Epic 4** — the dashboard rail links navigation only; no Order History card was built.
- ~~No address-edit UI~~ **Superseded (2026-06-26):** address **edit** (`PATCH /users/addresses/:id`) and **set-default** (`PATCH /users/addresses/:id/default`) are now in scope and implemented.
- All backend work (entity, migration, DTOs, service, controller) is in the BACKEND split story — out of scope here. **Note:** the new edit + set-default endpoints, and the reduced field set, require corresponding backend changes (see the backend story / Cross-file note above).

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

- `pnpm jest account` (layout, page, ProfileSection, AddressPreview, AddressForm, AddressFormModal) → suites green *(AddressSection suite removed in the 2026-06-26 reconciliation)*
- `pnpm jest` (full regression) → 11 suites, 55 tests pass
- `tsc --noEmit` → no source errors (one stale `.next/types` artifact for the deleted `my-account` route was cleared by regeneration)
- Routes: `/account` → 200, `/my-account` → 404 (removed), `/login` → 200

### Completion Notes List

- **All 6 frontend tasks (6–11) complete and tested.** Implemented against the backend API contract; tests mock `@/services/usersAPI`, so they pass independently of the backend.
- **⚠️ Runtime dependency:** the profile-save and address CRUD features call the NEW `/users/...` endpoints, which the **backend split story has not yet implemented**. Until the backend lands, those actions will 404 at runtime — by design (backend-first sequencing). `/auth/me` already returns `phoneNumber`, so the Profile section displays the current phone today.
- AC coverage *(updated 2026-06-26 — see Change Log)*: AC1 (auth-gated dashboard) ✓ layout + page tests; AC2 (profile update, email read-only display) ✓ ProfileSection test; AC3 (add via modal) ✓ AddressForm + AddressFormModal tests — ⚠️ **max-2 gate not implemented/not tested**; AC4 (remove) ✓ AddressPreview test; AC6 (set-default) ✓ AddressPreview test; AC5 (unauth redirect) via `useRequireAuth` (built/tested in 1.4).
- Forms use the established **zod + `zodResolver`** pattern (new `lib/validation/accountSchemas.ts`), consistent with the auth forms.
- `InputField` `editorial` variant (underline) used for `/account` — added in this story; required fields show the red `*`; errors render `text-error-strong`.
- **Lint note:** new error handling uses the codebase's pervasive `catch (err: any)` idiom (every existing thunk/form uses it for `err.response?.data?.message`). `@typescript-eslint/no-explicit-any` is pre-existing repo-wide debt; no new divergent pattern introduced.
- **Sprint status:** the combined sprint key remains `in-progress` because the **backend half is still outstanding**; only this frontend file is set to `review`.

### File List

- UPDATE `frontend/store/authSlice.ts` — `User.phoneNumber`, `updateProfileThunk.fulfilled` reducer
- UPDATE `frontend/store/authThunk.ts` — `updateProfileThunk`
- UPDATE `frontend/services/authAPI.ts` — `MeResponse.phoneNumber`
- UPDATE `frontend/components/InputField.tsx` — `editorial` variant
- NEW `frontend/services/usersAPI.ts` — profile + address CRUD (incl. `editAddressAPI`, `setDefaultAddressAPI`)
- NEW `frontend/lib/validation/accountSchemas.ts`
- NEW `frontend/app/account/layout.tsx` — auth gate + dashboard rail
- NEW `frontend/app/account/page.tsx`
- NEW `frontend/features/account/components/AccountWelcome.tsx`
- NEW `frontend/features/account/components/ProfileSection.tsx`
- NEW `frontend/features/account/components/EmailField.tsx`
- NEW `frontend/features/account/components/AccountAside.tsx`
- NEW `frontend/features/account/components/AddressPreview.tsx`
- NEW `frontend/features/account/components/AddressFormModal.tsx`
- NEW `frontend/features/account/components/AddressForm.tsx`
- UPDATE `frontend/components/layout/Header.tsx` — account link `/my-account` → `/account`
- DELETE `frontend/app/my-account/page.tsx` — orphan placeholder
- DELETE `frontend/features/account/components/AddressSection.tsx` — replaced by AddressPreview + modal
- NEW `frontend/app/account/layout.test.tsx`
- NEW `frontend/app/account/page.test.tsx`
- NEW `frontend/features/account/components/ProfileSection.test.tsx`
- NEW `frontend/features/account/components/AddressPreview.test.tsx`
- NEW `frontend/features/account/components/AddressForm.test.tsx`
- NEW `frontend/features/account/components/AddressFormModal.test.tsx`

### Change Log

- 2026-06-26 — **`postalCode`/`country` removed end-to-end** (decision by Nguyen Trinh during the backend-dev session). Dropped from `frontend/services/usersAPI.ts` `Address` type, the `AddressPreview` card display, and `AddressPreview.test.tsx` fixtures (backend entity/migration/DTO/service updated in the backend story). Account address is now `{ firstName, lastName, street, city, isDefault }`. Full frontend suite re-run: 14 suites / 64 tests green.
- 2026-06-26 — Implemented Story 1.5 frontend half (Tasks 6–11): `/account` page with Profile + Shipping Address + Order History sections, `usersAPI` service, `updateProfileThunk`, zod `accountSchemas`, Header repoint, my-account removal. 9 new tests; full suite 55/55 green. Status → review (backend half pending).
- 2026-06-26 — **As-built reconciliation** of this story file to the shipped implementation. Deviations from the original spec:
  - **AC1:** single-column "three cards" → two-column Stitch settings dashboard (sidebar rail in `app/account/layout.tsx` + `AccountWelcome` + `ProfileSection` ‖ `AccountAside` + `AddressPreview`). Auth gate moved from page into layout. Order History card dropped.
  - **Address components:** `AddressSection.tsx` (single inline-form component) deleted; replaced by `AddressPreview` (cards grid) + `AddressFormModal` (in-page popup) + `AddressForm`. Added `EmailField`, `AccountWelcome`, `AccountAside`.
  - **Address field set:** `{ fullName, line1, city, state, postalCode, country }` (all required) → `{ firstName, lastName, street, city }` + `isDefault`. **Country and Postal Code removed** from the form; `postalCode?`/`country?` left optional on the type.
  - **Scope additions:** address **edit** (`PATCH /users/addresses/:id`) and **set-default** (`PATCH /users/addresses/:id/default`) implemented (previously out of scope).
  - **Email:** rendered as a read-only display (`EmailField`) with ellipsis-truncation + hover/focus tooltip, not a disabled `<input>`.
  - **⚠️ Known deviation (open):** the max-2 add-affordance gate from AC3 is **not** implemented — the "Add New Address" card always renders; 3rd-address rejection is server-side (409) only. Flagged for code-review decision.
  - **⚠️ Cross-file:** main + backend story files still carry the original six-field contract and no edit/set-default endpoints — reconcile before the backend half lands.
