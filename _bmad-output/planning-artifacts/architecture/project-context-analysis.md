# Project Context Analysis

## Requirements Overview

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

## Technical Constraints & Dependencies

- Brownfield: existing NestJS auth module (signup/login/OTP/reset) must be extended, not rebuilt
- Stripe test mode for MVP; webhook-based order confirmation is mandatory for payment integrity
- Nodemailer installed; transport must be upgraded to Resend/SendGrid for deliverability
- `next/font/local` and local SVGs only — no remote CDN assets (per project convention)
- Self-hosted Nunito Sans; Geist Mono for code elements
- TypeORM + MySQL 8; no Redis, no message queue in MVP

---

## Cross-Cutting Concerns

1. **Authentication & Authorization** — JWT-gated routes; admin role flag in payload; `middleware.ts` guards `/admin/**`
2. **Inventory consistency** — soft reserve pattern at checkout entry; cron-based release of expired reserves
3. **Payment idempotency** — PaymentIntent created before submit; order written only on webhook confirmation
4. **Email notifications** — async fire-and-forget; `MailService` interface with swappable transport
5. **Image storage** — S3/Cloudinary from day 1; DB stores key/path only
6. **Cart state sync** — localStorage (guest) + DB (authenticated); merge on login with stock validation
7. **SEO (SSR)** — Server Components for PDP and category pages; client-only for cart/checkout

---

## Cascading Failure Mitigations

| Failure Chain | Mitigation |
|---|---|
| Payment timeout → double charge | PaymentIntent + idempotency key; webhook-driven order creation |
| Last-item race condition → oversell | Soft reserve (15-min TTL) at checkout entry |
| Synchronous email → blocks order flow | Async fire-and-forget; order confirmation independent of email success |
| Cart state divergence on login | Explicit merge strategy: union + stock validation pass |
| Partial image upload → broken product | Product stays draft until ≥1 image upload confirmed |

---

## Assumption Audit — Critical Findings

| Assumption | Confidence | Impact | Resolution |
|---|---|---|---|
| Images on local disk | Low | High | S3/Cloudinary from day 1 |
| Nodemailer deliverability | Low | High | Resend/SendGrid transport |
| Stripe webhooks in dev | Low | High | `stripe listen` as required dev tooling |
| Admin in same Next.js app | Low | Medium | Same app + strict `middleware.ts` |

---

## Architecture Decision Records

| Decision | Choice |
|---|---|
| Image storage | S3 / Cloudinary — key stored in DB |
| Email | Nodemailer + Resend/SendGrid, `MailService` interface |
| Admin UI | Same Next.js app, `middleware.ts` on `/admin/**` |
| Payment flow | Webhook-driven, PaymentIntent + idempotency key |
| Cart persistence | Hybrid (localStorage guest / DB authenticated, merge on login) |
| Inventory | Soft reserve with TTL + cron release |

---
