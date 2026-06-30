# Story 3.1: Cart Backend — Entity, API & Inventory Reserve

---
baseline_commit: f8368ff
---

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want my cart to be stored server-side when I'm logged in,
so that my items are preserved across devices and sessions.

> This is a **backend-only** story (NestJS 11 + TypeORM 0.3.28 + MySQL). It establishes the `CartModule` (a `cart_items` table + authenticated CRUD API) and the `inventory_reserves` table + a scheduled cleanup cron. It is the first **authenticated write** surface in the shopper flow — every endpoint is JWT-guarded and ownership-scoped. The frontend (Story 3.2 Cart UI) and persistence/merge (Story 3.3) consume the API contract defined here, so honour the response shapes precisely. **No frontend work here.** The "Add to Cart" buttons already rendered in Stories 2.2/2.3 are wired to this API in **3.2**.

## Acceptance Criteria

1. **CartItem entity & migration** — A `CartModule` is scaffolded with a `CartItem` entity: `id` (PK, auto-increment int), `userId` (FK → `users.id`), `productId` (FK → `products.id`), `quantity` (int, ≥1), `createdAt`, `updatedAt`. A TypeORM migration creates the `cart_items` table with indexes on `user_id` and `product_id` and a **unique constraint on `(user_id, product_id)`** (one row per product per user — add-to-cart increments). `synchronize: false` remains untouched.

2. **inventory_reserves table + cron cleanup** — A migration creates an `inventory_reserves` table: `id` (PK), `productId` (FK → `products.id`), `sessionId` (varchar), `quantity` (int), `expiresAt` (datetime), `createdAt`. `@nestjs/schedule` is installed, `ScheduleModule.forRoot()` is registered in `AppModule`, and a `@Cron(CronExpression.EVERY_5_MINUTES)` job deletes rows where `expiresAt < NOW()`. **Scope note:** this story only *creates* the table + the cleanup job; the **reserve/release logic that populates it is Epic 4 (checkout)** — see Dev Notes → Scope boundaries. The cron must run safely against an empty table.

3. **Add to cart — `POST /api/cart`** — Authenticated. Body `{ productId: number, quantity: number }`. If the product is active (`isActive === true`, not soft-deleted) **and** the resulting quantity (existing + requested, or the new row's quantity) does not exceed `product.stockQuantity`: create a `CartItem` or increment the existing one for that `(userId, productId)`. Return the **updated full cart** (same shape as AC4). If the product is missing/inactive → **404**. If the resulting quantity would exceed stock → **400** `"Insufficient stock"`. Invalid body (non-numeric/﹤1 `quantity`, missing `productId`) → **400** via the global `ValidationPipe`.

4. **Read cart — `GET /api/cart`** — Authenticated. Returns the authenticated user's cart shaped **exactly**:
   ```json
   {
     "items": [
       { "id": 10, "product": { "id": 1, "name": "…", "price": 189000, "imageUrl": "/images/placeholders/…svg",
                       "stockQuantity": 7, "isActive": true }, "quantity": 2 }
     ],
     "subtotal": 378000
   }
   ```
   Each line carries `id` — the **`cart_items` row id** (distinct from `product.id`) — so the frontend (3.2) can target `PATCH`/`DELETE /api/cart/:itemId` for that line. Without it the qty +/– and remove controls have no id to call.
   `imageUrl` is generated at read time from the product's stored `imageKeys` (first image; **never persisted** — reuse the Products image-URL logic). `subtotal` = Σ `product.price × quantity` over all items (a JS `number`). Items are returned **even when** `stockQuantity === 0` or `isActive === false` so the frontend (3.3) can warn — do **not** silently drop them. Empty cart → `{ "items": [], "subtotal": 0 }`.

5. **Update quantity — `PATCH /api/cart/:itemId`** — Authenticated, ownership-scoped. Body `{ quantity: number }`. If `quantity > 0` and `≤ product.stockQuantity`: update. If `quantity === 0`: **remove** the item. If `quantity > product.stockQuantity`: **400** `"Insufficient stock"`. If `:itemId` is not a positive int → **400** (`ParseIntPipe`). If the item doesn't exist **or belongs to another user** → **404** `"Cart item not found"` (no row leakage). Returns the updated full cart (AC4 shape).

6. **Remove item — `DELETE /api/cart/:itemId`** — Authenticated, ownership-scoped. Removes the item (404 if missing/other-user, same as AC5). Returns the updated full cart (AC4 shape).

7. **No regressions / system stays working** — All existing routes (`/auth/*`, `/api/products/**`, `/users/*`) keep working. **Do NOT add `app.setGlobalPrefix('api')`** (see Dev Notes → API prefix). `synchronize: false` and `migrationsRun: false` stay. `pnpm`/`npm` discipline: the **backend is npm-managed** (`npm run …`). `npm run migration:run` applies cleanly; `npm test` and `npm run lint` are green.

## Tasks / Subtasks

- [x] **Task 1 — Install & register `@nestjs/schedule` (AC: #2, #7)**
  - [x] From `backend/`: `npm install @nestjs/schedule` (it is **not** currently a dependency; backend is npm-managed, Nest 11).
  - [x] In `backend/src/app.module.ts`, add `ScheduleModule.forRoot()` to `imports`, alongside the new `CartModule` and `InventoryModule` (Task 5/6). Do not remove existing imports (`ConfigModule`, `DatabaseModule`, `AuthModule`, `ProductsModule`, `ThrottlerModule`) or the global `ThrottlerGuard`/`RolesGuard` providers.

- [x] **Task 2 — `CartItem` entity (AC: #1)**
  - [x] Create `backend/src/modules/cart/entities/cart-item.entity.ts` — `@Entity('cart_items')`, class `CartItem`. Mirror `address.entity.ts` conventions: **camelCase TS properties, snake_case DB column names via `@Column({ name: '…' })`** for FK columns. Columns: `@PrimaryGeneratedColumn() id`; `@Column({ name: 'user_id' }) userId: number`; `@Column({ name: 'product_id' }) productId: number`; `@Column({ type: 'int' }) quantity: number`; `@CreateDateColumn` / `@UpdateDateColumn`.
  - [x] Relations: `@ManyToOne(() => User, …)` + `@JoinColumn({ name: 'user_id' })`; `@ManyToOne(() => Product, …)` + `@JoinColumn({ name: 'product_id' })`. Do **not** eager-load. (Add the inverse `@OneToMany` on `User`/`Product` only if convenient — not required.)
  - [x] No soft delete on cart items (a removed cart item is a hard delete — see AC5/AC6).

- [x] **Task 3 — `InventoryReserve` entity + scheduler (AC: #2)**
  - [x] Create `backend/src/modules/inventory/entities/inventory-reserve.entity.ts` — `@Entity('inventory_reserves')`, class `InventoryReserve`: `id` PK; `@Column({ name: 'product_id' }) productId: number` + `@ManyToOne(Product)`/`@JoinColumn`; `@Column({ name: 'session_id' }) sessionId: string`; `@Column({ type: 'int' }) quantity: number`; `@Column({ name: 'expires_at', type: 'datetime' }) expiresAt: Date`; `@CreateDateColumn`.
  - [x] Create `backend/src/modules/inventory/inventory.service.ts` (`@Injectable`, `@InjectRepository(InventoryReserve)`) with a `releaseExpired(): Promise<number>` method that deletes rows where `expiresAt < NOW()` (`this.repo.delete({ expiresAt: LessThan(new Date()) })`) and returns the affected count. Wrap in try/catch → log via Nest `Logger` (never `console.log`).
  - [x] Create `backend/src/modules/inventory/inventory.scheduler.ts` (`@Injectable`) with `@Cron(CronExpression.EVERY_5_MINUTES) async cleanup()` calling `inventoryService.releaseExpired()` and logging the count. Must be a no-op-safe call against an empty table.
  - [x] **Do NOT implement reserve/release-on-checkout here** — that is Epic 4 (see Dev Notes → Scope boundaries). Only the table, the entity, and the expiry-cleanup cron are in scope.

- [x] **Task 4 — Migration(s) (AC: #1, #2)**
  - [x] Create `backend/src/database/migrations/{timestamp}-CreateCartAndInventory.ts` with a `{timestamp}` **numerically greater than `1787000000000`** (the current latest — `1787000000000-CreateAddresses.ts`). Use e.g. `1787100000000`. Class name `CreateCartAndInventory{timestamp}`, `name = '…'`.
  - [x] Follow the **defensive guard** style of the existing migrations: in `up()` guard each `CREATE TABLE` with `if (!(await queryRunner.getTable('cart_items'))) { … }`; in `down()` guard each `DROP TABLE` with the inverse. Two tables in one migration is fine.
  - [x] `cart_items` SQL: `id` PK AUTO_INCREMENT; `user_id` int NOT NULL; `product_id` int NOT NULL; `quantity` int NOT NULL; `createdAt`/`updatedAt` timestamps; `KEY idx_cart_items_user_id (user_id)`; `KEY idx_cart_items_product_id (product_id)`; **`UNIQUE KEY uq_cart_items_user_product (user_id, product_id)`**; FK `fk_cart_items_user` → `users(id)` ON DELETE CASCADE; FK `fk_cart_items_product` → `products(id)` ON DELETE CASCADE. (Match the column-name casing used by the existing `addresses`/`products` tables — verify whether timestamp columns are `createdAt`/`createAt`/`created_at` in the live schema and match it.)
  - [x] `inventory_reserves` SQL: `id` PK; `product_id` int NOT NULL; `session_id` varchar(255) NOT NULL; `quantity` int NOT NULL; `expires_at` datetime NOT NULL; `createdAt` timestamp; `KEY idx_inventory_reserves_product_id (product_id)`; `KEY idx_inventory_reserves_session_id (session_id)`; FK `fk_inventory_reserves_product` → `products(id)` ON DELETE CASCADE.
  - [x] Run `npm run migration:run` and confirm both tables + indexes + constraints exist. `migrationsRun: false` stays — migrations are applied manually.

- [x] **Task 5 — DTOs (AC: #3, #5)**
  - [x] `backend/src/modules/cart/dto/add-cart-item.dto.ts` — `export default class AddCartItemDto`: `productId` (`@IsInt` `@IsPositive`, message), `quantity` (`@IsInt` `@IsPositive` `@Max(<reasonable cap, e.g. 99>)`, message). Use `@Type(() => Number)` for coercion (mirrors `product-query.dto.ts`).
  - [x] `backend/src/modules/cart/dto/update-cart-item.dto.ts` — `export default class UpdateCartItemDto`: `quantity` (`@IsInt` `@Min(0)` `@Max(99)`, message — **0 is allowed** and means "remove" per AC5). `@Type(() => Number)`.
  - [x] The global `ValidationPipe` runs `{ whitelist: true, forbidNonWhitelisted: true, transform: true }` — declare every accepted field or the request 400s.

- [x] **Task 6 — `CartService` (AC: #3, #4, #5, #6)**
  - [x] Create `backend/src/modules/cart/cart.service.ts` (`@Injectable`). Inject `@InjectRepository(CartItem)`, the `Product` repository (or `ProductsService` — see Dev Notes → Image URLs), and a `DataSource` (for transactions).
  - [x] `getCart(userId)` → load the user's `CartItem`s (join product), map to the AC4 shape (`{ items: [{ product: {id,name,price,imageUrl,stockQuantity,isActive}, quantity}], subtotal }`), generate `imageUrl` at read time, compute `subtotal`. Empty → `{ items: [], subtotal: 0 }`.
  - [x] `addItem(userId, dto)` → **in a `queryRunner` transaction** (atomicity — see Dev Notes → Concurrency): load the product (active only) → 404 if missing/inactive; compute target quantity (existing row's qty + dto.quantity, or dto.quantity for a new row); if target > `product.stockQuantity` → `BadRequestException('Insufficient stock')`; upsert the `(userId, productId)` row; then return `getCart(userId)`.
  - [x] `updateItem(userId, itemId, dto)` → find the **owned** item (`{ id: itemId, userId }`) → 404 if missing/other-user; if `dto.quantity === 0` → remove; else load product, if `dto.quantity > product.stockQuantity` → 400 `Insufficient stock`, else update; return `getCart(userId)`.
  - [x] `removeItem(userId, itemId)` → find owned item → 404 if missing/other-user; delete; return `getCart(userId)`.
  - [x] Wrap DB ops in try/catch converting `QueryFailedError` → Nest HTTP exception (Rule 4); let unexpected errors bubble. Use generic `NotFoundException('Cart item not found')` for ownership failures (no row leakage).

- [x] **Task 7 — `CartController` (AC: #3, #4, #5, #6, #7)**
  - [x] Create `backend/src/modules/cart/cart.controller.ts` — **`@Controller('api/cart')`** (controller-level `api/` prefix — there is **no** global prefix; mirrors `@Controller('api/products')`). `@UseGuards(AuthGuard('jwt'))` at the class level. Read the user via `(req as Request & { user: User }).user` and use `req.user.id` for all scoping (copy the `users.controller.ts` pattern).
  - [x] Routes: `@Post()` → `addItem`; `@Get()` → `getCart`; `@Patch(':itemId')` with `@Param('itemId', ParseIntPipe)` → `updateItem`; `@Delete(':itemId')` with `ParseIntPipe` → `removeItem`.
  - [x] Each handler returns the service result directly (the service returns the AC4 cart shape / `{ items, subtotal }`). Do **not** rely on a global response interceptor — none exists; shape responses explicitly.

- [x] **Task 8 — Module wiring (AC: #1, #2, #7)**
  - [x] `backend/src/modules/cart/cart.module.ts` — `TypeOrmModule.forFeature([CartItem])`, `controllers: [CartController]`, `providers: [CartService]`. Import `ProductsModule` (which **exports `ProductsService`**) if reusing the image-URL logic.
  - [x] `backend/src/modules/inventory/inventory.module.ts` — `TypeOrmModule.forFeature([InventoryReserve])`, `providers: [InventoryService, InventoryScheduler]`, `exports: [InventoryService]` (Epic 4 will consume it).
  - [x] Register both modules + `ScheduleModule.forRoot()` in `AppModule`.

- [x] **Task 9 — Tests (AC: all)**
  - [x] `cart.service.spec.ts` (Jest, mocked repos/`DataSource`, `node` env — follow `products.service.spec.ts` / `user.service.spec.ts`): add increments existing qty; add beyond stock → `BadRequestException`; add inactive/missing product → `NotFoundException`; `getCart` computes subtotal + maps imageUrl; update to 0 removes; update beyond stock → 400; update/remove on another user's item → `NotFoundException`; empty cart → `{items:[],subtotal:0}`.
  - [x] `inventory.service.spec.ts`: `releaseExpired` issues a delete with a `LessThan(now)` condition and returns the count.
  - [x] (Optional) DTO validation tests (`plainToInstance` + `validate`) for `quantity` bounds, mirroring the `ProductQueryDto` validation tests.
  - [x] `npm run lint` and `npm test` green.

## Dev Notes

### ⚠️ CRITICAL: the architecture doc is STALE — build against AS-BUILT reality

A research pass found the architecture docs (`implementation-patterns-consistency-rules.md`, `core-architectural-decisions.md`, `project-structure-boundaries.md`) **contradict the live codebase** on several structural points. **The live code is the source of truth.** Do NOT follow the doc where it conflicts:

| Architecture doc says | ❌ | **AS-BUILT reality (follow this)** | Source |
|---|---|---|---|
| Global `/api` prefix via `setGlobalPrefix('api')` | ❌ | **No global prefix.** Controllers self-prefix: `@Controller('api/products')`, `@Controller('auth')`, `@Controller('users')`. Adding a global prefix **breaks `/auth/*`** | `main.ts`; `products.controller.ts:7-9` comment |
| snake_case columns | ❌ | **camelCase TS props; `@Column({ name: 'snake_case' })` for FK/bool only** | `address.entity.ts`, `product.entity.ts` |
| UUID primary keys | ❌ | **`@PrimaryGeneratedColumn()` auto-increment int** | `product.entity.ts`, `address.entity.ts` |
| `export class …Dto` (named) | ❌ | **`export default class …Dto`** | `login.dto.ts`, `product-query.dto.ts` |
| `migrationsRun: true` | ❌ | **`migrationsRun: false`** (run `npm run migration:run` manually) | `database.config.ts` |
| Global `ResponseTransformInterceptor` / `HttpExceptionFilter` wrap responses | ❌ | **Neither exists.** Shape `{ data }` / `{ items, subtotal }` **manually** in each handler (as `products.controller.ts` does) | `main.ts`, `products.controller.ts` |

> This reconciliation is itself a follow-through on the **Epic 2 retrospective Action #1** (reconcile the architecture doc to as-built). Until that doc is fixed, treat this table as authoritative for backend work.

### API prefix — `@Controller('api/cart')`, NOT a global prefix (regression guardrail)

`main.ts` has **no** `app.setGlobalPrefix('api')`. The frontend axios client calls `/auth/*` and `/users/*` unprefixed and `/api/products` via the controller-level prefix. To expose the cart at `/api/cart`, use **`@Controller('api/cart')`** — exactly as `products.controller.ts` does (which carries an explicit code comment explaining this). Adding a global prefix would rewrite `/auth/login` → `/api/auth/login` and break the shipped login/auth flow. [Source: 2-1-product-entity-api-and-seed-data.md#Regression guardrail; backend/src/main.ts]

### Established backend patterns to copy (verified against live code)

- **Entity:** `@PrimaryGeneratedColumn() id: number`; camelCase props; FK columns `@Column({ name: 'user_id' })`; relations via `@ManyToOne` + `@JoinColumn({ name: 'user_id' })`; FK constraint naming `fk_{table}_{ref}` (e.g. `fk_cart_items_user`). [Source: backend/src/modules/users/entities/address.entity.ts]
- **Decimal/number:** `product.price` is already a JS `number` via `ColumnNumericTransformer` (`backend/src/common/utils/column-numeric.transformer.ts`) — so `subtotal = Σ price × quantity` is plain number math, no `parseFloat`. [Source: product.entity.ts:25-31]
- **DTO:** `export default class`, class-validator with user-facing `{ message }`, `@Type(() => Number)` for coercion. [Source: product-query.dto.ts, login.dto.ts]
- **Service:** constructor `@InjectRepository(...)`; throw `NotFoundException`/`ConflictException`/`BadRequestException`; ownership via a private `findOwned…` helper that throws generic `NotFoundException` for missing OR other-user rows. [Source: user.service.ts:94-98,159-171]
- **Controller:** `@UseGuards(AuthGuard('jwt'))` at class level; `private currentUser(req) { return (req as Request & { user: User }).user; }`; `@Param('itemId', ParseIntPipe)`. [Source: users.controller.ts:21-29; products.controller.ts:25-28]
- **Migration:** defensive `up()`/`down()` guarding with `queryRunner.getTable(...)`; class `Name{timestamp}` with matching `name`. Latest existing timestamp is **`1787000000000`** — use a larger one. [Source: backend/src/database/migrations/]
- **App wiring:** global `ValidationPipe({ whitelist:true, forbidNonWhitelisted:true, transform:true })`; global `ThrottlerGuard` (60/min) + `RolesGuard`; `synchronize:false`, `autoLoadEntities:true`, migrations glob. [Source: main.ts, app.module.ts, database.config.ts]
- **Tests:** `Test.createTestingModule` + `{ provide: getRepositoryToken(Entity), useValue: mockRepo }`; chainable QueryBuilder mocks; `plainToInstance` + `validate` for DTO tests. [Source: products.service.spec.ts, user.service.spec.ts]

### `@nestjs/schedule` — NOT yet installed

It is not in `backend/package.json` (Nest 11, TypeORM 0.3.28). Install with `npm install @nestjs/schedule`, register `ScheduleModule.forRoot()` once in `AppModule`, and use `@Cron(CronExpression.EVERY_5_MINUTES)` in `InventoryScheduler`. First scheduled feature in the repo — keep it isolated in the `inventory` module. [Source: backend/package.json]

### Concurrency / atomicity (carry-forward from the 1.5 backend review)

The 1.5 review flagged **non-atomic check-then-write** (`count()`-then-`save()` is a race). The cart's add path has the same hazard: *check stock → write cart row* can interleave with a concurrent add and overbook. **Wrap `addItem` (and the stock-validated `updateItem`) in a `DataSource.createQueryRunner()` transaction**, re-reading the product inside the transaction. (Note: 3.1 does **not** decrement product stock — it only validates against `product.stockQuantity`; real stock reservation/decrement is Epic 4. The transaction here protects the cart row upsert + the read it depends on.) [Source: 1-5-…-backend.md#Review Findings — "Default-mutations are not atomic"]

### Image URLs at read time (reuse Products logic — don't duplicate)

`GET /api/cart` returns `product.imageUrl` (singular — the **first** image). The Products module already computes read-time image URLs from `imageKeys` using `PRODUCT_IMAGE_BASE_URL` (`products.service.ts` `toResponse()`). `ProductsModule` **exports `ProductsService`** — import `ProductsModule` into `CartModule` and reuse that logic (or extract a shared helper) rather than re-implementing the base-URL join. Never persist URLs. [Source: products.service.ts; products.module.ts exports]

### Scope boundaries — what is NOT in this story

- **No `POST /api/cart/merge`.** The guest-cart merge endpoint is needed by **Story 3.3** (localStorage `oren_cart` → server cart on login, quantities summed & capped). It is **not** in 3.1's ACs. Design `CartService.addItem`/`getCart` so 3.3 can build merge on top, but do not implement merge here. [Source: epic-3-shopping-cart.md#Story 3.3]
- **No reserve/release logic.** This story creates the `inventory_reserves` table + the expiry-cleanup cron only. Populating reserves (reserve-at-checkout-start, release-on-payment-fail, decrement-on-payment-success, ~15-min TTL) is **Epic 4 (checkout)**. The architecture docs describe that full lifecycle as forward-looking context. [Source: epic-3-shopping-cart.md#Story 3.1 AC2; architecture process docs]
- **No stock decrement.** Per PRD, stock is decremented **on order confirmation** (Epic 4), never on cart-add. Cart only validates against current `product.stockQuantity`. [Source: prd/assumptions-constraints.md — "Stock decremented upon order confirmation"]
- **No guest cart.** All 3.1 endpoints are JWT-authenticated. Guest (localStorage) cart is client-side in 3.3. (PRD: registration required for checkout; no true guest checkout in MVP.) [Source: prd/assumptions-constraints.md]
- **No shipping/tax.** `subtotal` only. Flat $5 shipping + 10% tax are computed in the **UI** (3.2) / order backend (Epic 4). [Source: epic-3 Story 3.2; prd/assumptions-constraints.md]

### Out-of-stock & inactive items in the cart response

`GET /api/cart` returns items **even if** `stockQuantity === 0` or `isActive === false`, including the current `stockQuantity`/`isActive` so the frontend (3.3) can render the "Out of stock" warning and disable checkout. Do not filter them out and do not error. `subtotal` is computed over all items (the frontend gates checkout eligibility). [Source: epic-3 Story 3.3 AC3]

### Module structure (decision)

Two modules for a clean Epic 4 boundary:
- `backend/src/modules/cart/` — `cart.module.ts`, `cart.controller.ts`, `cart.service.ts`, `entities/cart-item.entity.ts`, `dto/add-cart-item.dto.ts`, `dto/update-cart-item.dto.ts`, `cart.service.spec.ts`.
- `backend/src/modules/inventory/` — `inventory.module.ts`, `inventory.service.ts`, `inventory.scheduler.ts`, `entities/inventory-reserve.entity.ts`, `inventory.service.spec.ts`.

This matches the architecture's intended module boundaries and isolates the cron + the (Epic-4) reserve service from cart CRUD.

### File Locations Reference

| Action | Path |
|---|---|
| NEW | `backend/src/modules/cart/cart.module.ts` |
| NEW | `backend/src/modules/cart/cart.controller.ts` |
| NEW | `backend/src/modules/cart/cart.service.ts` |
| NEW | `backend/src/modules/cart/entities/cart-item.entity.ts` |
| NEW | `backend/src/modules/cart/dto/add-cart-item.dto.ts` |
| NEW | `backend/src/modules/cart/dto/update-cart-item.dto.ts` |
| NEW | `backend/src/modules/cart/cart.service.spec.ts` |
| NEW | `backend/src/modules/inventory/inventory.module.ts` |
| NEW | `backend/src/modules/inventory/inventory.service.ts` |
| NEW | `backend/src/modules/inventory/inventory.scheduler.ts` |
| NEW | `backend/src/modules/inventory/entities/inventory-reserve.entity.ts` |
| NEW | `backend/src/modules/inventory/inventory.service.spec.ts` |
| NEW | `backend/src/database/migrations/{>1787100000000}-CreateCartAndInventory.ts` |
| UPDATE | `backend/src/app.module.ts` (register `CartModule`, `InventoryModule`, `ScheduleModule.forRoot()`) |
| UPDATE | `backend/package.json` (`@nestjs/schedule` dependency) |

### Testing standards

- Jest, `*.spec.ts`, `node` env; mock repositories via `getRepositoryToken`; mock `DataSource`/`queryRunner` for the transactional `addItem` (the runner's `manager`/`commit`/`rollback`/`release`). Follow `products.service.spec.ts` and `user.service.spec.ts`. Backend is **npm** (`npm test`, `npm run lint`) — not pnpm (that's the frontend). [Source: backend/package.json]

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-shopping-cart.md#Story 3.1] — acceptance criteria (authoritative); #Story 3.2/3.3 — downstream consumers of this API.
- [Source: _bmad-output/implementation-artifacts/2-1-product-entity-api-and-seed-data.md] — no-global-`/api`-prefix guardrail, response-shape rules, `ColumnNumericTransformer`, validation-hardening review patterns.
- [Source: _bmad-output/implementation-artifacts/1-5-account-profile-and-shipping-address-management-backend.md] — JWT guard + `req.user` pattern, ownership-scoping helper, non-atomic-mutation transaction finding, `ParseIntPipe`, Rule-4 try/catch.
- [Source: backend/src/modules/users/users.controller.ts, user.service.ts] — auth controller + ownership service patterns.
- [Source: backend/src/modules/products/products.controller.ts, products.service.ts, products.module.ts] — `@Controller('api/...')` prefix, read-time image URLs, exported service.
- [Source: backend/src/modules/users/entities/address.entity.ts] — entity/relation/FK pattern to mirror.
- [Source: backend/src/database/migrations/] — defensive migration style; latest timestamp `1787000000000`.
- [Source: backend/src/main.ts, app.module.ts, database/database.config.ts] — global ValidationPipe, guards, `synchronize:false`/`migrationsRun:false`.
- [Source: _bmad-output/planning-artifacts/prds/prd-ecommerce-2026-06-22/prd/] — stock-on-confirmation, flat shipping/tax, registration-required, cart-inventory sync NFR.
- [Source: _bmad-output/project-context/critical-implementation-rules.md] — Rule 4 (wrap DB ops), toast/response conventions.
- [Source: _bmad-output/implementation-artifacts/epic-2-retro-2026-06-30.md] — Action #1 (reconcile architecture doc) context for the stale-doc warning above.

## Questions / Clarifications for the Team

1. **`inventory_reserves` in 3.1 vs Epic 4.** This story creates the table + cleanup cron but leaves reserve/release unimplemented (Epic 4 owns it). Confirm that's the intended split, or should 3.1 also stub a `reserve()`/`release()` service surface for Epic 4 to fill? **Recommendation:** table + cron only now; build reserve/release in Epic 4 where the checkout flow defines the TTL and call sites.
2. **Quantity cap.** I propose a per-line `@Max(99)` sanity cap on `quantity` (stock is the real ceiling). Confirm a cap value, or drop it and rely solely on stock validation.
3. **`(user_id, product_id)` uniqueness.** AC3 "create or increment" implies one row per product per user — I've specified a unique constraint + upsert. Confirm that's the desired model (vs allowing multiple lines per product).
4. **Subtotal over out-of-stock items.** `subtotal` currently sums **all** items (including `stockQuantity === 0`), with the frontend gating checkout. Confirm, or should the backend exclude out-of-stock items from `subtotal`? **Recommendation:** sum all; let the UI handle checkout eligibility (3.3).

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Bruno — backend dev agent)

### Debug Log References

- `pnpm test` (full backend suite) → **7 suites / 51 tests pass**, no regressions (was 4 suites pre-story; +3: cart.service, inventory.service, + existing). 2 new suites for this story.
- `npx eslint` on all new files (`modules/cart/**`, `modules/inventory/**`, the migration, `app.module.ts`) → **0 problems**. (Pre-existing repo-wide lint debt in `auth.service.ts`/`jwt.strategies.ts`/`mail.service.ts` is untouched and out of scope — same debt 2.2/2.4 scoped out.)
- `npx tsc --noEmit` → **0 errors** (whole project type-checks).
- `pnpm migration:run` → **executed successfully against the live MySQL** — `cart_items` and `inventory_reserves` tables created with all indexes/constraints; recorded in the `migrations` table.

### Completion Notes List

- **All 9 tasks complete and tested.** Cart CRUD API at `@Controller('api/cart')` (no global prefix — mirrors `ProductsController`), JWT-guarded, ownership-scoped via `req.user.id`.
- **AC coverage:** AC1 (`CartItem` + `cart_items` migration, `(user_id, product_id)` unique + indexes) ✓ migration ran; AC2 (`inventory_reserves` table + `@nestjs/schedule` `ScheduleModule.forRoot()` + `@Cron(EVERY_5_MINUTES)` cleanup) ✓; AC3 (`POST` add/increment, stock check → 400, missing/inactive → 404) ✓ tests; AC4 (`GET` → `{items:[{product:{id,name,price,imageUrl,stockQuantity,isActive},quantity}],subtotal}`, read-time imageUrl, empty → `{items:[],subtotal:0}`) ✓ tests; AC5 (`PATCH` qty>0 update / ===0 remove / >stock 400, `ParseIntPipe`, other-user → 404) ✓ tests; AC6 (`DELETE` remove, other-user → 404) ✓ tests; AC7 (no regressions, no global prefix, `synchronize`/`migrationsRun` untouched) ✓.
- **Concurrency:** `addItem` runs in a `DataSource` transaction (re-reads the product inside the tx) — the carry-forward fix for the 1.5 non-atomic check-then-write finding.
- **Image URLs** are generated at read time in `CartService` from `product.imageKeys[0]` using `PRODUCT_IMAGE_BASE_URL` (same base-url pattern as `ProductsService`); `GET /api/cart` uses `withDeleted: true` on the product lookup so a deactivated/soft-deleted product still surfaces (with `isActive:false`/current stock) for the 3.3 out-of-stock UI rather than vanishing.
- **⚠️ Story Dev-Note correction:** the story Dev Notes state "the backend is npm-managed." **That is wrong — the backend is pnpm-managed** (`backend/pnpm-lock.yaml` + a `.pnpm` store; `npm install` crashes with `Cannot read properties of null (reading 'matches')` on the pnpm-shaped `node_modules`). Used `pnpm add @nestjs/schedule` (→ `@nestjs/schedule@6.1.3`) and `pnpm test` / `pnpm lint`. The "backend = npm" assumption was inherited from Story 2.1's illustrative `npm run …` examples; the real package manager is pnpm. (Feeds the Epic 2 retro Action #1 — doc/assumption vs as-built.)
- **Scope held:** no `/api/cart/merge` (3.3), no reserve/release population or stock decrement (Epic 4), no guest cart, no shipping/tax — only `subtotal` is computed. The 4 open Questions in this story (reserve split, quantity cap, row-uniqueness, subtotal-over-OOS) were implemented per the story's stated recommendations; flag at review if a different call is wanted.

### File List

**Added**
- `backend/src/modules/cart/entities/cart-item.entity.ts`
- `backend/src/modules/cart/dto/add-cart-item.dto.ts`
- `backend/src/modules/cart/dto/update-cart-item.dto.ts`
- `backend/src/modules/cart/cart.service.ts`
- `backend/src/modules/cart/cart.service.spec.ts`
- `backend/src/modules/cart/cart.controller.ts`
- `backend/src/modules/cart/cart.module.ts`
- `backend/src/modules/inventory/entities/inventory-reserve.entity.ts`
- `backend/src/modules/inventory/inventory.service.ts`
- `backend/src/modules/inventory/inventory.service.spec.ts`
- `backend/src/modules/inventory/inventory.scheduler.ts`
- `backend/src/modules/inventory/inventory.module.ts`
- `backend/src/database/migrations/1787100000000-CreateCartAndInventory.ts`

**Modified**
- `backend/src/app.module.ts` — registered `ScheduleModule.forRoot()`, `CartModule`, `InventoryModule`
- `backend/package.json` + `backend/pnpm-lock.yaml` — added `@nestjs/schedule@6.1.3`

### Change Log

| Date | Change |
|------|--------|
| 2026-06-30 | Implemented Story 3.1 — Cart backend (`CartModule`: `cart_items` entity + migration, JWT-guarded `@Controller('api/cart')` CRUD, transactional add with stock validation, ownership-scoped update/remove, read-time `imageUrl` + `subtotal`) and `InventoryModule` (`inventory_reserves` table + `@nestjs/schedule` `@Cron` 5-min expiry cleanup). 2 new test suites; full backend suite 51/51 green; eslint clean on new files; `tsc --noEmit` clean; `migration:run` applied both tables to the live DB. Installed `@nestjs/schedule@6.1.3` via **pnpm** (backend is pnpm-managed — corrected the story's "npm" assumption). Status → review. |
| 2026-06-30 | **Contract fix (mapping gap found while contexting 3.2):** added `id` (the `cart_items` row id) to each `CartLine` in `GET /api/cart` so the 3.2 UI can target `PATCH`/`DELETE /api/cart/:itemId`. The original AC4 shape (`{ product, quantity }`) exposed no line id, leaving the qty +/– and remove controls with nothing to call. Updated `CartService.getCart` (`id: item.id`), `cart.service.spec.ts` (asserts `items[0].id`), and AC4 above. `pnpm jest cart.service` → 11/11 green. |
