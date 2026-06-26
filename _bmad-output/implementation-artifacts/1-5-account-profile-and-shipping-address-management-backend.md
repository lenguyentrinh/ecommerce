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

## Story

As a shopper,
I want to view and edit my profile and save up to two shipping addresses,
So that checkout is faster and my personal details are always current.

## Acceptance Criteria

All five ACs are listed for full context; the backend directly satisfies **AC2, AC3, AC4** (the API behaviors). AC1/AC5 are frontend-owned but constrain the contract this API must honor.

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

## API Contract (what the frontend depends on)

These shapes are the seam between the two split stories — keep them exact:

- `PATCH /users/profile` → body `{ userName?, phoneNumber? }` (NO `email`) → returns the sanitized user `{ id, userName, email, phoneNumber, role }`.
- `GET /users/addresses` → returns `{ data: Address[] }` (never a raw top-level array).
- `POST /users/addresses` → body `{ fullName, line1, city, state, postalCode, country }` → returns the created `Address`. At the 3rd address throw `ConflictException('Maximum 2 addresses reached')`.
- `DELETE /users/addresses/:id` → returns `{ message: 'Address removed' }`; `NotFoundException('Address not found')` when the address is missing or owned by another user.
- All routes are **UNPREFIXED** (`/users/...`, NOT `/api/users/...`) and guarded by `@UseGuards(AuthGuard('jwt'))`.

## Tasks / Subtasks

### Backend (NestJS — all NEW; no users endpoints exist today)

- [ ] **Task 1: Create `Address` entity + User relation + migration** (AC3, AC4)
  - [ ] Create `backend/src/modules/users/entities/address.entity.ts` — TypeORM `@Entity('addresses')`, class `Address`. Columns (match Epic 4 / Story 4.2 checkout field set so checkout can reuse via `shippingAddressId`): `id` (PK), `fullName`, `line1`, `city`, `state`, `postalCode`, `country` (all `varchar`, NOT NULL), `createAt` (`@CreateDateColumn`), and `@ManyToOne(() => User, ...)` with `@JoinColumn({ name: 'user_id' })` + a `userId` column. Use `snake_case` DB column names via `{ name: '...' }` on `@Column` (e.g. `full_name`, `postal_code`, `user_id`) per architecture DB-naming rule.
  - [ ] In `user.entity.ts` add the inverse side: `@OneToMany(() => Address, (a) => a.user) addresses: Address[];` (do NOT eager-load by default). While in this file, fix the existing `@Column({ nullable: true }) phoneNumber!: string;;` line: drop the stray double-semicolon and align the type to `string | null` (the column is nullable, so the sanitized-user return should be `string | null` to match the frontend `User.phoneNumber`).
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

## Dev Notes

### Story shape: this is a FULL-STACK story (unlike 1.4)

Story 1.4 was frontend-only. **Story 1.5 builds real backend**: the `addresses` table + entity, a brand-new `UsersController`, new `UserService` methods, and DTOs — none of which exist today. Budget accordingly; do the backend first so the frontend can integrate against working endpoints.

### CRITICAL: API prefix — use UNPREFIXED routes (`/users/...`), not `/api/users/...`

The epic AC text says `PATCH /api/users/profile`, `POST /api/users/addresses`, etc. **Reality check on the live system:**
- `backend/src/main.ts` does **NOT** call `app.setGlobalPrefix('api')`. Existing live routes are `/auth/login`, `/auth/me`, `/auth/logout` — **no `/api`**.
- The frontend `authAPI.ts` calls them **unprefixed** (`api.post('/auth/login')`) against `baseURL = NEXT_PUBLIC_API_URL`.
- Therefore the `/api` in the epic is **figurative/aspirational** (same situation as Story 1.4 treating "token is stored client-side" as figurative for cookie auth).

**Mandate:** Implement the controller as `@Controller('users')` (→ `/users/profile`, `/users/addresses`). **Do NOT add `app.setGlobalPrefix('api')`** in this story — doing so would silently break every existing `/auth/*` call across the app (login, signup, verify, me, logout). Reconciling the architecture's intended `/api` prefix is a separate, cross-cutting task (flagged below). Keeping the system working end-to-end takes priority over matching the literal AC string.

### Address entity field set — align to Epic 4 checkout (Story 4.2)

The epic does NOT enumerate address fields, and the UX `EXPERIENCE.md` explicitly defers account/checkout flows. The canonical field set comes from **Epic 4, Story 4.2 (Checkout Step 1 — Shipping Address)**: *Full Name, Address Line 1, City, State, Postal Code, Country*. Use exactly these so a saved address can be referenced at checkout via `shippingAddressId` (Epic 4, Story 4.1 order creation expects `shippingAddressId`). Do not invent extra fields (no `line2`, no per-address phone) — keep it identical to the checkout form to avoid a schema mismatch later.
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
- No new address-edit endpoint (`PATCH /users/addresses/:id`) — AC only covers add + remove. Edit = delete + re-add for MVP.
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
