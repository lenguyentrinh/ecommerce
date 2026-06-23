# PRD Analysis

## Functional Requirements

FR1: Home page displays featured products, category navigation, and a banner/hero section.
FR2: Category pages render a product grid filtered by the selected category.
FR3: Product detail page (PDP) shows image gallery, title, description, price, stock status, "Add to Cart" button, and related products.
FR4: Global search bar accepts free-text queries and searches across product titles and descriptions.
FR5: Search results and category pages provide filters: price range, category/subcategory, stock status, and sort options (price low-high, price high-low, newest, popularity).
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
FR17: Order history page lists past orders with order ID, date, total, and status; filterable by status.
FR18: Order detail page (shopper) shows order ID, date, items, quantities, prices, shipping address, tracking info, an order status timeline, estimated delivery date, and a contact support link.
FR19: Admin dashboard shows overview metrics (total orders, pending orders, low-stock alerts, total sales) and quick-access widgets.
FR20: Admin product list shows products in a table with search/filter and pagination.
FR21: Admin "Add product" form includes name, description, category, price, stock quantity, image upload (1–5 images), active/inactive toggle.
FR22: Admin "Edit product" opens the same form pre-populated with current data.
FR23: Admin "Delete product" performs a soft delete (hidden from store; retained in order history).
FR24: Admin order list shows all orders with filter by status, search by order ID or customer name, and sort by date.
FR25: Admin order detail shows customer info, shipping address, ordered items, amounts, payment status, and order status timeline with timestamps.
FR26: Admin can update order status via dropdown (Pending → Confirmed → Shipped → Delivered); each change triggers a customer notification email and records a timestamp.
FR27: Admin can cancel pending orders; triggers refund notification email; order is marked as cancelled.
FR28: Product stock quantity is visible in the admin product list; admin updates stock by editing the product.
FR29: Products below a configurable low-stock threshold are flagged in the admin dashboard with an alert badge.
FR30: Stock is decremented on order confirmation (not earlier); checkout validates stock before order is placed to prevent overselling.

**Total FRs: 30**

## Non-Functional Requirements

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
NFR12: Payment data handled via Stripe test mode; HTTPS enforced on all traffic.
NFR13: All user input is validated server-side and sanitized before persistence.
NFR14: WCAG 2.1 Level A — keyboard navigation, semantic HTML, 4.5:1 color contrast, form error messages associated with fields.
NFR15: Product and category pages use SSR (Next.js Server Components) for SEO; meta tags and Open Graph data generated via generateMetadata().
NFR16: Clean URL structure: /products/{id}, /categories/{name}.
NFR17: Mobile-first responsive design; touch-friendly interactions (44px+ tap targets).
NFR18: Basic event tracking: product_view, add_to_cart, checkout_started, order_completed, payment_failed.
NFR19: Backend error logging for failed API calls and exceptions.

**Total NFRs: 19**

## PRD Completeness Assessment

The PRD is complete and well-structured. It covers two user journeys (Shopper and Admin), has explicit success criteria, clear out-of-scope items, and documented assumptions/constraints. All features are numbered and traceable. No ambiguities requiring resolution before implementation.

---
