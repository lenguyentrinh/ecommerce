# Story 1.5 (Backend): Account Profile & Shipping Address Management

---
baseline_commit: f102bf8
---

Status: ready-for-dev

> **Split story — BACKEND half.** This file covers the NestJS API work (Tasks 1–5).
> The Next.js client work lives in `1-5-account-profile-and-shipping-address-management-frontend.md`.
> **Do the backend first** so the frontend can integrate against working, unprefixed endpoints.
> Owner: `bmad-agent-dev-backend` (Bruno).

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

> ⚠️ **As-built reconciliation (2026-06-26) — READ BEFORE BUILDING.** The frontend shipped a reduced address contract. This file matches it. The Epic 4 conflict was settled by correct-course (see "Address entity field set" Dev Note):
> 1. **Address field set:** `{ firstName, lastName, street, city }` + `isDefault`. **Postal Code, Country, State are NOT collected by the account form.**
> 2. ✅ **Resolved → Option B:** checkout (Epic 4 / Story 4.2) collects Postal Code; Country is a fixed single-market constant. Keep `postal_code`/`country` **nullable** on `addresses` — this is now the intended state, not a stopgap.
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
- `Address` = `{ id, firstName, lastName, street, city, postalCode, country, isDefault }`. **`postalCode` and `country` are accepted-but-optional / nullable** (the frontend form dropped them this session — keep the columns for Epic 4 checkout). `state` from the original spec is dropped.
- All routes are **UNPREFIXED** (`/users/...`, NOT `/api/users/...`) and guarded by `@UseGuards(AuthGuard('jwt'))`.

## Tasks / Subtasks

### Backend (NestJS — all NEW; no users endpoints exist today)

- [ ] **Task 1: Create `Address` entity + User relation + migration** (AC3, AC4, AC6)
  - [ ] Create `backend/src/modules/users/entities/address.entity.ts` — TypeORM `@Entity('addresses')`, class `Address`. Columns **matching the shipped frontend `Address` contract**: `id` (PK), `firstName`, `lastName`, `street`, `city` (`varchar`, NOT NULL), `postalCode`, `country` (`varchar`, **NULLABLE** — frontend dropped them; kept for Epic 4 checkout), `isDefault` (`boolean`/`tinyint`, NOT NULL, default `false`), `createAt` (`@CreateDateColumn`), and `@ManyToOne(() => User, ...)` with `@JoinColumn({ name: 'user_id' })` + `userId`. `snake_case` DB column names via `{ name: '...' }` (`first_name`, `last_name`, `postal_code`, `is_default`, `user_id`). *(⚠️ field-set divergence vs Epic 4 — see Dev Note "Address entity field set".)*
  - [ ] In `user.entity.ts` add the inverse side: `@OneToMany(() => Address, (a) => a.user) addresses: Address[];` (do NOT eager-load by default). While in this file, fix the existing `@Column({ nullable: true }) phoneNumber!: string;;` line: drop the stray double-semicolon and align the type to `string | null`.
  - [ ] Create migration `backend/src/database/migrations/{timestamp}-CreateAddresses.ts` — `{timestamp}` numerically greater than `1782206839023`; defensive `up()`/`down()` (check `queryRunner.getTable('addresses')`). SQL:
    ```sql
    CREATE TABLE `addresses` (
      `id` int NOT NULL AUTO_INCREMENT,
      `first_name` varchar(255) NOT NULL,
      `last_name` varchar(255) NOT NULL,
      `street` varchar(255) NOT NULL,
      `city` varchar(255) NOT NULL,
      `postal_code` varchar(255) NULL,
      `country` varchar(255) NULL,
      `is_default` tinyint NOT NULL DEFAULT 0,
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
  - [ ] Create `backend/src/modules/users/dto/create-address.dto.ts` — `firstName`, `lastName`, `street`, `city` all `@IsNotEmpty()` `@IsString()`; `isDefault?` `@IsOptional()` `@IsBoolean()`; `postalCode?` / `country?` `@IsOptional()` `@IsString()` (kept optional for forward-compat). Export as `default` class. The edit endpoint reuses this DTO (all-fields body).

- [ ] **Task 3: Extend `UserService` with profile + address methods** (AC2, AC3, AC4, AC6)
  - [ ] `updateProfile(userId, dto)` — load via `findById`, apply only provided fields (`userName`, `phoneNumber`), `save`, return sanitized `{ id, userName, email, phoneNumber, role }`.
  - [ ] `getAddresses(userId)` — return the user's addresses ordered by `id ASC`.
  - [ ] `addAddress(userId, dto)` — count existing; if `>= 2` throw `ConflictException('Maximum 2 addresses reached')`; if `dto.isDefault` (or it's the first address) clear other defaults; create+save; return the new address.
  - [ ] `editAddress(userId, addressId, dto)` *(new)* — find + ownership-check (`NotFoundException('Address not found')`); apply fields; if `isDefault` set, clear others; `save`; return the updated address.
  - [ ] `setDefaultAddress(userId, addressId)` *(new)* — ownership-check; set chosen `isDefault = true` and all the user's others `false` (single transaction); return the full updated list (for `{ data: Address[] }`).
  - [ ] `removeAddress(userId, addressId)` — ownership-check then `remove`; return `{ message: 'Address removed' }`.
  - [ ] In `user.module.ts` add `Address` to `TypeOrmModule.forFeature([User, Address])`, inject `@InjectRepository(Address)`.

- [ ] **Task 4: Create `UsersController` (NEW)** (AC2, AC3, AC4, AC6)
  - [ ] `@Controller('users')`, every route `@UseGuards(AuthGuard('jwt'))`; read the user via `(req as Request & { user: User }).user` like `auth.controller.ts` `me()`.
  - [ ] Routes (UNPREFIXED): `PATCH profile` → `updateProfile`; `GET addresses` → `getAddresses` (wrap as `{ data }`); `POST addresses` → `addAddress`; `PATCH addresses/:id` → `editAddress(req.user.id, +id, dto)` *(new)*; `PATCH addresses/:id/default` → `setDefaultAddress(req.user.id, +id)` returning `{ data }` *(new)*; `DELETE addresses/:id` → `removeAddress`.
  - [ ] Register the controller in `user.module.ts`.

- [ ] **Task 5: Backend tests** (`*.spec.ts`)
  - [ ] `user.service.spec.ts` — `updateProfile` updates only provided fields + never returns sensitive fields; `addAddress` throws `ConflictException` at the 3rd address; `setDefaultAddress` flips the chosen row to default and clears the others; `editAddress`/`removeAddress` throw `NotFoundException` when the address belongs to another user. Mock the repositories (Jest, `node` env).

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

> ✅ **Resolved 2026-06-26 (correct-course → Option B):** the account form will **not** collect Postal Code / Country / State. Checkout (Story 4.2) collects Postal Code; Country is a fixed single-market constant; State dropped. Build `addresses` with `postal_code`/`country` **nullable** — this is the intended final state. Consequence for Story 4.1: the order's `shippingAddress` JSON is built from the completed checkout form, so its create body must carry the full address (not `shippingAddressId` alone). See `planning-artifacts/sprint-change-proposal-2026-06-26-address-field-set.md` §6.

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

### Debug Log References

### Completion Notes List

### File List

### Change Log

- 2026-06-26 — **As-built reconciliation** to the shipped frontend contract (backend not yet built). Address field set `{ fullName, line1, city, state, postalCode, country }` → `{ firstName, lastName, street, city }` + `isDefault`, with `postal_code`/`country` made nullable and `state` dropped. Added `is_default` column, edit (`PATCH /users/addresses/:id`) and set-default (`PATCH /users/addresses/:id/default`) endpoints + service methods + tests. ⚠️ The field-set reduction conflicts with Epic 4 / Story 4.2 checkout — flagged for `correct-course` (see "Address entity field set" Dev Note).
