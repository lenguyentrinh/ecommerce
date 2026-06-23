# Requirements Inventory

## Functional Requirements

FR1: Home page displays featured products, category navigation, and a banner/hero section.
FR2: Category pages render a product grid filtered by the selected category.
FR3: Product detail page (PDP) shows image gallery, title, description, price, stock status, "Add to Cart" button, and related products.
FR4: Global search bar accepts free-text queries and searches across product titles and descriptions.
FR5: Search results and category pages provide filters: price range (min–max), category/subcategory, stock status, and sort options (price low-high, price high-low, newest, popularity).
FR6: Shoppers can add a product to cart with a quantity selector; a toast/message confirms the action.
FR7: Cart page lists items with image, name, price, and quantity; allows quantity update (+/–) and item removal; shows subtotal, taxes, shipping, and total; includes "Continue Shopping" and "Proceed to Checkout" buttons.
FR8: Cart data persists in localStorage or session and syncs with the backend when the user is logged in.
FR9: If a cart item goes out of stock before checkout, the cart shows an out-of-stock warning on that item.
FR10: User registration collects email, password, name, and optional phone; requires email OTP verification; shows a password strength indicator.
FR11: Login accepts email and password; email must be verified before login is permitted.
FR12: Account page shows profile info (name, email, phone), a shipping address book (save 1–2 addresses), and order history.
FR13: Checkout is a multi-step flow: (1) shipping address, (2) shipping method (flat rate), (3) payment via Stripe test mode, (4) review & confirm.
FR14: All checkout forms have real-time validation with clear, field-associated error messages.
FR15: Payment processing shows a loading state, accepts Stripe test card details, and displays a clear success or error message after submission.
FR16: Order confirmation page shows order ID, itemized subtotal/tax/shipping/total, estimated delivery date, a confirmation email is sent, and a "View order details" link is provided.
FR17: Order history page lists past orders with order ID, date, total, and status; filterable by status (pending, confirmed, shipped, delivered).
FR18: Order detail page (shopper) shows order ID, date, items, quantities, prices, shipping address, tracking info, an order status timeline (pending → confirmed → shipped → delivered), estimated delivery date, and a contact support link.
FR19: Admin dashboard shows overview metrics (total orders, pending orders, low-stock alerts, total sales) and quick-access widgets (recent orders, top-selling products, low-stock alerts).
FR20: Admin product list shows products in a table (name, category, price, stock, status) with search/filter and pagination.
FR21: Admin "Add product" form includes name, description, category, price, stock quantity, image upload (1–5 images), active/inactive toggle; saves and returns to list.
FR22: Admin "Edit product" opens the same form pre-populated with current data.
FR23: Admin "Delete product" performs a soft delete (hidden from store; retained in order history).
FR24: Admin order list shows all orders in a table (order ID, customer name, date, status, total) with filter by status, search by order ID or customer name, and sort by date.
FR25: Admin order detail shows customer info, shipping address, ordered items, amounts, payment status, and order status timeline with timestamps.
FR26: Admin can update order status via dropdown (Pending → Confirmed → Shipped → Delivered); each change triggers a customer notification email and records a timestamp.
FR27: Admin can cancel pending orders; triggers refund notification email; order is marked as cancelled.
FR28: Product stock quantity is visible in the admin product list; admin updates stock by editing the product.
FR29: Products below a configurable low-stock threshold are flagged in the admin dashboard with an alert badge.
FR30: Stock is decremented on order confirmation (not earlier); checkout validates stock before order is placed to prevent overselling.

## NonFunctional Requirements

NFR1: Largest Contentful Paint (LCP) < 2.5 seconds on a 4G connection for all shopper-facing pages.
NFR2: Average API response time < 300–500ms for most endpoints.
NFR3: Platform supports 100–500 concurrent users without degradation.
NFR4: Database queries for product search and order lookup are indexed.
NFR5: 99.9% uptime target during business hours (MVP phase).
NFR6: 99%+ successful order placement rate for valid payments.
NFR7: No data loss on payment failure; cart is recoverable and user is notified.
NFR8: Payment submissions are idempotent (prevent double charges).
NFR9: Cart, inventory, and order data are always in sync.
NFR10: Authentication uses JWT; passwords hashed with bcrypt (salt rounds = 10).
NFR11: Admin endpoints are protected by role; users can only access their own orders and data.
NFR12: Payment data handled via Stripe test mode (PCI-DSS compliance delegated to Stripe); HTTPS enforced on all traffic.
NFR13: All user input is validated server-side and sanitized before persistence.
NFR14: WCAG 2.1 Level A — keyboard navigation (Tab/Enter/Escape), semantic HTML, 4.5:1 color contrast for body text, form error messages associated with fields.
NFR15: Product and category pages use SSR (Next.js Server Components) for SEO; meta tags and Open Graph data generated via generateMetadata().
NFR16: Clean URL structure: /products/{id}, /categories/{name}.
NFR17: Mobile-first responsive design; touch-friendly interactions (44px+ tap targets).
NFR18: Basic event tracking: product_view, add_to_cart, checkout_started, order_completed, payment_failed.
NFR19: Backend error logging for failed API calls and exceptions.

## Additional Requirements

- Brownfield project: both NestJS and Next.js apps are already initialized; no scaffold stories needed. First stories begin with new module/entity work.
- Install and configure net-new backend packages: `stripe`, `@aws-sdk/client-s3` (or `cloudinary`), `multer` + `@nestjs/platform-express`, `resend` (or `@sendgrid/mail`), `@nestjs/schedule` + `cron`.
- Install and configure net-new frontend package: `@stripe/stripe-js` + `@stripe/react-stripe-js`.
- TypeORM must use `synchronize: false` at all times; schema changes applied via `migration:run` only.
- Product entity uses `@DeleteDateColumn() deletedAt` for soft delete (orders retain product history).
- Create a separate `inventory_reserves` table (`product_id`, `session_id`, `qty`, `expires_at`) with a cron job for TTL cleanup.
- Product images: store S3/Cloudinary object keys in DB (`image_keys: string[]`); never store full URLs; regenerate URLs at read time.
- User entity extended with `role: enum('customer', 'admin')`; role included in JWT payload.
- Rate limiting via `@nestjs/throttler`: 60 req/min global, 10 req/min on auth and payment endpoints.
- CORS configured from `FRONTEND_URL` env var; no wildcard in production.
- Stripe webhook: `POST /api/payments/webhook` — raw body middleware, `stripe.webhooks.constructEvent` signature verification.
- SSR rendering: Home, Category, PDP use Server Components; Cart, Checkout, Account, Auth forms, Admin pages use Client Components.
- Admin route group: `app/(admin)/admin/` with a `layout.tsx` that performs server-side auth redirect for non-admin users.
- Stripe Elements: lazy-loaded on checkout page only (`loadStripe()` deferred import).
- Deployment: Vercel (frontend), Railway or Render (backend), Railway MySQL or PlanetScale (database), AWS S3 or Cloudinary (images).
- CI/CD: GitHub Actions — lint + test on PR; auto-deploy to Vercel/Railway on merge to `main`.
- Stripe CLI required for local webhook testing: `stripe listen --forward-to localhost:3000/orders/webhook`.

## UX Design Requirements

UX-DR1: Implement the full Oren warm-neutral color palette — Soft Ivory `#faf7f2` (background), Warm White `#fff8f4` (surfaces), Warm Beige `#e8dccb` (cards/containers), Sand variants `#fdebdc`/`#f1dfd1` (inputs), Muted Blush `#e7c6c1` (accent), Soft Clay `#c9b2a6` (hover/focus), Deep Muted Brown `#4a3f35` (primary text + CTA fill), Warm Gray `#787770` (secondary text), Hairline `#c8c7be` (dividers). No tech colors (no blue, no indigo `#4f46e5`).
UX-DR2: Semantic colors: success `#a89a7f`, alert `#c4a896`, error `#b8998a`, error-strong `#ba1a1a` with container `#ffdad6` (payment failure only — not used for other errors).
UX-DR3: Typography: Nunito Sans exclusively (weights 400, 600, 700), loaded via `next/font/local` (no Google Fonts CDN). Type scale: Display LG 48px/700/+0.04em (32px/+0.02em mobile), Headline MD 24px/600/+0.03em, Body LG 18px/400/1.6, Body MD 16px/400/1.5, Label SM 12px/600/uppercase/+0.08em.
UX-DR4: Spacing scale applied globally: xs=8px, sm=16px, md=24px, lg=48px, xl=80px minimum vertical gap between major sections; desktop margins 64px, mobile 20px.
UX-DR5: All cards and inputs use 16px border-radius; buttons and chips use pill shape (border-radius: 9999px).
UX-DR6: Ambient shadow on all card surfaces: `0 8px 40px rgba(74, 63, 53, 0.04)`. Hover lift shadow: `0 1px 2px rgba(74, 63, 53, 0.04)`. No hard shadows.
UX-DR7: Global film-grain texture: 2–3% opacity noise overlay on the page canvas for paper-like tactile quality.
UX-DR8: Background gradient on large sections: soft radial/linear Warm Beige → Soft Ivory.
UX-DR9: Product card component — layout: 4:5 image (16px radius, Warm Beige placeholder), product name (16px/600/Deep Muted Brown) + price (16px/400/Warm Gray) below. CTA ("Add to Cart") hidden by default on desktop, fades in on hover (300ms); persistent subtle button on mobile. Hover: image zoom 1.02×, card background warms. Out-of-stock state: CTA disabled (Sand fill, Warm Gray text, cursor not-allowed), "Out of Stock" label.
UX-DR10: Product Detail Page layout — desktop: 60% image gallery left / 40% info panel right (Warm White background, 32px padding). Mobile: full-width image gallery, price + CTA sticky at bottom. Styling Notes section uses Body LG (18px/400/1.6) — editorial paragraphs, not bullet lists.
UX-DR11: Input field styling: 16px radius, Warm Beige or Sand fill, no border by default, Soft Clay border on focus, Warm Gray placeholder (16px/400/Nunito Sans). No aggressive focus ring/glow.
UX-DR12: Search bar: Warm White background, hairline border `#c8c7be`, Soft Clay border on focus, sticky on scroll (z-index 10), 44px+ height touch target, X clear button appears on input.
UX-DR13: Chip/label component: pill-shaped, uppercase text with +0.08em tracking (Label SM — 12px/600). Selected state: Muted Blush `#e7c6c1` fill, Soft Clay `#c9b2a6` border.
UX-DR14: All interactive state transitions use `cubic-bezier(0.4, 0, 0.2, 1)` over 300ms — no fast/snappy motion.
UX-DR15: Primary button (Add to Cart, Proceed to Checkout): Deep Muted Brown `#4a3f35` pill, Ivory text, weight 600, 1rem×2rem padding. Hover: scale 1.02×, 300ms ease. Secondary button: transparent/tinted fill, Sand/Blush border, Deep Muted Brown text. Hover: soft blush fill + Soft Clay border.
UX-DR16: Responsive grid — mobile: 2-column staggered (20px side padding, 16px gap); tablet: 3-column; desktop: 12-column (64px outer margins, centered max-width, 24px gap).
UX-DR17: Loading states — product grid: 4–6 skeleton cards with Warm Beige placeholder color, fade-in when data loads. Search: "Searching…" indicator, 2s timeout before error.
UX-DR18: Empty states — no search results: large message "No results found", suggestion text, link to browse categories. Empty cart: icon + "Your cart is empty", "Continue shopping" CTA.
UX-DR19: Error states — add-to-cart failure: toast "Failed to add to cart. Please try again." Network error: persistent banner "Connection lost. Offline mode limited." Search error: message + retry button + link to categories.
UX-DR20: Infinite scroll on product grids (shopper): load next page before user reaches the bottom; no pagination buttons; subtle loading indicator between batches.
UX-DR21: Add-to-cart success feedback: button text changes to "✓ Added to Cart", toast notification appears (bottom-left, 3s auto-dismiss), optional brief bounce animation.
UX-DR22: Mobile form UX: full-width inputs, 44px+ tap targets, one field per line, submit button full-width and sticky at bottom when needed, keyboard type hints (email/numeric).
UX-DR23: Accessibility implementation: all interactive elements focusable (logical Tab order), Enter/Space activates buttons, Escape closes dropdowns, visible focus indicator on all elements. Semantic HTML: `<button>`, `<a>`, `<label for="">`, heading hierarchy. Alt text on all product images; ARIA labels where semantic HTML insufficient. No information conveyed by color alone (icon/text pairing always). Animations respect `prefers-reduced-motion`.

## FR Coverage Map

```
FR1:  Epic 2 — Home page with featured products, categories, hero
FR2:  Epic 2 — Category pages with filtered product grid
FR3:  Epic 2 — Product Detail Page (images, info, Add to Cart)
FR4:  Epic 2 — Global search bar (free-text)
FR5:  Epic 2 — Search/category filters and sort options
FR6:  Epic 3 — Add to cart with quantity selector + toast
FR7:  Epic 3 — Cart page (items, quantities, totals, CTAs)
FR8:  Epic 3 — Cart persistence (localStorage + backend sync)
FR9:  Epic 3 — Out-of-stock warning on cart items
FR10: Epic 1 — User registration with email OTP verification
FR11: Epic 1 — Login (verified email required)
FR12: Epic 1 — Account page (profile, address book, order history)
FR13: Epic 4 — Multi-step checkout (address, shipping, payment, review)
FR14: Epic 4 — Real-time checkout form validation
FR15: Epic 4 — Stripe test payment processing
FR16: Epic 4 — Order confirmation page + confirmation email
FR17: Epic 4 — Order history page (filterable by status)
FR18: Epic 4 — Order detail page with status timeline
FR19: Epic 5 — Admin dashboard (metrics + quick-access widgets)
FR20: Epic 5 — Admin product list (table, search, filter, pagination)
FR21: Epic 5 — Add product (form + image upload)
FR22: Epic 5 — Edit product
FR23: Epic 5 — Delete product (soft delete)
FR24: Epic 5 — Admin order list (filter, search, sort)
FR25: Epic 5 — Admin order detail (customer info, items, payment status)
FR26: Epic 5 — Update order status + customer notification email
FR27: Epic 5 — Cancel pending order + refund notification
FR28: Epic 5 — Stock visibility and update via product edit
FR29: Epic 5 — Low-stock alerts in dashboard
FR30: Epic 4+5 — Oversell prevention (checkout validation + stock deduction)
```
