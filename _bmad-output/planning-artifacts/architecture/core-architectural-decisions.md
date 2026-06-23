# Core Architectural Decisions

## Decision Priority Analysis

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

## Data Architecture

| Decision | Choice | Rationale |
|---|---|---|
| TypeORM sync | `synchronize: false` always; `migration:run` only | Auto-sync masks prod migration failures |
| Soft delete | `@DeleteDateColumn() deletedAt` on Product | Orders must retain product history |
| Inventory reserves | Separate `inventory_reserves` table (`product_id`, `session_id`, `qty`, `expires_at`) | Cleaner cron cleanup, audit trail, no products table lock |
| Image DB column | `image_keys: string[]` — S3 object keys only, never full URLs | URLs regenerated at read time; keys survive bucket/domain changes |
| Caching | None for MVP | Add if load testing reveals bottleneck |

---

## Authentication & Security

| Decision | Choice | Rationale |
|---|---|---|
| Admin role | `role: enum('customer', 'admin')` on User entity; included in JWT payload | Simple, no separate role table needed at MVP scale |
| JWT strategy | Single access token, `JWT_EXPIRES_IN=1d`, no refresh tokens | Keeps auth flow simple; refresh tokens in v1.1 |
| Rate limiting | `@nestjs/throttler` — 60 req/min global, 10 req/min on auth + payment endpoints | Prevents abuse without full API gateway |
| CORS | Explicit `FRONTEND_URL` env var; no wildcard in production | Security baseline |

---

## API & Communication Patterns

| Decision | Choice | Rationale |
|---|---|---|
| API prefix | `/api` global prefix | Clean separation; `/v1` added on first breaking change |
| Swagger | `/api/docs` in development only (`NODE_ENV !== 'production'`) | Already installed; hide from production |
| Error format | NestJS `HttpException` shape `{ message, error, statusCode }` + global exception filter (no stack trace leak) | Consistent, client-predictable |
| Stripe webhook | `POST /payments/webhook` — raw body, `stripe.webhooks.constructEvent` signature verification | Required for payment integrity |
| File upload limits | 5 MB per image, max 5 images per upload (Multer limits) | Per PRD spec |

---

## Frontend Architecture

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

## Infrastructure & Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Zero-config Next.js; auto-deploy on `main` |
| Backend | Railway or Render | Simple NestJS deploy; free tier for MVP |
| Database | Railway MySQL or PlanetScale | Managed MySQL; no ops overhead |
| File storage | AWS S3 or Cloudinary | Per ADR-001 |
| CI/CD | GitHub Actions | Lint + test on PR; deploy on merge to `main` |
| Monitoring | NestJS built-in `Logger` | Sentry deferred to post-launch |

## Decision Impact Analysis

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
