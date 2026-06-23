# Epic List

## Epic 1: Design System & User Authentication
Shoppers can register, verify their email, log in, and manage their account on a fully branded Oren platform.
**FRs covered:** FR10, FR11, FR12
**UX covered:** UX-DR1 through UX-DR16 (core design tokens: palette, typography, spacing, shapes, shadows, film-grain, buttons, inputs, chips, grid)
**Architecture:** Extend User entity with `role: enum('customer','admin')`, include role in JWT payload; configure Tailwind with Oren design tokens; set up Nunito Sans via `next/font/local`; configure CORS from `FRONTEND_URL`; add rate limiting on auth endpoints.

## Epic 2: Product Catalog & Discovery
Shoppers can browse the home page, explore category pages, search by keyword, filter results, and read full product detail pages.
**FRs covered:** FR1, FR2, FR3, FR4, FR5
**UX covered:** UX-DR9 (product card), UX-DR10 (PDP layout), UX-DR12 (search bar), UX-DR17 (loading skeletons), UX-DR20 (infinite scroll)
**Architecture:** NestJS `ProductsModule` with Product entity (soft delete via `@DeleteDateColumn`); SSR Server Components for Home/Category/PDP; `generateMetadata()` for SEO; indexed DB queries for search/category.

## Epic 3: Shopping Cart
Shoppers can add products to their cart, update quantities, remove items, and see a full order summary with out-of-stock warnings.
**FRs covered:** FR6, FR7, FR8, FR9
**UX covered:** UX-DR18 (empty cart state), UX-DR19 (error states), UX-DR21 (add-to-cart success feedback)
**Architecture:** NestJS `CartModule`; `inventory_reserves` table (`product_id`, `session_id`, `qty`, `expires_at`) with `@nestjs/schedule` cron for TTL cleanup; cart persistence via localStorage + backend sync.

## Epic 4: Checkout & Order Lifecycle
Shoppers can complete a Stripe test payment, receive an order confirmation email, view order history, and track order status.
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18, FR30 (partial — checkout oversell prevention)
**UX covered:** UX-DR22 (mobile form UX), UX-DR23 (accessibility on forms)
**Architecture:** Stripe integration (`stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`); Stripe webhook (`POST /api/payments/webhook`, raw body, signature verified); `MailService` via `resend`/`@sendgrid/mail`; `OrdersModule` with order entity and status state machine; stock decremented on confirmation; idempotency keys prevent double charges.

## Epic 5: Admin Operations
The admin can manage the product catalogue, fulfill and cancel orders, and monitor inventory and sales from a protected dashboard.
**FRs covered:** FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30 (partial — admin-side stock management)
**Architecture:** AWS S3 or Cloudinary image storage (`@aws-sdk/client-s3` or `cloudinary`); `multer` + `@nestjs/platform-express` for image upload; Admin route group `app/(admin)/admin/` with server-side auth redirect; `@nestjs/throttler` global rate limiting; GitHub Actions CI/CD pipeline; low-stock alert logic.

---
