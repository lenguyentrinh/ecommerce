# Implementation Patterns & Consistency Rules

**Critical conflict points identified:** 8 areas where AI agents could diverge without explicit rules.

## Naming Patterns

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

## Structure Patterns

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

## Format Patterns

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

## Communication Patterns

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

## Process Patterns

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

## Enforcement Guidelines

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
