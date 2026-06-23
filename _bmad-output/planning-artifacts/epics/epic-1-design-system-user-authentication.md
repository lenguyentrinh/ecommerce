# Epic 1: Design System & User Authentication

Shoppers can register, verify their email, log in, and manage their account on a fully branded Oren platform.

## Story 1.1: Oren Design System Foundation

As a shopper,
I want the Oren platform to have a consistent, premium visual identity,
So that every page feels like a cohesive luxury fashion brand experience.

**Acceptance Criteria:**

**Given** the frontend app has TailwindCSS 4 configured
**When** the Oren design tokens are applied
**Then** the Tailwind config defines all color tokens (Soft Ivory `#faf7f2`, Warm White `#fff8f4`, Warm Beige `#e8dccb`, Sand `#fdebdc`/`#f1dfd1`, Muted Blush `#e7c6c1`, Soft Clay `#c9b2a6`, Deep Muted Brown `#4a3f35`, Warm Gray `#787770`, Hairline `#c8c7be`), semantic colors (success `#a89a7f`, alert `#c4a896`, error `#b8998a`, error-strong `#ba1a1a`), border-radius tokens (sm=4px, md=12px, lg=16px, xl=24px, full=9999px), and spacing tokens (xs=8px, sm=16px, md=24px, lg=48px, xl=80px)

**Given** the design tokens are configured
**When** `globals.css` is updated
**Then** the page background defaults to Soft Ivory `#faf7f2`; a 2–3% opacity film-grain CSS noise overlay is applied globally; large background sections use a soft Warm Beige → Soft Ivory gradient; no pure black or pure white appears anywhere

**Given** the typography tokens are applied
**When** Nunito Sans utility classes are used (font already loaded via `next/font/local`)
**Then** type-scale utilities exist for: Display LG (48px/700/+0.04em; 32px mobile), Headline MD (24px/600/+0.03em), Body LG (18px/400/lh-1.6), Body MD (16px/400/lh-1.5), Label SM (12px/600/uppercase/+0.08em)

**Given** shared UI primitives are needed across all features
**When** base components are created in `components/`
**Then** `<Button>` supports `variant="primary"` (pill, Deep Muted Brown fill, Ivory text, scale 1.02× hover, 300ms `cubic-bezier(0.4,0,0.2,1)`) and `variant="secondary"` (pill, transparent fill, blush hover); `<Chip>` renders pill-shaped uppercase tracked Label SM text; `<InputField>` renders with 16px radius, Warm Beige fill, no border default, Soft Clay focus border; all state transitions use 300ms calm easing

**Given** card surfaces are rendered anywhere in the app
**When** the ambient shadow utility is applied
**Then** the card uses `box-shadow: 0 8px 40px rgba(74,63,53,0.04)`; hover lift uses `0 1px 2px rgba(74,63,53,0.04)`; no hard or dark shadows exist

**Given** the responsive layout system is needed
**When** a product grid renders at any breakpoint
**Then** desktop (≥1024px): 12-column grid, 64px outer margins, 24px gap; tablet (768–1023px): 3-column; mobile (<768px): 2-column, 20px side padding, 16px gap; major sections have ≥80px vertical gap between them

## Story 1.2: User Role Extension & Rate Limiting

As an admin,
I want my role to be encoded in my JWT from the moment I log in,
So that the system can protect admin routes without a separate auth layer.

**Acceptance Criteria:**

**Given** the existing `User` entity in `modules/users/entities/user.entity.ts`
**When** the role migration runs
**Then** the `users` table gains a `role ENUM('customer','admin') NOT NULL DEFAULT 'customer'` column; a TypeORM migration file exists under `src/database/migrations/`; `synchronize: false` is confirmed in `database.config.ts`; migration runs cleanly via `npm run migration:run`

**Given** a user successfully logs in
**When** the JWT access token is issued
**Then** the payload is `{ sub: user.id, email: user.email, role: user.role }`; `JwtStrategy.validate()` returns `{ id, email, role }` on the request object

**Given** a NestJS endpoint is decorated with `@Roles('admin')`
**When** a request arrives with a customer JWT
**Then** the `RolesGuard` returns HTTP 403 Forbidden; a request with an admin JWT passes through; the `RolesGuard` and `@Roles()` decorator are registered globally or per-module

**Given** the rate limiting requirement
**When** `@nestjs/throttler` is configured in `AppModule`
**Then** the global throttle is 60 requests/minute per IP; auth endpoints (`POST /api/auth/*`) have an override of 10 requests/minute; rate-limit errors return HTTP 429

## Story 1.3: User Registration & Email Verification Pages

As a shopper,
I want to register an account and verify my email with a one-time code,
So that I can access my orders and saved addresses on future visits.

**Acceptance Criteria:**

**Given** the shopper navigates to `/signup`
**When** the registration page renders
**Then** the form has fields: Full Name (required), Email (required), Password with strength indicator (required), Phone (optional); all inputs use `<InputField>` with Oren styling; a primary pill "Create Account" button is present; the page background is Soft Ivory; Nunito Sans typography is applied

**Given** the shopper submits valid registration data
**When** `POST /api/auth/signup` succeeds
**Then** the shopper is redirected to `/verify-email?email=<encoded>` with their email shown; a toast "Check your email for a 6-digit code" appears (3s)

**Given** the shopper submits invalid data
**When** they attempt to submit
**Then** inline validation errors appear below each failing field before the API is called; errors use Oren error color `#b8998a`

**Given** the shopper is on `/verify-email` and enters their 6-digit OTP
**When** `POST /api/auth/verify-email` is called
**Then** on success: redirect to `/login` with toast "Email verified! You can now log in."; on invalid/expired OTP: inline error "Invalid or expired code. Please try again."; a "Resend code" link re-triggers OTP generation

**Given** registration is attempted with an existing email
**When** the API returns 409 Conflict
**Then** the form shows inline error "An account with this email already exists." without redirecting

## Story 1.4: User Login & Frontend Auth State

As a shopper,
I want to log in with my email and password and stay signed in across page visits,
So that I don't have to re-authenticate every time I return to the store.

**Acceptance Criteria:**

**Given** the shopper navigates to `/login`
**When** the page renders
**Then** Email and Password fields appear using `<InputField>` Oren styling; a primary pill "Sign In" button is present; a "Forgot password?" link is visible; the page uses Oren palette

**Given** the shopper submits valid credentials for a verified account
**When** `POST /api/auth/login` returns a JWT
**Then** the token is stored per existing `authThunk`/`axiosClient` pattern; Redux `authSlice` sets `isAuthenticated: true` and `user: { id, email, role }`; shopper is redirected to the home page; a toast "Welcome back!" appears

**Given** the shopper submits wrong credentials or an unverified email
**When** the API returns 401
**Then** the password field clears; an inline error shows "Invalid email or password." or "Please verify your email first."; the form stays on `/login`

**Given** a logged-in user visits a protected page (e.g., `/account`)
**When** the page loads
**Then** auth state is hydrated from stored token; if token is expired the user is redirected to `/login?return=<current-path>`

**Given** the shopper clicks "Sign Out"
**When** the action completes
**Then** JWT is cleared from storage; Redux auth state resets to initial; the shopper is redirected to `/`

## Story 1.5: Account Profile & Shipping Address Management

As a shopper,
I want to view and edit my profile and save up to two shipping addresses,
So that checkout is faster and my personal details are always current.

**Acceptance Criteria:**

**Given** a logged-in shopper navigates to `/account`
**When** the page renders
**Then** three sections are visible: Profile (name, email read-only, phone), Shipping Addresses (list, up to 2), Order History link (`/orders`); sections appear in Warm White surface cards with ambient shadow; Nunito Sans typography throughout

**Given** the shopper updates their name or phone and clicks "Save Changes"
**When** `PATCH /api/users/profile` completes
**Then** on success: displayed values update immediately; toast "Profile updated"; email field is always read-only

**Given** the shopper adds a new shipping address (fewer than 2 saved)
**When** they submit the address form via `POST /api/users/addresses`
**Then** the address appears in the list immediately; toast "Address saved"; if 2 addresses are already saved, the "Add address" button is hidden with note "Maximum 2 addresses reached"

**Given** the shopper clicks "Remove" on a saved address
**When** `DELETE /api/users/addresses/:id` completes
**Then** the address is removed from the list; toast "Address removed"

**Given** an unauthenticated user navigates to `/account`
**When** the page loads
**Then** they are redirected to `/login?return=/account` and land back on `/account` after successful login

---
