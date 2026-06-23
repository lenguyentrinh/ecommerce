# Epic 4: Checkout & Order Lifecycle

Shoppers can complete a Stripe test payment, receive an order confirmation email, view order history, and track order status.

## Story 4.1: Order & Payment Backend — Entities, Stripe & Mail Setup

As a shopper,
I want the backend to safely process my payment and create a reliable order record,
So that my purchase is confirmed and I never get double-charged.

**Acceptance Criteria:**

**Given** the NestJS backend needs an `OrdersModule` and `PaymentsModule`
**When** the modules are scaffolded
**Then** an `Order` entity exists with: `id`, `userId` (FK → users), `status` (enum: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`), `subtotal`, `shippingFee` (default $5), `tax` (10% of subtotal), `total`, `shippingAddress` (JSON), `stripePaymentIntentId`, `idempotencyKey`, `createdAt`, `updatedAt`; an `OrderItem` entity exists with: `id`, `orderId` (FK → orders), `productId` (FK → products), `productName` (snapshotted at order time), `price` (snapshotted), `quantity`; TypeORM migrations create both tables

**Given** Stripe integration is required
**When** the `stripe` package is installed and `PaymentsModule` is configured
**Then** `stripe` npm package is installed; `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are read from env via `ConfigModule`; `POST /api/payments/create-intent` creates a Stripe PaymentIntent with an idempotency key; `POST /api/payments/webhook` is registered with raw body middleware (`express.raw({ type: 'application/json' })`), verifies signature via `stripe.webhooks.constructEvent`, and handles `payment_intent.succeeded` and `payment_intent.payment_failed` events

**Given** a `payment_intent.succeeded` webhook fires
**When** the handler processes the event
**Then** the matching order's status is updated from `pending` to `confirmed`; stock is decremented for each `OrderItem` (`product.stockQuantity -= quantity`); if any product's stock would go below 0 the order is flagged for manual review (logged, not thrown to Stripe); a confirmation email is dispatched via `MailService`

**Given** the `MailService` is required
**When** `resend` (or `@sendgrid/mail`) is installed and configured
**Then** `MAIL_FROM` and `RESEND_API_KEY` (or `SENDGRID_API_KEY`) are read from env; `MailService.sendOrderConfirmation(order)` sends an email with order ID, items, totals, shipping address, and estimated delivery (hardcoded 3–5 business days); `MailService.sendOrderStatusUpdate(order)` sends a status-change notification; both methods are covered by unit tests with a mock transport

**Given** `POST /api/orders` is called (order creation before payment)
**When** the request body contains `{ cartItems, shippingAddressId, idempotencyKey }`
**Then** stock availability is validated for every item before the order is created (HTTP 400 if any item is out of stock); an `Order` record is created in `pending` status; `OrderItems` are created with snapshotted product name and price; the Stripe PaymentIntent ID is stored on the order; the response includes `{ orderId, clientSecret }` for Stripe Elements

## Story 4.2: Checkout Flow UI — Multi-Step Form

As a shopper,
I want to complete my purchase through a clear, step-by-step checkout flow,
So that I can review my order, enter my details, and pay with confidence.

**Acceptance Criteria:**

**Given** the shopper clicks "Proceed to Checkout" from the cart
**When** the checkout page (`/checkout`) loads as a Client Component
**Then** a multi-step progress indicator shows: Step 1 Shipping, Step 2 Delivery, Step 3 Payment, Step 4 Review; the page background is Soft Ivory; all inputs use `<InputField>` Oren styling; on mobile: full-width inputs, 44px+ tap targets, submit button full-width and sticky at bottom

**Given** the shopper is on Step 1 (Shipping Address)
**When** they interact with the form
**Then** if logged in with saved addresses: they see a "Select saved address" option plus "Add new address"; if no saved addresses: the form shows fields (Full Name, Address Line 1, City, State, Postal Code, Country); "Continue" validates all fields before advancing; inline errors use Oren error color `#b8998a`

**Given** the shopper is on Step 2 (Delivery Method)
**When** it renders
**Then** a single "Standard Shipping — $5.00 (3–5 business days)" option is shown as a selected radio pill; "Continue" advances to Step 3; no carrier API is called

**Given** the shopper is on Step 3 (Payment)
**When** the payment form renders
**Then** Stripe Elements are lazy-loaded (`loadStripe()` deferred import — not loaded on other pages); the Stripe `CardElement` renders inside the Oren-styled form container; the "Pay Now" button is a primary pill; a loading spinner replaces the button text during processing; the total amount is clearly visible above the payment form

**Given** the shopper submits the payment form
**When** `stripe.confirmCardPayment(clientSecret)` is called
**Then** on success: the shopper is redirected to `/order-confirmation/:orderId`; on Stripe error: an inline error shows the Stripe error message in error-strong `#ba1a1a`; the form does not navigate away on failure; the cart is cleared only after confirmed payment

**Given** the shopper is on Step 4 (Review)
**When** the order summary renders
**Then** it shows all cart items, quantities, unit prices, subtotal, shipping ($5), tax (10%), total; the shipping address is displayed; "Place Order" initiates payment; "Back" returns to Step 3

## Story 4.3: Order Confirmation Page & Confirmation Email

As a shopper,
I want to see a clear order confirmation and receive an email with my order details,
So that I have proof of purchase and know what to expect next.

**Acceptance Criteria:**

**Given** payment has succeeded and the order is confirmed
**When** the shopper lands on `/order-confirmation/:orderId`
**Then** the page shows: a success icon in Oren success color `#a89a7f`; "Order Confirmed!" headline (Headline MD); order ID (Label SM, uppercase); itemised list of ordered products with quantities and prices; subtotal, shipping, tax, total; shipping address; estimated delivery "3–5 business days"; a "View order details" link to `/orders/:orderId`; a "Continue shopping" secondary button

**Given** the order confirmation page is accessed directly without a valid order
**When** the page attempts to load
**Then** the page redirects to `/` or shows an Oren-styled "Order not found" message

**Given** the order status is updated to `confirmed` in the webhook handler
**When** `MailService.sendOrderConfirmation(order)` is called
**Then** the confirmation email is sent within 30 seconds of payment; the email contains: Oren brand name, order ID, all ordered items (name, qty, price), totals, shipping address, estimated delivery date, a "Track your order" link

**Given** a payment failure occurs during checkout
**When** Stripe returns an error
**Then** the order remains in `pending` status; no stock is decremented; the cart data is preserved; the shopper sees a clear error and can retry without re-entering all form data

## Story 4.4: Order History & Order Detail Pages

As a shopper,
I want to view my past orders and track the status of each one,
So that I know where my purchases are and can reference order details.

**Acceptance Criteria:**

**Given** a logged-in shopper navigates to `/orders`
**When** the orders history page loads
**Then** `GET /api/orders` returns the shopper's orders paginated (newest first); each order row shows: order ID (Label SM), date, item count, total, status badge (colour-coded using Oren semantic colours); status filter tabs (All, Pending, Confirmed, Shipped, Delivered) filter the list; if no orders exist: "No orders yet. Start shopping!" with a CTA to `/`

**Given** the shopper clicks on an order row
**When** they navigate to `/orders/:orderId`
**Then** `GET /api/orders/:id` returns the full order; the detail page shows: order ID, order date, all items (image thumbnail, name, qty, unit price), subtotal / shipping / tax / total, shipping address, a status timeline (Pending → Confirmed → Shipped → Delivered) with timestamps for each completed step, estimated delivery date, a "Contact support" static link

**Given** `GET /api/orders` is called
**When** the endpoint responds
**Then** it returns only the authenticated user's own orders (never other users' orders); orders include nested `orderItems` with snapshotted product name and price; the `userId` on the order matches the JWT `sub` claim

**Given** the shopper's order status changes (e.g., admin marks as Shipped)
**When** they reload `/orders/:orderId`
**Then** the status timeline updates to show the new step as completed with a timestamp

---
