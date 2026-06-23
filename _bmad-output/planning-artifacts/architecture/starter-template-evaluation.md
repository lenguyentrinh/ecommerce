# Starter Template Evaluation

## Primary Technology Domain

Full-stack web (SSR + REST API) — brownfield project, both apps already initialized.

## Existing Foundation (No Initialization Required)

**Backend**: NestJS 11 monolith — TypeScript 5.7.3, TypeORM + MySQL 8, Passport/JWT, Nodemailer, Jest. Module-per-feature structure already established.

**Frontend**: Next.js 16 / React 19 — TailwindCSS 4, Redux Toolkit, React Hook Form, Axios, React Hot Toast. App Router with route groups already in use.

## Net-New Packages Required by Architecture Decisions

**Backend additions:**
- `stripe` — Payment Intents, idempotency keys, webhook signature verification
- `@aws-sdk/client-s3` (or `cloudinary`) — product image storage (ADR-001)
- `multer` + `@nestjs/platform-express` — multipart file upload handling
- `resend` (or `@sendgrid/mail`) — transactional email transport (ADR-002)
- `@nestjs/schedule` + `cron` — inventory reserve TTL cron job (ADR-006)

**Frontend additions:**
- `@stripe/stripe-js` + `@stripe/react-stripe-js` — Stripe Elements for checkout UI

## Development Tooling Required

- `stripe` CLI: `stripe listen --forward-to localhost:3000/orders/webhook`
  (required for local webhook testing — document in README as mandatory dev tool)

**Note:** Project is brownfield — initialization stories are not needed. First implementation story begins with new module scaffolding.

---
