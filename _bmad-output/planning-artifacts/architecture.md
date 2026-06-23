---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-06-23'
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-ecommerce-2026-06-22/prd.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-ecommerce-2026-06-22/DESIGN.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-ecommerce-2026-06-22/EXPERIENCE.md"
  - "_bmad-output/project-context.md"
workflowType: 'architecture'
project_name: 'ecommerce'
user_name: 'Nguyen Trinh'
date: '2026-06-23'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (~30 total):**
- **Shopper (6 groups)**: Product Browsing & Discovery, Search & Filtering, Shopping Cart, User Authentication, Checkout Flow, Order Management
- **Admin (4 groups)**: Dashboard, Product Management, Order Management, Inventory Management

Key architectural implications: brownfield project (auth already exists); two distinct user classes with different UX targets (mobile-first shopper, desktop-first admin); SSR required on product/category pages for SEO.

**Non-Functional Requirements:**
- Performance: LCP < 2.5s, API < 300–500ms, 100–500 concurrent users
- Reliability: 99.9% uptime, 99%+ order placement success, idempotent payments
- Security: JWT auth, bcrypt, PCI-DSS via Stripe, HTTPS, server-side validation
- Accessibility: WCAG 2.1 Level AA (from UX spec)
- SEO: SSR for product/category pages, clean URLs, Open Graph meta

**Scale & Complexity:**
- Primary domain: Full-stack web (SSR + REST API)
- Complexity level: **Medium** — solo dev, MVP scope, monolith, single MySQL instance
- Concurrent user target: 100–500 (single server, no horizontal scaling in MVP)

---

### Technical Constraints & Dependencies

- Brownfield: existing NestJS auth module (signup/login/OTP/reset) must be extended, not rebuilt
- Stripe test mode for MVP; webhook-based order confirmation is mandatory for payment integrity
- Nodemailer installed; transport must be upgraded to Resend/SendGrid for deliverability
- `next/font/local` and local SVGs only — no remote CDN assets (per project convention)
- Self-hosted Nunito Sans; Geist Mono for code elements
- TypeORM + MySQL 8; no Redis, no message queue in MVP

---

### Cross-Cutting Concerns

1. **Authentication & Authorization** — JWT-gated routes; admin role flag in payload; `middleware.ts` guards `/admin/**`
2. **Inventory consistency** — soft reserve pattern at checkout entry; cron-based release of expired reserves
3. **Payment idempotency** — PaymentIntent created before submit; order written only on webhook confirmation
4. **Email notifications** — async fire-and-forget; `MailService` interface with swappable transport
5. **Image storage** — S3/Cloudinary from day 1; DB stores key/path only
6. **Cart state sync** — localStorage (guest) + DB (authenticated); merge on login with stock validation
7. **SEO (SSR)** — Server Components for PDP and category pages; client-only for cart/checkout

---

### Cascading Failure Mitigations

| Failure Chain | Mitigation |
|---|---|
| Payment timeout → double charge | PaymentIntent + idempotency key; webhook-driven order creation |
| Last-item race condition → oversell | Soft reserve (15-min TTL) at checkout entry |
| Synchronous email → blocks order flow | Async fire-and-forget; order confirmation independent of email success |
| Cart state divergence on login | Explicit merge strategy: union + stock validation pass |
| Partial image upload → broken product | Product stays draft until ≥1 image upload confirmed |

---

### Assumption Audit — Critical Findings

| Assumption | Confidence | Impact | Resolution |
|---|---|---|---|
| Images on local disk | Low | High | S3/Cloudinary from day 1 |
| Nodemailer deliverability | Low | High | Resend/SendGrid transport |
| Stripe webhooks in dev | Low | High | `stripe listen` as required dev tooling |
| Admin in same Next.js app | Low | Medium | Same app + strict `middleware.ts` |

---

### Architecture Decision Records

| Decision | Choice |
|---|---|
| Image storage | S3 / Cloudinary — key stored in DB |
| Email | Nodemailer + Resend/SendGrid, `MailService` interface |
| Admin UI | Same Next.js app, `middleware.ts` on `/admin/**` |
| Payment flow | Webhook-driven, PaymentIntent + idempotency key |
| Cart persistence | Hybrid (localStorage guest / DB authenticated, merge on login) |
| Inventory | Soft reserve with TTL + cron release |

---

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web (SSR + REST API) — brownfield project, both apps already initialized.

### Existing Foundation (No Initialization Required)

**Backend**: NestJS 11 monolith — TypeScript 5.7.3, TypeORM + MySQL 8, Passport/JWT, Nodemailer, Jest. Module-per-feature structure already established.

**Frontend**: Next.js 16 / React 19 — TailwindCSS 4, Redux Toolkit, React Hook Form, Axios, React Hot Toast. App Router with route groups already in use.

### Net-New Packages Required by Architecture Decisions

**Backend additions:**
- `stripe` — Payment Intents, idempotency keys, webhook signature verification
- `@aws-sdk/client-s3` (or `cloudinary`) — product image storage (ADR-001)
- `multer` + `@nestjs/platform-express` — multipart file upload handling
- `resend` (or `@sendgrid/mail`) — transactional email transport (ADR-002)
- `@nestjs/schedule` + `cron` — inventory reserve TTL cron job (ADR-006)

**Frontend additions:**
- `@stripe/stripe-js` + `@stripe/react-stripe-js` — Stripe Elements for checkout UI

### Development Tooling Required

- `stripe` CLI: `stripe listen --forward-to localhost:3000/orders/webhook`
  (required for local webhook testing — document in README as mandatory dev tool)

**Note:** Project is brownfield — initialization stories are not needed. First implementation story begins with new module scaffolding.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- D1: TypeORM sync strategy — migrations only, no `synchronize`
- D3: Inventory reserve table — separate table, not column
- D6: Admin role — `role` enum on User entity
- D13: Stripe webhook endpoint — raw body, signature verified
- D15: SSR/CSR boundary — Server Components for SEO pages only

**Important Decisions (Shape Architecture):**
- D2: Soft delete via `@DeleteDateColumn` on Product
- D4: S3 key stored in DB, URL generated at read time
- D8: Rate limiting via `@nestjs/throttler`
- D9: CORS from explicit `FRONTEND_URL` env var
- D18: Stripe lazy-loaded on checkout page only
- D19: Admin route group with server-side auth layout

**Deferred Decisions (Post-MVP):**
- Redis caching (D5) — add if load testing reveals need
- JWT refresh tokens (D7) — v1.1
- API versioning `/v1` prefix (D10) — add on first breaking change
- Advanced monitoring/Sentry (D22) — post-launch

---

### Data Architecture

| Decision | Choice | Rationale |
|---|---|---|
| TypeORM sync | `synchronize: false` always; `migration:run` only | Auto-sync masks prod migration failures |
| Soft delete | `@DeleteDateColumn() deletedAt` on Product | Orders must retain product history |
| Inventory reserves | Separate `inventory_reserves` table (`product_id`, `session_id`, `qty`, `expires_at`) | Cleaner cron cleanup, audit trail, no products table lock |
| Image DB column | `image_keys: string[]` — S3 object keys only, never full URLs | URLs regenerated at read time; keys survive bucket/domain changes |
| Caching | None for MVP | Add if load testing reveals bottleneck |

---

### Authentication & Security

| Decision | Choice | Rationale |
|---|---|---|
| Admin role | `role: enum('customer', 'admin')` on User entity; included in JWT payload | Simple, no separate role table needed at MVP scale |
| JWT strategy | Single access token, `JWT_EXPIRES_IN=1d`, no refresh tokens | Keeps auth flow simple; refresh tokens in v1.1 |
| Rate limiting | `@nestjs/throttler` — 60 req/min global, 10 req/min on auth + payment endpoints | Prevents abuse without full API gateway |
| CORS | Explicit `FRONTEND_URL` env var; no wildcard in production | Security baseline |

---

### API & Communication Patterns

| Decision | Choice | Rationale |
|---|---|---|
| API prefix | `/api` global prefix | Clean separation; `/v1` added on first breaking change |
| Swagger | `/api/docs` in development only (`NODE_ENV !== 'production'`) | Already installed; hide from production |
| Error format | NestJS `HttpException` shape `{ message, error, statusCode }` + global exception filter (no stack trace leak) | Consistent, client-predictable |
| Stripe webhook | `POST /payments/webhook` — raw body, `stripe.webhooks.constructEvent` signature verification | Required for payment integrity |
| File upload limits | 5 MB per image, max 5 images per upload (Multer limits) | Per PRD spec |

---

### Frontend Architecture

| Page / Feature | Rendering | Reason |
|---|---|---|
| Home, Category, PDP | Server Component | SEO — LCP, Open Graph, indexability |
| Cart, Checkout, Account | Client Component | Interactive, no SEO requirement |
| Auth forms | Client Component | Form state, no SEO requirement |
| Admin all pages | Client Component | No SEO, auth-gated |

**Additional frontend decisions:**
- `<Image>` component with S3/Cloudinary domain in `next.config.ts` `images.remotePatterns`
- `generateMetadata()` on product and category Server Component pages
- `loadStripe()` lazy-loaded on checkout page only — never loaded on non-payment pages
- Admin route group: `app/(admin)/admin/` with `layout.tsx` server-side auth redirect

---

### Infrastructure & Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Zero-config Next.js; auto-deploy on `main` |
| Backend | Railway or Render | Simple NestJS deploy; free tier for MVP |
| Database | Railway MySQL or PlanetScale | Managed MySQL; no ops overhead |
| File storage | AWS S3 or Cloudinary | Per ADR-001 |
| CI/CD | GitHub Actions | Lint + test on PR; deploy on merge to `main` |
| Monitoring | NestJS built-in `Logger` | Sentry deferred to post-launch |

### Decision Impact Analysis

**Implementation Sequence:**
1. Extend User entity with `role` enum + update JWT payload (unblocks admin auth)
2. Create `inventory_reserves` table + migration (unblocks checkout)
3. Install + configure Stripe — PaymentsModule with raw body (unblocks checkout)
4. Install + configure S3/Cloudinary — ProductsModule image upload (unblocks product management)
5. Install + configure Resend/SendGrid — MailService interface (unblocks order confirmation)
6. Scaffold `@nestjs/schedule` + cron job for reserve cleanup
7. Add `@nestjs/throttler` rate limiting
8. Frontend: SSR pages (Home, Category, PDP) with `generateMetadata`
9. Frontend: Admin route group with auth layout
10. Frontend: Checkout with lazy Stripe Elements

**Cross-Component Dependencies:**
- Admin auth (`role` on User) must exist before any admin module is built
- Inventory reserves table must exist before checkout flow is implemented
- PaymentsModule + webhook endpoint must exist before order creation is implemented
- MailService interface must exist before any email-sending feature is built

---

## Implementation Patterns & Consistency Rules

**Critical conflict points identified:** 8 areas where AI agents could diverge without explicit rules.

### Naming Patterns

**Database Naming (TypeORM + MySQL):**
- Tables: `snake_case` plural — `products`, `orders`, `cart_items`, `inventory_reserves`
- Columns: `snake_case` — `created_at`, `product_id`, `image_keys`
- Foreign keys: `{entity}_id` — `user_id`, `product_id`, `order_id`
- Indexes: `idx_{table}_{column}` — `idx_products_category`, `idx_orders_user_id`

**API Naming:**
- Endpoints: plural nouns, kebab-case — `GET /api/products`, `POST /api/cart-items`
- Route params: `:id` — `GET /api/products/:id`
- Stripe webhook: `POST /api/payments/webhook` (fixed path, raw body)
- Admin endpoints: `GET /api/admin/products`, `PATCH /api/admin/orders/:id/status`

**Code Naming (extends project context Rules 3-5):**
- NestJS modules: `{feature}.module.ts`, `{feature}.controller.ts`, `{feature}.service.ts`
- TypeORM entities: `{Feature}.entity.ts` (PascalCase), class name singular — `Product`, `Order`
- Redux slices: `{feature}Slice.ts`, thunks: `{feature}Thunk.ts`
- Storage utilities: `common/storage/storage.service.ts`

### Structure Patterns

**New Backend Modules:**
```
modules/
├── products/
│   ├── products.module.ts
│   ├── products.controller.ts
│   ├── products.service.ts
│   ├── entities/Product.entity.ts
│   └── dto/
│       ├── create-product.dto.ts
│       └── update-product.dto.ts
├── orders/
│   ├── orders.module.ts
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── entities/
│       ├── Order.entity.ts
│       └── OrderItem.entity.ts
├── payments/
│   ├── payments.module.ts
│   ├── payments.controller.ts
│   └── payments.service.ts
├── cart/
│   ├── cart.module.ts
│   ├── cart.controller.ts
│   └── cart.service.ts
└── inventory/
    ├── inventory.module.ts
    ├── inventory.service.ts
    └── entities/InventoryReserve.entity.ts
```

**New Frontend Structure:**
```
app/
├── (shop)/
│   ├── page.tsx                  ← Home (Server Component)
│   ├── products/
│   │   ├── page.tsx              ← Category (Server Component)
│   │   └── [id]/page.tsx         ← PDP (Server Component)
│   ├── cart/page.tsx             ← Client Component
│   └── checkout/page.tsx         ← Client Component
├── (admin)/admin/
│   ├── layout.tsx                ← auth guard
│   ├── page.tsx                  ← Dashboard
│   ├── products/page.tsx
│   └── orders/page.tsx
features/
├── products/
├── cart/
├── orders/
└── payments/
```

### Format Patterns

**API Response Shapes:**
```typescript
// List:   { data: T[], total: number, page: number }
// Single: { data: T, message?: string }
// Action: { message: string }
// Error:  { message: string, error: string, statusCode: number }
// NEVER return raw arrays at top level
```

**Data Formats:**
- Dates: ISO 8601 strings in all API responses — never Unix timestamps
- Booleans: `true`/`false` — never `1`/`0`
- Absent optional fields: `null` — never `undefined`

### Communication Patterns

**Stripe Webhook Handler:**
```typescript
@Post('webhook')
@HttpCode(200)
async handleWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string) {
  const event = this.stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  switch (event.type) {
    case 'payment_intent.succeeded': return this.paymentsService.handlePaymentSucceeded(event.data.object);
    case 'payment_intent.payment_failed': return this.paymentsService.handlePaymentFailed(event.data.object);
  }
}
```

**Email Fire-and-Forget Pattern:**
```typescript
this.mailService.sendOrderConfirmation(order).catch(err =>
  this.logger.error('Order confirmation email failed', err)
);
// NEVER await email calls — never let email failure block order confirmation
```

### Process Patterns

**Inventory Reserve Flow:**
```
1. POST /api/checkout/start → reserve(productId, qty, sessionId, 15min TTL)
2. Reserve fails → 409 Conflict → client shows out-of-stock warning
3. POST /api/payments/create-intent → PaymentIntent with idempotency key = sessionId
4. Webhook payment_intent.succeeded → confirmOrder() → decrement stock_qty, delete reserve
5. Webhook payment_intent.payment_failed → release(sessionId)
6. Cron @every 5min → releaseExpired() — cleanup abandoned reserves
```

**Product Lifecycle:**
```
draft    → created but no image yet (hidden from shop)
active   → ≥1 image uploaded successfully (visible in shop)
archived → soft-deleted via @DeleteDateColumn (hidden from shop, retained in orders)
All shopper queries MUST include: WHERE status = 'active' AND deleted_at IS NULL
```

**Image Upload Pattern:**
```typescript
const key = await this.storageService.upload(file);
product.imageKeys = [...product.imageKeys, key];
await this.productsRepository.save(product);
// getUrl(key) computed at read time — never persist full URLs
```

### Enforcement Guidelines

**All AI Agents MUST:**
1. Wrap API list responses in `{ data: T[], total, page }` — never return raw arrays
2. Fire emails as fire-and-forget with `.catch(logger.error)` — never `await`
3. Filter shopper product queries by `status = 'active'` always
4. Store only S3 keys in DB — never full URLs
5. Use constructor injection for all NestJS dependencies
6. Place Stripe webhook handler in `PaymentsController` with raw body parser
7. Use `@DeleteDateColumn()` for soft-deletes — never a `deleted: boolean` flag
8. Prefix all admin API routes with `/api/admin/`

---

## Project Structure & Boundaries

### Backend Complete Directory Tree

```
backend/
├── .env
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── package.json
├── tsconfig.json
├── src/
│   ├── main.ts                               ← bootstrap, CORS, raw body, throttler, swagger
│   ├── app.module.ts
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── jwt.config.ts
│   │   ├── stripe.config.ts                  ← NEW
│   │   └── storage.config.ts                 ← NEW (S3/Cloudinary)
│   ├── database/
│   │   ├── database.config.ts
│   │   └── migrations/
│   │       ├── 001-add-role-to-users.ts
│   │       ├── 002-create-products.ts
│   │       ├── 003-create-orders.ts
│   │       ├── 004-create-cart-items.ts
│   │       └── 005-create-inventory-reserves.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts            ← NEW
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts             ← existing
│   │   │   └── roles.guard.ts                ← NEW (admin check)
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts      ← NEW (no stack trace leak)
│   │   ├── interceptors/
│   │   │   └── response-transform.interceptor.ts ← NEW (wrap in {data})
│   │   ├── storage/
│   │   │   └── storage.service.ts            ← NEW (S3/Cloudinary upload/getUrl)
│   │   └── utils/
│   └── modules/
│       ├── auth/                             ← EXISTING (extend with role)
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── strategies/jwt.strategies.ts
│       │   └── dto/
│       ├── users/                            ← EXISTING (add role enum)
│       │   ├── user.module.ts
│       │   ├── user.service.ts
│       │   └── entities/user.entity.ts       ← add role: enum('customer','admin')
│       ├── mail/                             ← EXISTING (swap transport)
│       │   ├── mail.module.ts
│       │   └── mail.service.ts               ← swap to Resend/SendGrid
│       ├── products/                         ← NEW (A.1, A.2, B.2)
│       │   ├── products.module.ts
│       │   ├── products.controller.ts        ← shopper endpoints
│       │   ├── products.admin.controller.ts  ← /api/admin/products
│       │   ├── products.service.ts
│       │   ├── entities/
│       │   │   ├── Product.entity.ts         ← status enum, @DeleteDateColumn, imageKeys[]
│       │   │   └── Category.entity.ts
│       │   └── dto/
│       │       ├── create-product.dto.ts
│       │       ├── update-product.dto.ts
│       │       └── product-query.dto.ts
│       ├── cart/                             ← NEW (A.3)
│       │   ├── cart.module.ts
│       │   ├── cart.controller.ts
│       │   ├── cart.service.ts
│       │   └── entities/CartItem.entity.ts
│       ├── orders/                           ← NEW (A.5, A.6, B.3)
│       │   ├── orders.module.ts
│       │   ├── orders.controller.ts          ← shopper order history/detail
│       │   ├── orders.admin.controller.ts    ← /api/admin/orders
│       │   ├── orders.service.ts
│       │   └── entities/
│       │       ├── Order.entity.ts           ← status enum, timestamps per status
│       │       └── OrderItem.entity.ts
│       ├── payments/                         ← NEW (A.5 checkout)
│       │   ├── payments.module.ts
│       │   ├── payments.controller.ts        ← webhook + create-intent
│       │   └── payments.service.ts
│       └── inventory/                        ← NEW (B.4, soft reserve)
│           ├── inventory.module.ts
│           ├── inventory.service.ts
│           ├── inventory.scheduler.ts        ← @Cron every 5min
│           └── entities/InventoryReserve.entity.ts
└── test/
    └── app.e2e-spec.ts
```

### Frontend Complete Directory Tree

```
frontend/
├── .env.local
├── .env.example
├── next.config.ts                            ← images.remotePatterns for S3/Cloudinary
├── tailwind.config.js
├── tsconfig.json
├── middleware.ts                             ← NEW: guards /admin/** routes
├── package.json
├── app/
│   ├── layout.tsx                            ← root layout (Nunito Sans, providers)
│   ├── globals.css
│   ├── providers.tsx                         ← Redux + Toaster (existing)
│   ├── (auth)/                               ← EXISTING
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (shop)/                               ← NEW
│   │   ├── page.tsx                          ← Home — Server Component
│   │   ├── products/
│   │   │   ├── page.tsx                      ← Category/Search — Server Component
│   │   │   └── [id]/page.tsx                 ← PDP — Server Component + generateMetadata
│   │   ├── cart/page.tsx                     ← Client Component
│   │   ├── checkout/
│   │   │   ├── page.tsx                      ← Stripe Elements
│   │   │   └── success/page.tsx              ← Order confirmation
│   │   └── account/
│   │       ├── page.tsx
│   │       └── orders/
│   │           ├── page.tsx                  ← Order history
│   │           └── [id]/page.tsx             ← Order detail
│   └── (admin)/admin/                        ← NEW
│       ├── layout.tsx                        ← auth guard
│       ├── page.tsx                          ← Dashboard
│       ├── products/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/edit/page.tsx
│       └── orders/
│           ├── page.tsx
│           └── [id]/page.tsx
├── components/
│   ├── Button.tsx                            ← EXISTING
│   ├── inputs/TextInput.tsx                  ← EXISTING
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── ui/
│       ├── ProductCard.tsx                   ← NEW (Oren design)
│       ├── ProductGrid.tsx                   ← NEW (masonry)
│       └── OrderStatusBadge.tsx              ← NEW
├── features/
│   ├── auth/                                 ← EXISTING
│   ├── products/
│   │   ├── components/
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── FilterPanel.tsx
│   │   └── services/productAPI.ts
│   ├── cart/
│   │   ├── components/CartDrawer.tsx
│   │   ├── hooks/useCart.ts                  ← localStorage + Redux sync
│   │   └── services/cartAPI.ts
│   ├── orders/
│   │   └── services/ordersAPI.ts
│   └── payments/
│       ├── components/CheckoutForm.tsx       ← Stripe Elements
│       └── services/paymentsAPI.ts
├── store/
│   ├── store.ts                              ← EXISTING
│   ├── authSlice.ts                          ← EXISTING
│   ├── authThunk.ts                          ← EXISTING
│   ├── cartSlice.ts                          ← NEW
│   ├── cartThunk.ts                          ← NEW
│   ├── productsSlice.ts                      ← NEW
│   └── productsThunk.ts                      ← NEW
├── lib/
│   ├── axiosClient.ts                        ← EXISTING
│   ├── constants.ts                          ← EXISTING
│   ├── helpers.ts                            ← EXISTING
│   └── stripe.ts                             ← NEW: loadStripe() singleton
├── types/
│   ├── product.ts                            ← NEW
│   ├── order.ts                              ← NEW
│   └── cart.ts                               ← NEW
└── public/
    └── fonts/                                ← EXISTING (Nunito Sans, Geist Mono)
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Path prefix | Auth |
|---|---|---|
| Public shopper | `GET /api/products/**` | None |
| Authenticated shopper | `POST /api/cart/**`, `/api/orders/**` | JWT (customer) |
| Checkout/payment | `POST /api/checkout/**`, `/api/payments/**` | JWT (customer) |
| Stripe webhook | `POST /api/payments/webhook` | Stripe signature |
| Admin | `/api/admin/**` | JWT (admin role) |

**Feature to File Mapping:**

| PRD Feature | Backend module | Frontend route |
|---|---|---|
| A.1 Product Browsing | `products/` | `(shop)/products/[id]` |
| A.2 Search & Filter | `products/` (query params) | `(shop)/products/` |
| A.3 Shopping Cart | `cart/` | `(shop)/cart/` |
| A.4 User Auth | `auth/` (existing) | `(auth)/` (existing) |
| A.5 Checkout | `payments/` + `inventory/` | `(shop)/checkout/` |
| A.6 Order History | `orders/` | `(shop)/account/orders/` |
| B.1 Admin Dashboard | `orders/` + `products/` (stats) | `(admin)/admin/` |
| B.2 Product Mgmt | `products.admin.controller` | `(admin)/admin/products/` |
| B.3 Order Mgmt | `orders.admin.controller` | `(admin)/admin/orders/` |
| B.4 Inventory | `inventory/` | `(admin)/admin/products/` (stock) |

**Data Flow — Checkout Path:**
```
(shop)/checkout/page.tsx
  → POST /api/checkout/start         → reserve stock (inventory_reserves)
  → POST /api/payments/create-intent → PaymentIntent + idempotency key
  → Stripe Elements confirm payment
  → Stripe → POST /api/payments/webhook
      → OrdersService.confirmOrder()
          → decrement stock_qty
          → delete inventory_reserve
          → create Order + OrderItems
          → fire-and-forget: MailService.sendOrderConfirmation()
  → redirect to (shop)/checkout/success
```

---

## Architecture Validation Results

### Coherence Validation ✅

All technology choices are mutually compatible. NestJS 11 + TypeORM 0.3.28 + MySQL 8, Next.js 16 + React 19 + Redux Toolkit 2.x, and all new packages (`@nestjs/schedule`, `@nestjs/throttler`, Stripe SDK, `@aws-sdk/client-s3`) support NestJS 11 and Node.js LTS.

Module-per-feature structure is consistent across existing and new modules. Fire-and-forget email pattern is consistent with order confirmation reliability. SSR for product pages is consistent with SEO NFR. `(shop)` and `(admin)` route groups correctly support the SSR/CSR boundary. `middleware.ts` is the correct Next.js mechanism for `/admin/**` protection.

### Requirements Coverage ✅

All 10 PRD feature groups (A.1–A.6, B.1–B.4) have a named backend module and frontend route. All 5 NFRs (performance, reliability, security, accessibility, SEO) are architecturally addressed.

### Critical Gaps — Resolved

**Gap 1 — Edge-compatible JWT in `middleware.ts`**
Next.js `middleware.ts` runs on Edge Runtime — cannot use `jsonwebtoken`. Add `jose` to frontend dependencies for edge-compatible JWT verification.
```typescript
import { jwtVerify } from 'jose';
// verify JWT in middleware.ts using jose, not jsonwebtoken
```

**Gap 2 — Payment idempotency key definition**
`idempotency key = sessionId` was ambiguous. Resolved: generate `crypto.randomUUID()` when user enters checkout page, store in React component state, pass to both `/api/checkout/start` and `/api/payments/create-intent`.

**Gap 3 — NestJS raw body for Stripe webhook**
Exact `main.ts` bootstrap required:
```typescript
const app = await NestFactory.create(AppModule, { rawBody: true });
// In payments.controller.ts: @Req() req: RawBodyRequest<Request>
// stripe.webhooks.constructEvent(req.rawBody, sig, secret)
```

### Important Gaps — Documented

**Gap 4 — Dual controller registration:**
```typescript
@Module({ controllers: [ProductsController, ProductsAdminController], ... })
```

**Gap 5 — Entity relationships:**
- `Order` → `User` (many-to-one)
- `Order` → `OrderItem[]` (one-to-many)
- `OrderItem` → `Product` (many-to-one, snapshot price)
- `CartItem` → `User` (many-to-one)
- `CartItem` → `Product` (many-to-one)
- `InventoryReserve` → `Product` (many-to-one)

**Gap 6 — Price snapshot on OrderItem:**
`OrderItem` must store `price_at_purchase: decimal` — never read `Product.price` at order display time.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** High

**Key Strengths:**
- Cascading failure analysis surfaced 5 critical risks before implementation
- Six ADRs make payment, image, email, cart, inventory, and admin decisions explicit
- Complete file tree maps every PRD feature to a specific file
- 8 mandatory enforcement rules prevent the most common agent divergence patterns
- 3 critical gaps found and resolved during validation

**Areas for Future Enhancement (post-MVP):**
- Redis caching for product catalog and session storage
- JWT refresh token rotation
- Elasticsearch/Algolia for advanced search
- Horizontal scaling + load balancer
- Full GDPR/data deletion compliance

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries defined in this document
- Refer to this document for all architectural questions

**First Implementation Priority:**
1. Extend `User` entity with `role` enum + JWT payload update
2. Add `jose` to frontend, implement `middleware.ts` admin guard
3. Configure `main.ts` with `rawBody: true` + install Stripe
4. Run first migration: `001-add-role-to-users.ts`
