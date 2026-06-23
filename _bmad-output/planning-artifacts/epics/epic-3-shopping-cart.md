# Epic 3: Shopping Cart

Shoppers can add products to their cart, update quantities, remove items, and see a full order summary with out-of-stock warnings.

## Story 3.1: Cart Backend — Entity, API & Inventory Reserve

As a shopper,
I want my cart to be stored server-side when I'm logged in,
So that my items are preserved across devices and sessions.

**Acceptance Criteria:**

**Given** the NestJS backend needs a `CartModule`
**When** the module is scaffolded
**Then** a `CartItem` entity exists with fields: `id`, `userId` (FK → users), `productId` (FK → products), `quantity` (int), `createdAt`, `updatedAt`; a TypeORM migration creates the `cart_items` table; `synchronize: false` is confirmed

**Given** the `inventory_reserves` table is required for checkout integrity
**When** the migration runs
**Then** an `inventory_reserves` table exists with: `id`, `productId` (FK → products), `sessionId` (string), `quantity` (int), `expiresAt` (datetime); a `@nestjs/schedule` cron job runs every 5 minutes and deletes rows where `expiresAt < NOW()`; `@nestjs/schedule` is installed and registered in `AppModule`

**Given** a logged-in shopper calls `POST /api/cart`
**When** the request body is `{ productId, quantity }`
**Then** if the product is active and has sufficient stock: a `CartItem` is created or its quantity incremented; the response returns the updated cart; if `quantity` would exceed available stock: HTTP 400 with message "Insufficient stock"

**Given** `GET /api/cart` is called by an authenticated user
**When** the endpoint responds
**Then** it returns all cart items for that user: `{ items: [{ product: { id, name, price, imageUrl, stockQuantity, isActive }, quantity }], subtotal }`; image URLs are generated at read time from stored keys

**Given** `PATCH /api/cart/:itemId` is called with `{ quantity }`
**When** the request is processed
**Then** if `quantity > 0`: the item quantity is updated; if `quantity === 0`: the item is removed; if `quantity > stockQuantity`: HTTP 400 "Insufficient stock"; response returns updated cart

**Given** `DELETE /api/cart/:itemId` is called
**When** the request is processed
**Then** the cart item is removed; response returns updated cart

## Story 3.2: Cart UI — Add to Cart & Cart Page

As a shopper,
I want to add items to my cart from any product page and manage them on the cart page,
So that I can collect the products I want before checking out.

**Acceptance Criteria:**

**Given** the shopper clicks "Add to Cart" on a product card or PDP
**When** the action completes successfully
**Then** the button text changes to "✓ Added to Cart" briefly (1.5s) then resets; a toast notification appears bottom-left "Added to cart! View cart or keep shopping." (3s auto-dismiss); the cart item count in the header increments; the animation uses the 300ms calm easing

**Given** adding to cart fails (network error or insufficient stock)
**When** the API returns an error
**Then** a toast "Failed to add to cart. Please try again." appears; the button returns to its default state; no silent failures occur

**Given** the shopper navigates to `/cart`
**When** the cart page renders
**Then** it shows: a list of cart items — each with product image (16px radius thumb), product name (16px/600), price (16px/400/Warm Gray), quantity +/– controls, and a remove (×) button; an order summary panel with subtotal, flat shipping fee ($5), flat tax (10%), and total; "Continue Shopping" secondary button and "Proceed to Checkout" primary button

**Given** the shopper adjusts a quantity with the +/– controls
**When** the control is clicked
**Then** `PATCH /api/cart/:itemId` is called immediately; the subtotal and total update in real time; the – button is disabled at quantity 1; the + button is disabled if quantity equals available stock

**Given** the shopper clicks the remove (×) button on a cart item
**When** `DELETE /api/cart/:itemId` completes
**Then** the item disappears from the list with a fade-out; the totals update; if the cart is now empty the empty state renders

**Given** the cart is empty
**When** the cart page renders
**Then** an empty state shows: a centered icon, "Your cart is empty", and a "Continue shopping" primary button linking to `/`

## Story 3.3: Cart Persistence & Out-of-Stock Sync

As a shopper,
I want my cart to persist when I close the browser and to warn me if a product goes out of stock,
So that I never lose my selections or attempt to buy unavailable items.

**Acceptance Criteria:**

**Given** the shopper is not logged in
**When** they add items to cart
**Then** cart items are stored in `localStorage` as `oren_cart: [{ productId, quantity }]`; the cart page reads from localStorage and renders the items using product data fetched from `GET /api/products/:id`; item count in header reflects localStorage count

**Given** the shopper logs in after adding items as a guest
**When** authentication completes
**Then** the localStorage cart is merged with the server cart via `POST /api/cart/merge`; duplicate products have their quantities summed (capped at available stock); localStorage is cleared after merge; the merged cart is reflected immediately in the UI

**Given** a product in the shopper's cart goes out of stock between sessions
**When** the cart page loads and `GET /api/cart` returns product data
**Then** any cart item where `product.stockQuantity === 0` shows a warning badge "Out of stock" in Oren alert color `#c4a896`; the "Proceed to Checkout" button is disabled with tooltip "Remove out-of-stock items before checking out"; the +/– controls are hidden for out-of-stock items

**Given** a product's stock drops below the shopper's cart quantity (but not to 0)
**When** the cart loads
**Then** the quantity is capped and an inline note shows "Only X left in stock"; the +/– controls enforce the new max

---
