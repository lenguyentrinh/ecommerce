# Project Structure & Boundaries

## Backend Complete Directory Tree

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

## Frontend Complete Directory Tree

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

## Architectural Boundaries

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
