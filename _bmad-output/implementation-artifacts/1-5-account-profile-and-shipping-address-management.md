# Story 1.5: Account Profile & Shipping Address Management

---
baseline_commit: f102bf8
---

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

> **This is the combined overview. This is a split story — dev agents should open their half:**
> **frontend** (Felix) → `1-5-account-profile-and-shipping-address-management-frontend.md` (Tasks 6–11) ·
> **backend** (Bruno) → `1-5-account-profile-and-shipping-address-management-backend.md` (Tasks 1–5).
> **Sequence: backend first**, then integrate the frontend against the working unprefixed `/users/...` endpoints.

> ⚠️ **As-built reconciliation (2026-06-26).** The frontend half shipped and diverged from this original plan. The **split files are the reconciled source of truth** — read them, not the task breakdown below (which predates reconciliation):
> - **frontend** file → status `review`, fully reconciled (two-column dashboard; address form reduced to `{ firstName, lastName, street, city }` + `isDefault`; edit + set-default added; max-2 add-card gate **not** implemented — open).
> - **backend** file → built to that contract (new `is_default` column, edit + set-default endpoints). **`postal_code`/`country` removed entirely** (decision by Nguyen Trinh during dev, 2026-06-26) — account address is `{ firstName, lastName, street, city, isDefault }`.
> - ✅ **Resolved 2026-06-26 (correct-course → Option B):** account form stays slim (no Postal Code / Country / State); checkout (Story 4.2) collects Postal Code, Country = fixed single-market constant, State dropped. Story 4.1's order address is snapshotted from the checkout form. See `sprint-change-proposal-2026-06-26-address-field-set.md` §6. (ACs + field-set Dev Note updated; detailed Tasks left as original breakdown.)

## Story

As a shopper,
I want to view and edit my profile and save up to two shipping addresses,
So that checkout is faster and my personal details are always current.

## Acceptance Criteria

*(ACs amended 2026-06-26 to match the shipped implementation — see the reconciliation banner and the split files.)*

**AC1 — Account page renders the Settings dashboard (auth-gated)** *(amended)*
A logged-in shopper at `/account` sees a two-column settings dashboard: a sidebar rail (Profile active · Security "Coming soon"; auth gate in `app/account/layout.tsx`), a "Welcome back" header, a Personal Details card beside an editorial aside, and a full-width Saved Shipping Addresses grid. Oren editorial tokens (`glass-panel`/`soft-shadow`/`account-mesh`). The standalone Order History card was dropped (Epic 4 route).

**AC2 — Profile update**
Given the shopper edits their name and/or phone and clicks "Save Changes",
When `PATCH /users/profile` completes successfully,
Then the displayed values update immediately (Redux `user` is refreshed); a toast "Profile updated" appears; the email field is always read-only and is never sent as an editable value.

**AC3 — Add / edit shipping address (via in-page modal)** *(amended)*
Given the shopper opens the add card or a card's Edit action,
When they submit via `POST /users/addresses` (add) or `PATCH /users/addresses/:id` (edit),
Then the list refreshes and a toast "Address saved" / "Address updated" appears. Fields: First Name, Last Name, Street Address, City + "Set as default". ⚠️ **Known deviation:** the max-2 add-affordance gate is **not** implemented (add card always shows); the 3rd-address `409` is the real gate.

**AC4 — Remove shipping address**
Given the shopper clicks the trash icon on a saved address,
When `DELETE /users/addresses/:id` completes,
Then the address is removed immediately (optimistic); a toast "Address removed" appears.

**AC5 — Unauthenticated access is redirected and returns**
Given an unauthenticated user navigates to `/account`,
When the page loads,
Then they are redirected to `/login?return=/account` (via `useRequireAuth`, in `app/account/layout.tsx`); after a successful login they land back on `/account`.

**AC6 — Set default shipping address** *(added)*
Given a non-default address shows "Set as default",
When `PATCH /users/addresses/:id/default` completes,
Then the DEFAULT badge moves to it (others cleared), the returned list replaces local state, and a toast "Default address updated" appears.

## Tasks / Subtasks

### Backend (NestJS — all NEW; no users endpoints exist today)

- [ ] **Task 1: Create `Address` entity + User relation + migration** (AC3, AC4)
  - [ ] Create `backend/src/modules/users/entities/address.entity.ts` — TypeORM `@Entity('addresses')`, class `Address`. Columns (match Epic 4 / Story 4.2 checkout field set so checkout can reuse via `shippingAddressId`): `id` (PK), `fullName`, `line1`, `city`, `state`, `postalCode`, `country` (all `varchar`, NOT NULL), `createAt` (`@CreateDateColumn`), and `@ManyToOne(() => User, ...)` with `@JoinColumn({ name: 'user_id' })` + a `userId` column. Use `snake_case` DB column names via `{ name: '...' }` on `@Column` (e.g. `full_name`, `postal_code`, `user_id`) per architecture DB-naming rule.
  - [ ] In `user.entity.ts` add the inverse side: `@OneToMany(() => Address, (a) => a.user) addresses: Address[];` (do NOT eager-load by default).
  - [ ] Create migration `backend/src/database/migrations/{timestamp}-CreateAddresses.ts` — pick a `{timestamp}` numerically greater than the existing `1782206839023`. Follow the existing defensive pattern from `AddRoleToUsers`: in `up()` guard with `if (!(await queryRunner.getTable('addresses')))` before `CREATE TABLE`; in `down()` guard before `DROP TABLE`. SQL:
    ```sql
    CREATE TABLE `addresses` (
      `id` int NOT NULL AUTO_INCREMENT,
      `full_name` varchar(255) NOT NULL,
      `line1` varchar(255) NOT NULL,
      `city` varchar(255) NOT NULL,
      `state` varchar(255) NOT NULL,
      `postal_code` varchar(255) NOT NULL,
      `country` varchar(255) NOT NULL,
      `user_id` int NOT NULL,
      `createAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      KEY `idx_addresses_user_id` (`user_id`),
      CONSTRAINT `fk_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB
    ```
  - [ ] Run `pnpm migration:run` and confirm it applies cleanly (`synchronize: false` stays).

- [ ] **Task 2: DTOs** (AC2, AC3)
  - [ ] Create `backend/src/modules/users/dto/update-profile.dto.ts` — `userName?` and `phoneNumber?`, each `@IsOptional()` + `@IsNotEmpty()`/`@IsString()` with user-facing messages. **Do NOT include `email`** (read-only). Export as `default` class (Rule 3).
  - [ ] Create `backend/src/modules/users/dto/create-address.dto.ts` — `fullName`, `line1`, `city`, `state`, `postalCode`, `country` all `@IsNotEmpty()` `@IsString()` with messages. Export as `default` class.

- [ ] **Task 3: Extend `UserService` with profile + address methods** (AC2, AC3, AC4)
  - [ ] `updateProfile(userId: number, dto: UpdateProfileDto)` — load user via `findById`, apply only provided fields (`userName`, `phoneNumber`), `save`, return a sanitized user object `{ id, userName, email, phoneNumber, role }` (NEVER return `password`/OTP/reset fields).
  - [ ] `getAddresses(userId: number)` — return the user's addresses ordered by `id ASC`.
  - [ ] `addAddress(userId, dto)` — count existing; if already `>= 2` throw `ConflictException('Maximum 2 addresses reached')`; else create+save and return the new address.
  - [ ] `removeAddress(userId, addressId)` — find the address; if not found OR `address.userId !== userId` throw `NotFoundException('Address not found')` (ownership check — do not leak other users' rows); else `remove` and return `{ message: 'Address removed' }`.
  - [ ] In `user.module.ts` add `Address` to `TypeOrmModule.forFeature([User, Address])`, inject `@InjectRepository(Address)` in the service.

- [ ] **Task 4: Create `UsersController` (NEW)** (AC2, AC3, AC4)
  - [ ] Create `backend/src/modules/users/users.controller.ts` — `@Controller('users')`, every route `@UseGuards(AuthGuard('jwt'))`. Read the authenticated user via `(req as Request & { user: User }).user` exactly like `auth.controller.ts` `me()`.
  - [ ] Routes (UNPREFIXED — see Dev Note "API prefix"): `PATCH profile` → `updateProfile(req.user.id, dto)`; `GET addresses` → `getAddresses(req.user.id)`; `POST addresses` → `addAddress(req.user.id, dto)`; `DELETE addresses/:id` → `removeAddress(req.user.id, +id)`.
  - [ ] Register the controller in `user.module.ts` (`controllers: [UsersController]`).

- [ ] **Task 5: Backend tests** (`*.spec.ts`)
  - [ ] `user.service.spec.ts` — `updateProfile` updates only provided fields and never returns sensitive fields; `addAddress` throws `ConflictException` at the 3rd address; `removeAddress` throws `NotFoundException` when the address belongs to another user. Mock the repositories (Jest, `node` env).

### Frontend (Next.js — `/account` is NEW; consume the existing `useRequireAuth`)

- [ ] **Task 6: Surface `phoneNumber` in the auth `User` model** (AC1, AC2)
  - [ ] Add `phoneNumber: string | null` to the `User` interface in `frontend/store/authSlice.ts` and to `MeResponse` in `frontend/services/authAPI.ts`. Confirm `meAPI()`/`fetchMeThunk` pass `phoneNumber` through (backend `/auth/me` already returns it). This is what lets the Profile section display the current phone.

- [ ] **Task 7: `usersAPI` + profile thunk** (AC2, AC3, AC4)
  - [ ] Create `frontend/services/usersAPI.ts` using the shared `api` axios client (`withCredentials` already set): `updateProfileAPI(data)` → `api.patch('/users/profile', data)`; `getAddressesAPI()` → `api.get('/users/addresses')`; `createAddressAPI(data)` → `api.post('/users/addresses', data)`; `deleteAddressAPI(id)` → `api.delete('/users/addresses/' + id)`. Define `ProfilePayload`, `AddressPayload`, `Address` types.
  - [ ] Add `updateProfileThunk` (in `frontend/store/authThunk.ts`, mirroring the existing thunk pattern: call API, `return res.data`, `rejectWithValue(err.response?.data?.message)`). In `authSlice.ts` add an `extraReducer` for `updateProfileThunk.fulfilled` that sets `state.user = action.payload` so the displayed profile + Header name refresh immediately.
  - [ ] **Addresses use page-local React state, NOT Redux** — they are not needed globally. Fetch on mount with `getAddressesAPI`, mutate the local array after create/delete. (Rationale in Dev Notes.)

- [ ] **Task 8: `/account` page (NEW, Client Component)** (AC1, AC5)
  - [ ] Create `frontend/app/account/page.tsx` — `'use client'`; call `const { isAuthenticated, authChecked } = useRequireAuth();`. While `!authChecked` render a calm loading placeholder; when `authChecked && !isAuthenticated` the hook already redirects (render nothing). When authed, render the three Oren cards (compose the section components from Task 9). Page bg `bg-ivory`, constrained container, `gap-md` between cards.

- [ ] **Task 9: Profile + Address section components** (AC1, AC2, AC3, AC4)
  - [ ] First add `frontend/lib/validation/accountSchemas.ts` — `profileSchema` (`userName` required; `phoneNumber` optional) and `addressSchema` (all six fields required), each with `z.infer` types. (Mirror `lib/validation/authSchemas.ts`.)
  - [ ] `frontend/features/account/components/ProfileSection.tsx` — read `user` from Redux; react-hook-form (`mode: 'onTouched'`, `resolver: zodResolver(profileSchema)`) with `userName` (`<InputField required>`) + `phoneNumber` (`<InputField>`, optional) editable; email shown read-only (disabled `<InputField>` or plain text, label "Email"); "Save Changes" `<Button>` dispatches `updateProfileThunk`, on success `showToast.success('Profile updated')`, on reject `showToast.error(...)`.
  - [ ] `frontend/features/account/components/AddressSection.tsx` — on mount `getAddressesAPI()` into local state; render the list (each row shows the address + a "Remove" secondary `<Button>` → `deleteAddressAPI`, on success splice from state + `showToast.success('Address removed')`). Render an add-address form (`resolver: zodResolver(addressSchema)`; `<InputField required>` for fullName/line1/city/state/postalCode/country) only while `addresses.length < 2`; on submit `createAddressAPI` → push to state + `showToast.success('Address saved')`; when `length >= 2` hide the form/button and show the note "Maximum 2 addresses reached". Surface backend `ConflictException` message via `showToast.error`.
  - [ ] Order History: a simple `next/link` to `/orders` inside its own card titled "Order History" (the `/orders` route arrives in Epic 4 — the link just needs to be present, per AC1).

- [ ] **Task 10: Repoint Header to `/account`** (AC1)
  - [ ] In `frontend/components/layout/Header.tsx` change the account dropdown link from `/my-account` to `/account`.
  - [ ] Remove the now-orphaned placeholder route `frontend/app/my-account/page.tsx` (it only renders an `<h1>My Account</h1>` stub and nothing else links to it). Do not change unrelated Header styling.

- [ ] **Task 11: Frontend tests** (all ACs)
  - [ ] `frontend/app/account/page.test.tsx` — renders the three section headings when authed; does not crash while `authChecked` is false. Mock `useRequireAuth`, `next/navigation`, and `@/services/usersAPI`.
  - [ ] `frontend/features/account/components/ProfileSection.test.tsx` — email field is read-only; "Save Changes" dispatches the thunk and shows "Profile updated" (AC2).
  - [ ] `frontend/features/account/components/AddressSection.test.tsx` — lists fetched addresses; add appends + toast "Address saved"; the add form is hidden with the "Maximum 2 addresses reached" note when 2 exist (AC3); remove deletes + toast "Address removed" (AC4). Mock `@/services/usersAPI`.

## Dev Notes

### Story shape: this is a FULL-STACK story (unlike 1.4)

Story 1.4 was frontend-only. **Story 1.5 builds real backend**: the `addresses` table + entity, a brand-new `UsersController`, new `UserService` methods, and DTOs — none of which exist today. Budget accordingly; do the backend first so the frontend can integrate against working endpoints.

### CRITICAL: API prefix — use UNPREFIXED routes (`/users/...`), not `/api/users/...`

The epic AC text says `PATCH /api/users/profile`, `POST /api/users/addresses`, etc. **Reality check on the live system:**
- `backend/src/main.ts` does **NOT** call `app.setGlobalPrefix('api')`. Existing live routes are `/auth/login`, `/auth/me`, `/auth/logout` — **no `/api`**.
- The frontend `authAPI.ts` calls them **unprefixed** (`api.post('/auth/login')`) against `baseURL = NEXT_PUBLIC_API_URL`.
- Therefore the `/api` in the epic is **figurative/aspirational** (same situation as Story 1.4 treating "token is stored client-side" as figurative for cookie auth).

**Mandate:** Implement the controller as `@Controller('users')` (→ `/users/profile`, `/users/addresses`) and call it from the frontend as `/users/...`. **Do NOT add `app.setGlobalPrefix('api')`** in this story — doing so would silently break every existing `/auth/*` call across the app (login, signup, verify, me, logout). Reconciling the architecture's intended `/api` prefix is a separate, cross-cutting task (flagged below). Keeping the system working end-to-end takes priority over matching the literal AC string.

### Address entity field set — ⚠️ diverges from Epic 4 checkout (open decision)

**Original plan:** align to **Epic 4, Story 4.2** — *Full Name, Address Line 1, City, State, Postal Code, Country* — for checkout reuse via `shippingAddressId`.

**What shipped (2026-06-26):** the form was reduced to `{ firstName, lastName, street, city }` + `isDefault`; **Postal Code, Country and State are no longer collected.** The backend story was reconciled to this (nullable `postal_code`/`country`, `state` dropped). A partial address **cannot fulfil an Epic 4 order**, so this is an open cross-cutting decision.

> ✅ **Resolved 2026-06-26 (Option B):** account form stays slim; checkout collects Postal Code; Country = fixed single-market constant; State dropped. Build with nullable `postal_code`/`country`. See `sprint-change-proposal-2026-06-26-address-field-set.md` §6.

[Source: planning-artifacts/epics/epic-4-checkout-order-lifecycle.md#Story 4.2 / #Story 4.1]

### User column is `phoneNumber` (not `phone`)

The `User` entity column is `phoneNumber` (nullable). The epic/PRD say "phone" — same field. The backend `GET /auth/me` already returns `phoneNumber`, but the frontend `User` type / `MeResponse` currently drop it (only `{ id, email, userName, role }`). Task 6 adds it so the Profile section can display and edit it. The profile PATCH updates `userName` and `phoneNumber`; **`email` is immutable** (read-only in UI and excluded from the DTO).

> ⚠️ **Entity type/lint caveat (verified in code):** `user.entity.ts` declares `@Column({ nullable: true }) phoneNumber!: string;;` — the DB column is nullable but the TS type is `string` (not `string | null`), and there's a stray double-semicolon. Whoever touches `user.entity.ts` (backend Task 1 adds `@OneToMany addresses`) should fix the `;;` and align the type to `string | null` so the sanitized-user return and the frontend `phoneNumber: string | null` agree.

### Backend auth + current-user pattern (copy from `auth.controller.ts` `me()`)

Protected endpoints use `@UseGuards(AuthGuard('jwt'))` (from `@nestjs/passport`). The JWT strategy attaches the full `User` entity to `req.user`. Read it exactly as the existing `me()` does:
```ts
@Get('me')
@UseGuards(AuthGuard('jwt'))
me(@Req() req: Request) {
  const user = (req as Request & { user: User }).user;
  // ...
}
```
Use `req.user.id` for all ownership scoping. Never trust an `id` from the body for "whose profile/addresses".
[Source: backend/src/modules/auth/auth.controller.ts]

### Backend conventions (from project-context Critical Implementation Rules)

- DTOs: class-validator decorators with user-facing `message` strings; `export default class`. (Rule 3)
- Service methods: wrap DB ops in try/catch where a `QueryFailedError` is plausible; convert to Nest HTTP exceptions; let unexpected errors bubble. (Rule 4)
- Module organization: service `@Injectable()` in its own file; entities under `entities/`; DTOs under `dto/`. (Rule 2)
- API response shapes (architecture): single → `{ data, message? }`, action → `{ message }`, **never raw arrays at top level** for lists. For `GET /users/addresses` return `{ data: Address[] }`. For `POST`/`DELETE` return the created entity / `{ message }`. The frontend `usersAPI` should read `res.data.data` for the address list accordingly.
- `strictNullChecks: true` (backend) — handle `findById` returning `null` (throw `NotFoundException` / `UnauthorizedException`).
- DB naming: `snake_case` columns, table `addresses` (plural), FK `user_id`, index `idx_addresses_user_id`.
[Source: _bmad-output/project-context/critical-implementation-rules.md; planning-artifacts/architecture/implementation-patterns-consistency-rules.md]

### Migration pattern (from the only existing migration)

`backend/src/database/migrations/1782206839023-AddRoleToUsers.ts` is the template: class name `{Description}{timestamp}`, `implements MigrationInterface`, defensive `up()`/`down()` that check existence (`queryRunner.getTable(...)`) before mutating. Use a `{timestamp}` larger than `1782206839023`. Confirm `synchronize: false` in `database.config.ts` and run `pnpm migration:run`.

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

- Forms: `react-hook-form` `useForm({ mode: 'onTouched', resolver: zodResolver(schema) })` — validation is **schema-driven with zod** (the established pattern; `zod` + `@hookform/resolvers` are installed). Define schemas in `frontend/lib/validation/` (e.g. a new `accountSchemas.ts` exporting `profileSchema` + `addressSchema`). Do **NOT** use inline `register('x', { required, pattern })` rules — put all validation in the schema. Spread `register` into `<InputField>` (forwardRef, no `Controller`), `error={errors.x?.message}`. See `lib/validation/authSchemas.ts` and `login/LoginForm.tsx`.
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

- **pnpm only** — never `npm install`. Frontend test runner: `pnpm test` (Jest 30); filter flag is `--testPathPatterns` (plural). Backend: Jest, `*.spec.ts`, `node` env.
- Frontend: mock `next/navigation` (`useRouter`/`useSearchParams`/`usePathname`) and the service module (`@/services/usersAPI`) at module level. For `react-redux` use `jest.mock('react-redux', () => ({ ...jest.requireActual('react-redux'), ... }))` — direct `jest.spyOn` on ESM hooks throws "Cannot redefine property". No CSS imports in tests.
- Wrap components needing the store in `<Provider store={store}>` (or mock `useSelector`/`useDispatch`).

### File Locations Reference

| Action | File Path |
|---|---|
| NEW | `backend/src/modules/users/entities/address.entity.ts` |
| UPDATE | `backend/src/modules/users/entities/user.entity.ts` (add `@OneToMany addresses`) |
| NEW | `backend/src/database/migrations/{timestamp}-CreateAddresses.ts` |
| NEW | `backend/src/modules/users/dto/update-profile.dto.ts` |
| NEW | `backend/src/modules/users/dto/create-address.dto.ts` |
| UPDATE | `backend/src/modules/users/user.service.ts` (profile + address methods) |
| NEW | `backend/src/modules/users/users.controller.ts` |
| UPDATE | `backend/src/modules/users/user.module.ts` (register `Address`, controller) |
| NEW | `backend/src/modules/users/user.service.spec.ts` |
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

- Do **not** add `app.setGlobalPrefix('api')` (would break all existing `/auth/*` calls — separate task).
- Do **not** modify `authThunk.ts`'s existing thunks, `services/api.ts`, `providers.tsx` `AuthBootstrap`, `useRequireAuth.ts`, `InputField`/`Button`/`Chip` — reuse as-is.
- `/orders` page itself is **Epic 4** — only the link is in scope here.
- ~~No new address-edit endpoint~~ **Superseded (2026-06-26):** address edit (`PATCH /users/addresses/:id`) and set-default (`PATCH /users/addresses/:id/default`) are now in scope and (frontend) implemented; backend reconciled. See the split files.

### Project Structure Notes

- New `backend/src/modules/users/{dto,users.controller.ts}` follows the same feature-module layout as `auth/`. [Source: project-context/critical-implementation-rules.md#Rule 2]
- New `frontend/features/account/components/` matches the established `features/{domain}/components/` convention. [Source: project-context/code-organization-summary.md]
- `addresses` table naming + FK + index follow architecture DB-naming rules. [Source: planning-artifacts/architecture/implementation-patterns-consistency-rules.md#Naming Patterns]
- **Variance (flagged):** routes are unprefixed (`/users/...`) deliberately, diverging from the architecture's stated `/api` global prefix because the prefix was never implemented and the whole app currently runs unprefixed. See the API-prefix Dev Note + open question.

### References

- [Source: planning-artifacts/epics/epic-1-design-system-user-authentication.md#Story 1.5] — acceptance criteria
- [Source: planning-artifacts/epics/epic-4-checkout-order-lifecycle.md#Story 4.2] — canonical shipping-address field set (Full Name, Line 1, City, State, Postal Code, Country); #Story 4.1 — `shippingAddressId` reference
- [Source: planning-artifacts/architecture/core-architectural-decisions.md#Frontend Architecture] — Account = Client Component (D15)
- [Source: planning-artifacts/architecture/implementation-patterns-consistency-rules.md] — API response shapes, DB naming, response-shape enforcement
- [Source: project-context/critical-implementation-rules.md] — DTO/service/module/testing/toast conventions
- [Source: implementation-artifacts/1-4-user-login-and-frontend-auth-state.md] — `useRequireAuth`, return-URL login, Oren card pattern, testing conventions
- [Source: backend/src/modules/auth/auth.controller.ts] — JWT guard + `req.user` current-user pattern
- [Source: backend/src/database/migrations/1782206839023-AddRoleToUsers.ts] — migration pattern

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Change Log

- 2026-06-26 — **As-built reconciliation** of the overview to the shipped frontend + reconciled backend. ACs amended (dashboard layout; add/edit modal; set-default added; max-2 gate flagged as not-implemented). Address field set reduced to `{ firstName, lastName, street, city }` + `isDefault`; edit + set-default endpoints added. ⚠️ Reduced field set conflicts with Epic 4 / Story 4.2 checkout — flagged for `correct-course`. Detailed Task breakdowns left as original; the split files are the reconciled source of truth.
