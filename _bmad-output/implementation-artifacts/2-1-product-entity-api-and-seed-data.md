# Story 2.1: Product Entity, API & Seed Data

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want the product catalogue to exist in the database with real data,
so that I can browse, search, and view product details.

> This is a **backend-only** story (NestJS + TypeORM + MySQL). It establishes the `ProductsModule`, the `products` table, seed data, and the public read API that Stories 2.2 (Home/Category), 2.3 (PDP), and 2.4 (Search/Filter) consume. No frontend pages are built here — but the API response contract you define here is the contract those stories depend on, so honour it precisely.

## Acceptance Criteria

1. **Product entity & migration** — A `ProductsModule` is scaffolded with a `Product` entity exposing these properties: `id`, `name`, `description`, `price` (decimal), `stockQuantity` (int), `category` (string), `imageKeys` (`string[]` — storage object keys, **never** full URLs), `isActive` (boolean, default `true`), `deletedAt` (nullable, `@DeleteDateColumn` for soft delete), `createdAt`, `updatedAt`. A TypeORM migration creates the `products` table. `synchronize: false` remains confirmed in both `database.config.ts` and `data-source.ts`.

2. **Seed data** — A runnable seed script inserts **at least 10** sample products across exactly **3 categories** (`Dresses`, `Tops`, `Blazer`) with realistic names, descriptions, prices, and stock quantities. `imageKeys` contain placeholder keys that resolve to **local placeholder images** (no remote/Unsplash URLs). Running the seed twice does not create duplicates (idempotent).

3. **List endpoint** — `GET /api/products` returns a paginated payload shaped exactly `{ data: Product[], total, page, limit }`. It supports query params: `category`, `search` (text), `minPrice`, `maxPrice`, `inStock` (boolean), `sort` (`price_asc` | `price_desc` | `newest` | `popularity`), plus `page` and `limit`. `page` and `category` queries are served by DB indexes. Only active, non-soft-deleted products are returned.

4. **Detail endpoint** — `GET /api/products/:id` returns the full product wrapped as `{ data: Product }` with **image URLs generated at read time** (computed from `imageKeys`, never persisted). If the product is soft-deleted or `isActive === false`, it returns **404**.

5. **Categories endpoint** — `GET /api/products/categories` returns `{ data: string[] }` — the distinct category names of active, non-deleted products.

6. **Validation & error shape** — Invalid query params (e.g. bad `sort` value, negative price) are rejected by the global `ValidationPipe` (already configured) with the standard Nest error shape `{ message, error, statusCode }`. Unknown query params are rejected (`forbidNonWhitelisted` is on).

## Tasks / Subtasks

- [ ] **Task 1 — Scaffold ProductsModule + Product entity (AC: #1)**
  - [ ] Create `backend/src/modules/products/` with `products.module.ts`, `products.controller.ts`, `products.service.ts`, `entities/product.entity.ts`, and `dto/product-query.dto.ts`.
  - [ ] Define `Product` entity (see Dev Notes → Entity spec). Use camelCase column names (TypeORM default — matches the existing `users` table; **do not** introduce a snake_case naming strategy — see Project Structure Notes).
  - [ ] Add a numeric transformer on `price` so JSON returns a `number`, not the MySQL driver's `string` (see Dev Notes → Decimal handling).
  - [ ] Add `@Index('idx_products_category', ['category'])` and `@Index('idx_products_isActive', ['isActive'])` so the indexes land in the generated migration (AC #3 — "page and category queries hit DB indexes").
  - [ ] Register `TypeOrmModule.forFeature([Product])` in `products.module.ts`; import `ProductsModule` into `app.module.ts`.
- [ ] **Task 2 — Create & run the migration (AC: #1)**
  - [ ] Ensure MySQL is running and `.env` is configured, then generate the migration: `npm run migration:generate -- src/database/migrations/CreateProducts` (run from `backend/`). Review the generated SQL: table `products`, all columns nullable/types correct, `deletedAt` present, both indexes present.
  - [ ] If `migration:generate` is impractical (no DB handy), hand-write the migration following the defensive style of `1782206839023-AddRoleToUsers.ts` (guard with `getTable`/`findColumnByName`).
  - [ ] Run `npm run migration:run` and confirm the table + indexes exist. Confirm `synchronize: false` is untouched.
- [ ] **Task 3 — Seed script (AC: #2)**
  - [ ] Create `backend/src/database/seeds/product.seed.ts` (data array, 10+ products, 3 categories: `Dresses`, `Tops`, `Blazer`) and `backend/src/database/seeds/seed.ts` (runner using `AppDataSource` from `src/database/data-source.ts`).
  - [ ] Make it idempotent: if `products` already has rows, skip (or upsert by a stable natural key like `name`).
  - [ ] Add npm script `"seed": "ts-node -r tsconfig-paths/register src/database/seeds/seed.ts"` to `backend/package.json`.
  - [ ] Add 1–3 placeholder SVGs under `frontend/public/images/placeholders/` and reference them via the `imageKeys` you seed (see Dev Notes → Image URL strategy). Honour the self-hosted-assets rule: **local SVGs only, no remote image URLs.**
- [ ] **Task 4 — Query DTO + list endpoint (AC: #3, #6)**
  - [ ] Implement `product-query.dto.ts` with class-validator/class-transformer covering `category`, `search`, `minPrice`, `maxPrice`, `inStock`, `sort`, `page`, `limit` (see Dev Notes → Query DTO).
  - [ ] Implement `productsService.findAll(query)` using a TypeORM QueryBuilder: filter `isActive = true` (soft-delete auto-excluded by `@DeleteDateColumn`), apply `category`/`search` (LIKE)/price range/`inStock`, apply `sort`, paginate, and return `{ data, total, page, limit }`.
  - [ ] Map each product through the read-time image-URL transform before returning.
- [ ] **Task 5 — Detail + categories endpoints (AC: #4, #5)**
  - [ ] `GET /api/products/categories` — declare this handler **before** `GET /api/products/:id` (route-order matters; otherwise `categories` is captured by `:id`). Return `{ data: string[] }` of distinct active categories.
  - [ ] `GET /api/products/:id` — fetch by id where `isActive = true`; throw `NotFoundException` if missing/inactive/soft-deleted. Return `{ data: productWithImageUrls }`.
- [ ] **Task 6 — Tests (AC: all)**
  - [ ] Add `products.service.spec.ts` (unit, mocked `Repository`/QueryBuilder) covering: pagination math, each `sort` option, category/price/inStock filters, soft-delete/`isActive` exclusion, 404 on inactive, distinct categories, and image-URL generation. Follow the style of `auth.service.spec.ts`.
  - [ ] Run `npm run lint` and `npm test` — both green.

## Dev Notes

### Entity spec — `backend/src/modules/products/entities/product.entity.ts`

Mirror the conventions in `modules/users/entities/user.entity.ts` (decorators, `!` definite-assignment). Use **camelCase column names** (no explicit `name:` overrides, no naming strategy — see Project Structure Notes for the rationale).

```ts
import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '...'; // small helper, see Decimal handling

@Entity('products')
@Index('idx_products_category', ['category'])
@Index('idx_products_isActive', ['isActive'])
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: new ColumnNumericTransformer() })
  price!: number;

  @Column({ type: 'int', default: 0 })
  stockQuantity!: number;

  @Column()
  category!: string;

  // MySQL JSON column holding storage keys ONLY — never full URLs.
  @Column({ type: 'json' })
  imageKeys!: string[];

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}
```

### Decimal handling (price)

The `mysql2` driver returns `DECIMAL` columns as **strings**. The architecture consistency rule says API numbers must be real numbers (and Story 2.2/2.3 will do price math). Add a tiny transformer so `price` is a `number` in JSON:

```ts
// backend/src/common/utils/column-numeric.transformer.ts
import { ValueTransformer } from 'typeorm';
export class ColumnNumericTransformer implements ValueTransformer {
  to(value: number): number { return value; }
  from(value: string): number { return value === null ? null : parseFloat(value); }
}
```

### Image URL strategy (read-time generation — AC #4)

Store **only keys** in `imageKeys`; compute URLs at read time. The full S3/Cloudinary `StorageService` is **out of scope** here (it arrives in Story 5.3). For this story use a minimal, config-driven helper:

- Add env var `PRODUCT_IMAGE_BASE_URL` (default `/images/placeholders`) to `backend/.env.example`.
- In `productsService`, map `imageKeys` → `imageUrls` via `` `${base}/${key}` `` and attach `imageUrls` to the returned object (keep `imageKeys` too). Do **not** persist `imageUrls`.
- Seed `imageKeys` with filenames like `product-1.svg`, `product-2.svg` that exist under `frontend/public/images/placeholders/`. A relative base (`/images/placeholders`) keeps URLs origin-agnostic so the Next.js frontend resolves them against its own `public/`. **Local SVGs only** — do not reintroduce Unsplash/remote images (see [self-hosted-fonts-and-images] project rule).

### Query DTO — `dto/product-query.dto.ts`

The global `ValidationPipe` runs with `{ whitelist: true, forbidNonWhitelisted: true, transform: true }` (see `main.ts`), so **every** accepted query param must be declared here or the request 400s.

```ts
import { IsOptional, IsString, IsEnum, IsInt, Min, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum ProductSort {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
  POPULARITY = 'popularity',
}

export class ProductQueryDto {
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) inStock?: boolean;
  @IsOptional() @IsEnum(ProductSort) sort?: ProductSort;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 12;
}
```

- `inStock=true` → `stockQuantity > 0`.
- `search` → case-insensitive `LIKE %term%` across `name` and `description` (MySQL `LIKE` is fine for MVP; no FULLTEXT index required).
- **`sort=popularity` has no data source yet** (sales/order data lands in Epic 4). Implement it as a deterministic proxy — order by `createdAt DESC` (same as `newest`) — and leave a `// TODO(epic-4): real popularity sort` comment. Do **not** add an unused `salesCount` column.
- Default `page=1`, `limit=12`. Cap `limit` (e.g. max 100) to avoid abuse.

### Controller — routes & shapes

```
@Controller('api/products')   // NOT a global prefix — see the regression warning below
  @Get('categories')  → { data: string[] }      // MUST be declared before ':id'
  @Get()              → { data, total, page, limit }
  @Get(':id')         → { data: Product }  | 404
```

- These endpoints are **public** (no `@UseGuards`). The global `RolesGuard` returns `true` when no `@Roles()` metadata is present, and the global `ThrottlerGuard` (60 req/min) applies — both fine.
- 404: throw `NotFoundException` — the default Nest exception already produces `{ message, error, statusCode }`. A custom no-stack-leak filter is listed in the architecture as future work and is **not required** for this story.

### ⚠️ Regression guardrail — DO NOT add a global `/api` prefix

The architecture doc mentions a global `/api` prefix, **but it was never implemented**, and the existing system depends on its absence:
- `frontend/services/api.ts` sets `baseURL = NEXT_PUBLIC_API_URL` = `http://localhost:3001` (no `/api`), and calls `/auth/login`, `/auth/me`.
- Backend `AuthController` is `@Controller('auth')`; `main.ts` has **no** `app.setGlobalPrefix('api')`.

Calling `app.setGlobalPrefix('api')` now would rewrite `/auth/*` → `/api/auth/*` and **break the already-shipped login/auth flow**. Therefore, satisfy the `GET /api/products` AC at the **controller level** with `@Controller('api/products')`. Leave `main.ts`, Swagger setup, and auth routes untouched.

### Migration notes

- Existing convention: timestamp-prefixed classes via `npm run migration:generate` (`src/database/data-source.ts` is the configured datasource, `synchronize: false`). Only one migration exists today: `1782206839023-AddRoleToUsers.ts`.
- `data-source.ts` entity glob is `__dirname + '/../**/*.entity.{ts,js}'` — your `product.entity.ts` (lowercase) is picked up automatically.
- After running, verify the `products` table has indexes `idx_products_category` and `idx_products_isActive`.

### Testing standards

- Jest is configured (`npm test`, `npm run test:cov`). Existing examples: `modules/auth/auth.service.spec.ts`, `common/guards/roles.guard.spec.ts` — follow their mocking style (provide a mocked `Repository`/`createQueryBuilder`).
- Prioritise `products.service.spec.ts` unit coverage of the AC-critical logic (filters, sort, pagination, soft-delete/`isActive` exclusion, 404, image URLs, distinct categories). An e2e test for the three GET endpoints is a nice-to-have if time allows.

### Project Structure Notes

- **Entity file casing — variance from the architecture doc (intentional).** `implementation-patterns-consistency-rules.md` specifies PascalCase entity files (`Product.entity.ts`). The actual repo uses lowercase (`user.entity.ts`). Use **`product.entity.ts` (lowercase)** to match the on-disk convention. Rationale: deploy targets (Railway/Render) are Linux (case-sensitive); mixing casing risks import-resolution failures that pass on Windows but fail in CI/prod.
- **Column naming — variance from the architecture doc (intentional).** The doc prescribes snake_case columns (`created_at`, `image_keys`). Epic 1 shipped with **no naming strategy**, so the live `users` table columns are camelCase (`userName`, `birthDate`, `emailVerified`). Introducing snake_case for `products` now would leave the schema half-and-half. Use TypeORM-default **camelCase** columns to stay consistent with what is actually deployed. (Index *names* still follow the doc's `idx_{table}_{column}` form.)
- New code lives entirely under `backend/src/modules/products/` and `backend/src/database/seeds/`, plus one transformer util and one `.env.example` line — no existing files change except `app.module.ts` (add `ProductsModule`) and `backend/package.json` (add `seed` script).

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-2-product-catalog-discovery.md#Story 2.1] — acceptance criteria.
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#Data Architecture] — D1 `synchronize:false`, D2 soft delete via `@DeleteDateColumn`, D4 store S3 keys / generate URLs at read time.
- [Source: _bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md] — response shapes (`{ data, total, page }`, never raw arrays), index naming `idx_{table}_{column}`, "filter shopper queries by active always", "store only keys never URLs".
- [Source: _bmad-output/planning-artifacts/architecture/project-structure-boundaries.md#Backend] — module/folder layout; public shopper boundary `GET /api/products/**` (no auth).
- [Source: backend/src/modules/users/entities/user.entity.ts] — entity decorator/style template.
- [Source: backend/src/database/migrations/1782206839023-AddRoleToUsers.ts] — migration style.
- [Source: backend/src/database/data-source.ts & database/database.config.ts] — `synchronize: false`, entity/migration globs.
- [Source: backend/src/main.ts & frontend/services/api.ts & frontend/.env.local] — basis for the no-global-`/api`-prefix regression guardrail.

## Git Intelligence Summary

Recent commits are all Epic 1 work (auth UI fixes, user-entity fixes, zod validation, story 1.4 merge). No catalogue/product code exists yet — this is a greenfield module. The most recent backend change (`dbb6f60 fix be user entity`) confirms the entity-decorator style and the `role` enum addition you'll mirror. No prior Epic 2 story exists, so there is no in-epic predecessor to inherit patterns from; lean on the Epic 1 backend conventions captured above.

## Dev Agent Record

### Agent Model Used

(to be filled by dev agent)

### Debug Log References

### Completion Notes List

- Story context created via bmad-create-story. Comprehensive developer guide assembled from epics, architecture (3 docs), and direct inspection of the live backend/frontend code. Two intentional variances from the architecture doc (entity-file casing, column naming) documented with rationale; one regression guardrail (no global `/api` prefix) flagged.

### File List

(to be filled by dev agent — expected: products module files, product.entity.ts, product-query.dto.ts, migration, seed scripts, column-numeric.transformer.ts, products.service.spec.ts, app.module.ts edit, package.json edit, .env.example edit, frontend placeholder SVGs)

## Questions / Clarifications for the Team

1. **`popularity` sort** is implemented as a `createdAt DESC` proxy because no sales data exists until Epic 4. Confirm this is acceptable for MVP, or specify an interim ranking signal.
2. **Image placeholders**: this story serves placeholder SVGs from `frontend/public/images/placeholders/` via a relative `PRODUCT_IMAGE_BASE_URL`. The real `StorageService` (S3/Cloudinary, absolute URLs) arrives in Story 5.3. Confirm the frontend stories (2.2/2.3) are fine resolving relative image URLs for now.
3. **Single-product response shape** is `{ data: Product }` (per the project's "never return raw" consistency rule). Confirm the frontend stories should expect the wrapped shape for the detail endpoint (the list endpoint already returns `{ data, total, page, limit }`).

## Review Findings

_Code review 2026-06-27 — 3 review layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor). All 6 ACs + the no-global-`/api`-prefix regression guardrail verified PASS by the Acceptance Auditor. 15 findings dismissed as noise/spec-faithful._

- [x] [Review][Decision→Patch] API response leaks internal fields — RESOLVED: `toResponse()` now maps explicit fields and `ProductResponse` is `Omit<Product, 'isActive' | 'deletedAt'>`, so `deletedAt`/`isActive` are no longer exposed (`imageKeys`/`imageUrls` kept) (`products.service.ts`)
- [x] [Review][Patch] `minPrice > maxPrice` silently returns empty 200 — FIXED: `findAll` now throws `BadRequestException` on an inverted range before querying (`products.service.ts`)
- [x] [Review][Patch] `search` user input not hardened — FIXED: LIKE wildcards (`%`/`_`/`\`) escaped in the service; empty/whitespace `search`/`category` trimmed and collapsed to `undefined` in the DTO (`products.service.ts` / `product-query.dto.ts`)
- [x] [Review][Patch] Test gaps vs Task 6 — FIXED: added tests for the `inStock=false` branch, wildcard escaping, inverted range, internal-field exclusion, and a `ProductQueryDto` validation block (limit cap, defaults, trim) — 16/16 passing (`products.service.spec.ts`)
- [x] [Review][Defer] No indexes on `price`/`createdAt`/`stockQuantity` — price-range + price/newest sort full-scan as the table grows; only `category`+`isActive` indexed [`product.entity.ts` / migration] — deferred, MVP-acceptable, optimize at scale
- [x] [Review][Defer] Seeder idempotency is serial-only — no unique constraint on `name`, so concurrent runs can double-insert and a re-seed after soft-deleting a seeded product creates a duplicate active row (`repo.find` excludes soft-deleted) [`seed.ts:18-29` / migration] — deferred, serial dev/CI seeding is the only real usage
- [x] [Review][Defer] `imageKeys` unvalidated/unsanitized — once admin create/update lands (Story 5.2/5.3) untrusted keys could yield path-traversal or malformed URLs via `${base}/${key}`; add key validation + `encodeURIComponent` then [`products.service.ts:120-127`] — deferred, no write path in this story, keys are trusted seed data
- [x] [Review][Defer] `category` is unconstrained free-text — no canonical taxonomy/enum/lookup; typos return an empty page rather than a 404/hint [`product.entity.ts` / `product-query.dto.ts:20-22`] — deferred, free-text category is the current spec-level design
- [x] [Review][Defer] No max cap on `page` (only `limit` is capped) — a very large `page` produces a large offset scan [`product-query.dto.ts:48-52`] — deferred, low risk, add a cap if abuse is observed

### Review Findings — re-categorization delta (2026-06-27, commit `e2c63cb`)

_Second review pass over the Dresses/Tops/Blazer seed re-categorization (3 layers). AC #2 (≥10 products, exactly 3 categories, local placeholder SVGs only, idempotent), AC #4 read-time image URLs, and the spec/Task-3 updates all verified PASS by the Acceptance Auditor. All 6 prior defers re-confirmed (already tracked in `deferred-work.md`); 6 findings dismissed as noise/false-positive (notably the "LIKE missing ESCAPE clause" — false positive: MySQL's default LIKE escape char is `\`)._

- [x] [Review][Patch] Stale old-category fixtures remain in the modernized test file — FIXED: filter test now uses `category: 'Dresses'` and the `getCategories` test asserts `['Blazer','Dresses','Tops']`, consistent with the new taxonomy — 16/16 passing [`products.service.spec.ts:101,109,187-192`]
- [x] [Review][Patch] Missing trailing newline at end of file — FIXED: restored final CRLF newline [`products.service.ts` EOF]
