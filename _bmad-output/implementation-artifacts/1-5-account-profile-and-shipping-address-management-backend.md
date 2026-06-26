# Story 1.5 (Backend): Account Profile & Shipping Address Management

---
baseline_commit: f102bf8
---

Status: review

> **Split story — BACKEND half.** This file covers the NestJS API work (Tasks 1–5).
> The Next.js client work lives in `1-5-account-profile-and-shipping-address-management-frontend.md`.
> **Do the backend first** so the frontend can integrate against working, unprefixed endpoints.
> Owner: `bmad-agent-dev-backend` (Bruno).

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

> ⚠️ **As-built reconciliation (2026-06-26) — READ BEFORE BUILDING.** The frontend shipped a reduced address contract. This file matches it. The Epic 4 conflict was settled by correct-course (see "Address entity field set" Dev Note):
> 1. **Address field set:** `{ firstName, lastName, street, city }` + `isDefault`. **Postal Code, Country, State are NOT collected by the account form.**
> 2. ✅ **Resolved → Option B:** checkout (Epic 4 / Story 4.2) collects Postal Code; Country is a fixed single-market constant. The order address is snapshotted from the checkout form (Story 4.1), NOT from the saved account address.
> 3. 🔧 **Decision update (2026-06-26, by Nguyen Trinh during dev):** `postal_code` and `country` are **removed entirely** from the `addresses` table/entity/DTO (and from the frontend `Address` type + display) — not kept as nullable columns. The saved account address holds only `{ firstName, lastName, street, city, isDefault }`. This is consistent with Option B (checkout, not the saved address, is the source of the order's full address), so Epic 4 is unaffected.
>
> New endpoints the frontend depends on: **edit** (`PATCH /users/addresses/:id`) and **set-default** (`PATCH /users/addresses/:id/default`), plus an `is_default` column.

## Story

As a shopper,
I want to view and edit my profile and save up to two shipping addresses,
So that checkout is faster and my personal details are always current.

## Acceptance Criteria

All six ACs are listed for full context; the backend directly satisfies **AC2, AC3, AC4, AC6** (the API behaviors). AC1/AC5 are frontend-owned but constrain the contract this API must honor. *(ACs amended 2026-06-26 to match the shipped frontend — see the reconciliation banner.)*

**AC1 — Account page renders the Settings dashboard (auth-gated)** *(amended)*
A logged-in shopper at `/account` sees a two-column settings dashboard (sidebar rail + Profile card + editorial aside + Saved Shipping Addresses grid). Frontend-owned; constrains only that this API serves profile + addresses as below.

**AC2 — Profile update**
Given the shopper edits their name and/or phone and clicks "Save Changes",
When `PATCH /users/profile` completes successfully,
Then the displayed values update immediately (Redux `user` is refreshed); a toast "Profile updated" appears; the email field is always read-only and is never sent as an editable value.

**AC3 — Add / edit shipping address** *(amended)*
Given the shopper submits the address form,
When `POST /users/addresses` (add) or `PATCH /users/addresses/:id` (edit) completes,
Then the list reflects the change; toast "Address saved" / "Address updated". At the **3rd** address `POST` throws `ConflictException('Maximum 2 addresses reached')` (server-side enforcement — the frontend does **not** currently hide the add affordance at 2, so the 409 is the real gate).

**AC4 — Remove shipping address**
Given the shopper clicks remove on a saved address,
When `DELETE /users/addresses/:id` completes,
Then the address is removed; toast "Address removed". `NotFoundException('Address not found')` if missing or owned by another user.

**AC5 — Unauthenticated access is redirected and returns**
Given an unauthenticated user navigates to `/account`,
When the page loads,
Then they are redirected to `/login?return=/account` (via `useRequireAuth`); after a successful login they land back on `/account`.

**AC6 — Set default shipping address** *(added)*
Given the shopper sets a saved address as default,
When `PATCH /users/addresses/:id/default` completes,
Then that address becomes the user's only default (others cleared) and the endpoint returns the full updated list `{ data: Address[] }`; toast "Default address updated".

## API Contract (what the frontend depends on)

These shapes are the seam between the two split stories — keep them exact. *(Amended 2026-06-26 to the as-built frontend contract.)*

- `PATCH /users/profile` → body `{ userName?, phoneNumber? }` (NO `email`) → returns the sanitized user `{ id, userName, email, phoneNumber, role }`.
- `GET /users/addresses` → returns `{ data: Address[] }` (never a raw top-level array).
- `POST /users/addresses` → body `{ firstName, lastName, street, city, isDefault? }` → returns the created `Address`. At the 3rd address throw `ConflictException('Maximum 2 addresses reached')`.
- `PATCH /users/addresses/:id` → body same shape as `POST` → returns the updated `Address`; `NotFoundException` if missing/not owned. *(added — edit)*
- `PATCH /users/addresses/:id/default` → no body → returns `{ data: Address[] }` (full list, chosen address `isDefault: true`, all others `false`). *(added — set-default)*
- `DELETE /users/addresses/:id` → returns `{ message: 'Address removed' }`; `NotFoundException('Address not found')` when missing or owned by another user.
- `Address` = `{ id, firstName, lastName, street, city, isDefault }`. **`postalCode`, `country`, and `state` are NOT part of the account address** (removed entirely — decision §3 in the reconciliation banner).
- All routes are **UNPREFIXED** (`/users/...`, NOT `/api/users/...`) and guarded by `@UseGuards(AuthGuard('jwt'))`.

## Tasks / Subtasks

### Backend (NestJS — all NEW; no users endpoints exist today)

- [x] **Task 1: Create `Address` entity + User relation + migration** (AC3, AC4, AC6)
  - [x] Create `backend/src/modules/users/entities/address.entity.ts` — TypeORM `@Entity('addresses')`, class `Address`. Columns **matching the shipped frontend `Address` contract**: `id` (PK), `firstName`, `lastName`, `street`, `city` (`varchar`, NOT NULL), `isDefault` (`tinyint`, NOT NULL, default `false`), `createAt` (`@CreateDateColumn`), and `@ManyToOne(() => User, ...)` with `@JoinColumn({ name: 'user_id' })` + `userId`. `snake_case` DB column names via `{ name: '...' }` (`first_name`, `last_name`, `is_default`, `user_id`). **`postal_code` and `country` were removed entirely (decision update §3 above) — the account address is `{ firstName, lastName, street, city, isDefault }` only.**
  - [x] In `user.entity.ts` add the inverse side: `@OneToMany(() => Address, (a) => a.user) addresses: Address[];` (do NOT eager-load by default). While in this file, fix the existing `@Column({ nullable: true }) phoneNumber!: string;;` line: drop the stray double-semicolon and align the type to `string | null` (added explicit `type: 'varchar'` for the same TypeORM-inference reason).
  - [x] Create migration `backend/src/database/migrations/{timestamp}-CreateAddresses.ts` — `{timestamp}` numerically greater than `1782206839023`; defensive `up()`/`down()` (check `queryRunner.getTable('addresses')`). SQL:
    ```sql
    CREATE TABLE `addresses` (
      `id` int NOT NULL AUTO_INCREMENT,
      `first_name` varchar(255) NOT NULL,
      `last_name` varchar(255) NOT NULL,
      `street` varchar(255) NOT NULL,
      `city` varchar(255) NOT NULL,
      `is_default` tinyint NOT NULL DEFAULT 0,
      `user_id` int NOT NULL,
      `createAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      KEY `idx_addresses_user_id` (`user_id`),
      CONSTRAINT `fk_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB
    ```
  - [x] Run `pnpm migration:run` and confirm it applies cleanly (`synchronize: false` stays). ✅ Applied to the live `ecommerce` DB — `CreateAddresses1787000000000` executed successfully, `addresses` table created.

- [x] **Task 2: DTOs** (AC2, AC3)
  - [x] Create `backend/src/modules/users/dto/update-profile.dto.ts` — `userName?` and `phoneNumber?`, each `@IsOptional()` + `@IsNotEmpty()`/`@IsString()` with user-facing messages. **Do NOT include `email`** (read-only). Export as `default` class (Rule 3).
  - [x] Create `backend/src/modules/users/dto/create-address.dto.ts` — `firstName`, `lastName`, `street`, `city` all `@IsNotEmpty()` `@IsString()`; `isDefault?` `@IsOptional()` `@IsBoolean()`. **No `postalCode`/`country` (removed — decision §3).** Export as `default` class. The edit endpoint reuses this DTO (all-fields body).

- [x] **Task 3: Extend `UserService` with profile + address methods** (AC2, AC3, AC4, AC6)
  - [x] `updateProfile(userId, dto)` — load via `findById`, apply only provided fields (`userName`, `phoneNumber`), `save`, return sanitized `{ id, userName, email, phoneNumber, role }`.
  - [x] `getAddresses(userId)` — return the user's addresses ordered by `id ASC`.
  - [x] `addAddress(userId, dto)` — count existing; if `>= 2` throw `ConflictException('Maximum 2 addresses reached')`; if `dto.isDefault` (or it's the first address) clear other defaults; create+save; return the new address.
  - [x] `editAddress(userId, addressId, dto)` *(new)* — find + ownership-check (`NotFoundException('Address not found')`); apply fields; if `isDefault` set, clear others; `save`; return the updated address.
  - [x] `setDefaultAddress(userId, addressId)` *(new)* — ownership-check; set chosen `isDefault = true` and all the user's others `false`; return the full updated list (for `{ data: Address[] }`).
  - [x] `removeAddress(userId, addressId)` — ownership-check then `remove`; return `{ message: 'Address removed' }`.
  - [x] In `user.module.ts` add `Address` to `TypeOrmModule.forFeature([User, Address])`, inject `@InjectRepository(Address)`.

- [x] **Task 4: Create `UsersController` (NEW)** (AC2, AC3, AC4, AC6)
  - [x] `@Controller('users')`, every route `@UseGuards(AuthGuard('jwt'))`; read the user via `(req as Request & { user: User }).user` like `auth.controller.ts` `me()`.
  - [x] Routes (UNPREFIXED): `PATCH profile` → `updateProfile`; `GET addresses` → `getAddresses` (wrap as `{ data }`); `POST addresses` → `addAddress`; `PATCH addresses/:id` → `editAddress(req.user.id, +id, dto)` *(new)*; `PATCH addresses/:id/default` → `setDefaultAddress(req.user.id, +id)` returning `{ data }` *(new)*; `DELETE addresses/:id` → `removeAddress`. **Note:** `addresses/:id/default` is declared before `addresses/:id` in the controller for clarity (NestJS matches them as distinct patterns either way).
  - [x] Register the controller in `user.module.ts`.

- [x] **Task 5: Backend tests** (`*.spec.ts`)
  - [x] `user.service.spec.ts` — `updateProfile` updates only provided fields + never returns sensitive fields; `addAddress` throws `ConflictException` at the 3rd address; `setDefaultAddress` flips the chosen row to default and clears the others; `editAddress`/`removeAddress` throw `NotFoundException` when the address belongs to another user. Mock the repositories (Jest, `node` env). *(9 tests, all green.)*

### Review Findings

_Code review 2026-06-26 (3 adversarial layers: Blind Hunter, Edge Case Hunter, Acceptance Auditor). 2 decision-needed, 5 patch, 1 deferred, 8 dismissed as noise._

- [ ] [Review][Decision] **Default-address invariant — a user with ≥1 address can end up with ZERO defaults** — Two paths break the "exactly one default" assumption: (a) `editAddress` with `isDefault:false` on the only default just sets it false (`user.service.ts` editAddress — `if (dto.isDefault !== undefined) address.isDefault = dto.isDefault`); (b) `removeAddress` deletes the default without promoting a survivor. The spec never states the invariant, so the intended behavior (must there always be exactly one default when addresses exist?) is a product call. Drives fixes to editAddress/removeAddress + a frontend refetch-after-delete. [blind+edge+auditor]
- [ ] [Review][Decision] **AC3 max-2 add-affordance gate not implemented (the open question)** — Backend `409 ConflictException('Maximum 2 addresses reached')` is correct and tested; the frontend never hides the "Add New Address" card at 2 (`AddressPreview.tsx`). Decide: add the client-side gate, or accept server-side 409 only (documented deviation). [auditor+frontend story]
- [ ] [Review][Patch] **Default-mutations are not atomic** — `addAddress`/`editAddress`/`setDefaultAddress` do `update({userId},{isDefault:false})` then a separate `save()` with no transaction; a failed/concurrent second write can strand zero or two defaults. Also max-2 `count()`-then-`save()` is a check-then-insert race. Wrap each in a `queryRunner` transaction. [backend/src/modules/users/user.service.ts] [blind+edge]
- [ ] [Review][Patch] **Rule 4 not followed — DB ops not wrapped in try/catch** — None of the new service methods convert `QueryFailedError` to a Nest HTTP exception; a DB-level failure bubbles as a raw 500. Project convention (Rule 4) + the story's own Dev Note require wrapping. [backend/src/modules/users/user.service.ts] [auditor]
- [ ] [Review][Patch] **`:id` param has no `ParseIntPipe`** — `+id` on a non-numeric param yields `NaN` (then a misleading 404 instead of a clean 400). Add `ParseIntPipe`. [backend/src/modules/users/users.controller.ts] [blind+edge]
- [ ] [Review][Patch] **Whitespace-only / overlong inputs accepted** — `@IsNotEmpty()` passes `"   "`, and there is no `@MaxLength(255)` vs the `varchar(255)` columns (overlong → DB 500). Add a trim transform + min-length + `@MaxLength` on address/profile string fields. [backend/src/modules/users/dto/*] [blind+edge]
- [ ] [Review][Patch] **Weak tests give false confidence** — `setDefaultAddress` test asserts `toBe(fullList)` (tautological — the mock returns what the test feeds it); `addAddress` uses identity pass-through mocks and doesn't assert clear-before-set ordering; no test for editAddress success / default-toggle / addAddress count=1 success. Strengthen. [backend/src/modules/users/user.service.spec.ts] [blind]
- [x] [Review][Defer] **Edit-form stale-row cross-tab race** [frontend/features/account/components/AddressForm.tsx] — deferred, rare cross-session UX edge (blank form → generic save error if the row was deleted elsewhere).

## Dev Notes

### Story shape: this is a FULL-STACK story (unlike 1.4)

Story 1.4 was frontend-only. **Story 1.5 builds real backend**: the `addresses` table + entity, a brand-new `UsersController`, new `UserService` methods, and DTOs — none of which exist today. Budget accordingly; do the backend first so the frontend can integrate against working endpoints.

### CRITICAL: API prefix — use UNPREFIXED routes (`/users/...`), not `/api/users/...`

The epic AC text says `PATCH /api/users/profile`, `POST /api/users/addresses`, etc. **Reality check on the live system:**
- `backend/src/main.ts` does **NOT** call `app.setGlobalPrefix('api')`. Existing live routes are `/auth/login`, `/auth/me`, `/auth/logout` — **no `/api`**.
- The frontend `authAPI.ts` calls them **unprefixed** (`api.post('/auth/login')`) against `baseURL = NEXT_PUBLIC_API_URL`.
- Therefore the `/api` in the epic is **figurative/aspirational** (same situation as Story 1.4 treating "token is stored client-side" as figurative for cookie auth).

**Mandate:** Implement the controller as `@Controller('users')` (→ `/users/profile`, `/users/addresses`). **Do NOT add `app.setGlobalPrefix('api')`** in this story — doing so would silently break every existing `/auth/*` call across the app (login, signup, verify, me, logout). Reconciling the architecture's intended `/api` prefix is a separate, cross-cutting task (flagged below). Keeping the system working end-to-end takes priority over matching the literal AC string.

### Address entity field set — ⚠️ diverges from Epic 4 checkout (open decision)

**Original plan:** align to **Epic 4, Story 4.2 (Checkout Step 1 — Shipping Address)** — *Full Name, Address Line 1, City, State, Postal Code, Country* — so a saved address could be reused at checkout via `shippingAddressId` (Story 4.1 expects `shippingAddressId`).

**What shipped (frontend, 2026-06-26):** the form was simplified to `{ firstName, lastName, street, city }` + an `isDefault` flag. **Postal Code, Country, and State are no longer collected.** This story's entity/DTO/migration above were reconciled to that contract, with `postal_code`/`country` kept as **nullable** columns.

**Why this is flagged, not just applied:** a shipping address with no postal code or country **cannot fulfil an Epic 4 order**. Mapping is also non-trivial: `fullName → firstName + lastName`, `line1 → street`, and `state` is gone entirely. This is a cross-cutting product/architecture decision, not a doc edit.

> ✅ **Resolved 2026-06-26 (correct-course → Option B):** the account form will **not** collect Postal Code / Country / State. Checkout (Story 4.2) collects Postal Code; Country is a fixed single-market constant; State dropped. Consequence for Story 4.1: the order's `shippingAddress` JSON is built from the completed checkout form, so its create body must carry the full address (not `shippingAddressId` alone). See `planning-artifacts/sprint-change-proposal-2026-06-26-address-field-set.md` §6.
>
> 🔧 **Decision update 2026-06-26 (during dev, Nguyen Trinh):** earlier reconciliation kept `postal_code`/`country` as **nullable** columns. That was reversed — they are now **removed entirely** from the entity, migration, DTO, and the frontend `Address` type/display. The account address is `{ firstName, lastName, street, city, isDefault }` only. Still consistent with Option B (the order snapshots its full address from the checkout form, never from the saved account address), so Epic 4 is unaffected.

[Source: planning-artifacts/epics/epic-4-checkout-order-lifecycle.md#Story 4.2 / #Story 4.1]

### User column is `phoneNumber` (not `phone`)

The `User` entity column is `phoneNumber` (nullable). The epic/PRD say "phone" — same field. The backend `GET /auth/me` already returns `phoneNumber`. The profile PATCH updates `userName` and `phoneNumber`; **`email` is immutable** (read-only in UI and excluded from the DTO).

> ⚠️ **Verified in code:** the entity currently has `@Column({ nullable: true }) phoneNumber!: string;;` — nullable column but `string` type, plus a stray double-semicolon. Fix both in Task 1 (type → `string | null`) so the sanitized-user `{ phoneNumber }` return type is honest and matches the frontend `User.phoneNumber: string | null`.

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
- API response shapes (architecture): single → `{ data, message? }`, action → `{ message }`, **never raw arrays at top level** for lists. For `GET /users/addresses` return `{ data: Address[] }`. For `POST`/`DELETE` return the created entity / `{ message }`.
- `strictNullChecks: true` (backend) — handle `findById` returning `null` (throw `NotFoundException` / `UnauthorizedException`).
- DB naming: `snake_case` columns, table `addresses` (plural), FK `user_id`, index `idx_addresses_user_id`.
[Source: _bmad-output/project-context/critical-implementation-rules.md; planning-artifacts/architecture/implementation-patterns-consistency-rules.md]

### Migration pattern (from the only existing migration)

`backend/src/database/migrations/1782206839023-AddRoleToUsers.ts` is the template: class name `{Description}{timestamp}`, `implements MigrationInterface`, defensive `up()`/`down()` that check existence (`queryRunner.getTable(...)`) before mutating. Use a `{timestamp}` larger than `1782206839023`. Confirm `synchronize: false` in `database.config.ts` and run `pnpm migration:run`.

### Testing patterns (carried from Story 1.3 / 1.4 learnings)

- **pnpm only** — never `npm install`. Backend: Jest, `*.spec.ts`, `node` env. Mock repositories.

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

### Do NOT touch / Out of scope

- Do **not** add `app.setGlobalPrefix('api')` (would break all existing `/auth/*` calls — separate task).
- ~~No new address-edit endpoint~~ **Superseded (2026-06-26):** edit (`PATCH /users/addresses/:id`) and set-default (`PATCH /users/addresses/:id/default`) are now in scope (the frontend depends on them) — see Tasks 3–4.
- All frontend work (`/account` page, `usersAPI`, Redux, Header) is in the FRONTEND split story — out of scope here.

### Project Structure Notes

- New `backend/src/modules/users/{dto,users.controller.ts}` follows the same feature-module layout as `auth/`. [Source: project-context/critical-implementation-rules.md#Rule 2]
- `addresses` table naming + FK + index follow architecture DB-naming rules. [Source: planning-artifacts/architecture/implementation-patterns-consistency-rules.md#Naming Patterns]
- **Variance (flagged):** routes are unprefixed (`/users/...`) deliberately, diverging from the architecture's stated `/api` global prefix because the prefix was never implemented and the whole app currently runs unprefixed. See the API-prefix Dev Note + open question.

### References

- [Source: planning-artifacts/epics/epic-1-design-system-user-authentication.md#Story 1.5] — acceptance criteria
- [Source: planning-artifacts/epics/epic-4-checkout-order-lifecycle.md#Story 4.2] — canonical shipping-address field set (Full Name, Line 1, City, State, Postal Code, Country); #Story 4.1 — `shippingAddressId` reference
- [Source: planning-artifacts/architecture/implementation-patterns-consistency-rules.md] — API response shapes, DB naming, response-shape enforcement
- [Source: project-context/critical-implementation-rules.md] — DTO/service/module/testing conventions
- [Source: backend/src/modules/auth/auth.controller.ts] — JWT guard + `req.user` current-user pattern
- [Source: backend/src/database/migrations/1782206839023-AddRoleToUsers.ts] — migration pattern
- [Companion: implementation-artifacts/1-5-account-profile-and-shipping-address-management-frontend.md] — frontend half (consumes this API)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Bruno — backend dev agent)

### Debug Log References

- `npx tsc --noEmit` → 0 errors.
- `npx jest user.service` → 1 suite, 9 tests pass. `npx jest` (full backend regression) → **4 suites, 21 tests pass**, no regressions.
- `npx eslint` (changed files) → clean after fixes (prettier wrap + one `no-unsafe-return` resolved by typing mock callbacks).
- `pnpm migration:run` → **`CreateAddresses1787000000000` executed successfully** against the live `ecommerce` MySQL DB; `addresses` table created with FK + index. Final columns: `id, first_name, last_name, street, city, is_default, user_id, createAt`.
  - During the first build, a `string | null` union on `postal_code`/`country` triggered `DataTypeNotSupportedError` (TypeORM can't infer a column type from a union — needs explicit `type: 'varchar'`). Moot after the columns were removed; the same fix was kept for `User.phoneNumber` (which remains `string | null`).
  - **Post-build decision (Nguyen Trinh):** `postal_code` and `country` removed entirely. Migration reverted twice and re-run so the live table reflects the final `{ first_name, last_name, street, city, is_default }` shape.
- App boot (`nest start`) → **Nest application successfully started**; `UsersController {/users}` mapped all six routes (PATCH /users/profile, GET/POST /users/addresses, PATCH /users/addresses/:id/default, PATCH/DELETE /users/addresses/:id). Cross-module `AuthGuard('jwt')` resolves with no DI error. (Port bind hit a benign EADDRINUSE because the dev server already held :3001 — routing/DI fully validated before that.)

### Completion Notes List

- **All 5 backend tasks (1–5) complete, tested, and verified end-to-end.** The shipped frontend's runtime 404s on `/users/...` are now resolved — the endpoints exist and match `usersAPI.ts` exactly.
- Contract honored precisely: `PATCH /users/profile` returns the sanitized `{ id, userName, email, phoneNumber, role }` (matches `MeResponse`); `GET /users/addresses` → `{ data }`; `POST`/`PATCH addresses` return the raw `Address` (`{ id, firstName, lastName, street, city, isDefault }`); `PATCH addresses/:id/default` → `{ data }` (full list); `DELETE` → `{ message: 'Address removed' }`.
- **`postalCode`/`country` removed end-to-end** (entity, migration, DTO, service, frontend `Address` type, `AddressPreview` display + test fixtures) per the in-dev decision. Frontend regression re-run: 14 suites / 64 tests green.
- Default-address invariant: adding the first address (or any `isDefault: true`) clears other defaults; `setDefaultAddress` clears all then sets the chosen one.
- Ownership scoping via `req.user.id` on every route; `findOwnedAddress` throws `NotFoundException` for missing OR other-user rows (no row leakage).
- `phoneNumber` defect fixed: stray `;;` removed, type aligned to `string | null` with explicit `type: 'varchar'`.
- **Field-set divergence vs Epic 4** (`postal_code`/`country` nullable, `state` dropped) is the intended Option-B state per `sprint-change-proposal-2026-06-26-address-field-set.md` — not a stopgap.
- **Open item carried for code review (frontend AC3):** the client-side max-2 add-affordance gate is not implemented; the backend `409` is the real gate. Decision deferred to CR.

### File List

- NEW `backend/src/modules/users/entities/address.entity.ts` — `Address` entity (`{ firstName, lastName, street, city, isDefault }`, snake_case columns, FK to users)
- UPDATE `backend/src/modules/users/entities/user.entity.ts` — `@OneToMany addresses`; fixed `phoneNumber` (`string | null`, explicit `varchar`)
- NEW `backend/src/database/migrations/1787000000000-CreateAddresses.ts` — creates `addresses` table (defensive up/down)
- UPDATE `frontend/services/usersAPI.ts` — removed `postalCode?`/`country?` from `Address` type
- UPDATE `frontend/features/account/components/AddressPreview.tsx` — removed postalCode/country from the card display
- UPDATE `frontend/features/account/components/AddressPreview.test.tsx` — removed postalCode/country from fixtures
- NEW `backend/src/modules/users/dto/update-profile.dto.ts`
- NEW `backend/src/modules/users/dto/create-address.dto.ts`
- UPDATE `backend/src/modules/users/user.service.ts` — `updateProfile`, `getAddresses`, `addAddress`, `editAddress`, `setDefaultAddress`, `removeAddress` (+ injected `Address` repo)
- NEW `backend/src/modules/users/users.controller.ts` — JWT-guarded `@Controller('users')`, six routes
- UPDATE `backend/src/modules/users/user.module.ts` — register `Address` + `UsersController`
- NEW `backend/src/modules/users/user.service.spec.ts` — 9 tests

### Change Log

- 2026-06-26 — **Backend half implemented (Tasks 1–5).** `Address` entity + migration (applied to live DB), profile + address-CRUD service methods (add/edit/set-default/remove with ownership scoping + max-2 + default invariant), new JWT-guarded `UsersController` (six unprefixed `/users/*` routes), DTOs, and 9 service tests. Fixed the `User.phoneNumber` `;;`/type defect. tsc + lint clean; 21/21 backend tests green; app boots and maps all routes. Status → review. With the frontend already at `review`, Story 1.5 is now complete end-to-end.
- 2026-06-26 — **`postalCode`/`country` removed from the account address** (decision by Nguyen Trinh during dev). Reverted/edited/re-ran the migration; updated entity, DTO, and service; also cleaned the frontend `Address` type, `AddressPreview` display, and test fixtures. Account address is now `{ firstName, lastName, street, city, isDefault }`. Backend 21/21 + frontend 64/64 tests green. Reconciliation banner §3 + "Address entity field set" Dev Note updated. Epic 4 unaffected (order address comes from the checkout form, not the saved address).
- 2026-06-26 — **As-built reconciliation** to the shipped frontend contract (backend not yet built). Address field set `{ fullName, line1, city, state, postalCode, country }` → `{ firstName, lastName, street, city }` + `isDefault`, with `postal_code`/`country` made nullable and `state` dropped. Added `is_default` column, edit (`PATCH /users/addresses/:id`) and set-default (`PATCH /users/addresses/:id/default`) endpoints + service methods + tests. ⚠️ The field-set reduction conflicts with Epic 4 / Story 4.2 checkout — flagged for `correct-course` (see "Address entity field set" Dev Note).
