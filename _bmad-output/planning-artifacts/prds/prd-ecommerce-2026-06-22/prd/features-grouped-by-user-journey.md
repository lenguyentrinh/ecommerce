# Features Grouped by User Journey

## A. Shopper Features

### A.1 Product Browsing & Discovery
- **Home page**: Featured products, category navigation, banner/hero section
- **Category pages**: Product grid filtered by category (Fashion, Electronics, Lifestyle, etc.)
- **Product detail page**: 
  - Product images (gallery)
  - Title, description, price
  - Stock status indicator
  - "Add to Cart" button
  - Related/recommended products (hardcoded list in MVP, AI recommendations in future)

### A.2 Search & Filtering
- **Search bar** (global, on all pages)
  - Free-text search across product titles and descriptions
  - Real-time suggestions (optional; can defer to v1.1)
- **Filters** on category/search results:
  - Price range (min–max slider)
  - Category / Subcategory
  - Stock status (in stock, out of stock)
  - Sort: By price (low-to-high, high-to-low), by newest, by popularity (hardcoded in MVP)

### A.3 Shopping Cart
- **Add to cart**: Quantity selector, confirmation toast/message
- **View cart page**: 
  - Cart summary: Product list with image, name, price, quantity
  - Update quantity: +/– buttons to adjust per item
  - Remove item: Delete from cart
  - Cart subtotal, taxes (hardcoded flat rate), shipping, total
  - "Continue Shopping" and "Proceed to Checkout" buttons
- **Cart persistence**: Cart saved in localStorage or session (synced with backend if user is logged in)
- **Cart sync**: If product goes out of stock after adding to cart, cart item shows warning

### A.4 User Authentication
- **Registration** (optional, but encouraged):
  - Email, password, name, phone (optional)
  - Email verification (OTP or link)
  - Password strength indicator
- **Login**: Email + password
- **Guest checkout** (optional pathway; if not included in MVP, require registration)
- **Account page** (post-login):
  - Profile info (name, email, phone)
  - Shipping address book (save multiple addresses)
  - Order history

### A.5 Checkout Flow
- **Checkout page** (multi-step or single page):
  - Step 1: Shipping address (new or saved address)
  - Step 2: Shipping method (flat rate in MVP; future: calculated)
  - Step 3: Payment (card details via Stripe test mode)
  - Step 4: Review & confirm order
- **Form validation**: Real-time error messages, clear labeling
- **Payment processing** (mock in MVP):
  - Accept test card details (Stripe test mode or mock endpoint)
  - Show loading state during processing
  - Clear success or error message post-payment
- **Order confirmation**:
  - Order ID, subtotal, tax, shipping, total
  - Estimated delivery date
  - Confirmation email to customer (with order ID, items, tracking link)
  - "View order details" link to order tracking

### A.6 Order Management (Shopper View)
- **Order history page**:
  - List of past orders with order ID, date, total, status
  - Filter by status (pending, confirmed, shipped, delivered)
- **Order detail page**:
  - Order ID, date, items, quantities, prices
  - Shipping address and tracking info
  - Order status timeline (pending → confirmed → shipped → delivered)
  - Estimated delivery date
  - Contact support button (static link in MVP)

---

## B. Admin Features

### B.1 Admin Dashboard
- **Overview metrics**:
  - Total orders (today, this week, this month)
  - Pending orders (need action)
  - Low-stock products (alerts)
  - Total sales (revenue, if MVP includes this)
- **Quick access**:
  - Recent orders widget
  - Top-selling products
  - Low-stock alerts

### B.2 Product Management
- **Product list**:
  - Table view: Product name, category, price, stock quantity, status (active/inactive)
  - Search / filter by name, category, stock status
  - Pagination (if list is long)
- **Add product**:
  - Form fields: Name, description, category, price, stock quantity, images
  - Image upload (1–5 images per product)
  - Publish (active/inactive toggle)
  - Save and continue or back to list
- **Edit product**: Same form, pre-populated with current data
- **Delete product**: Soft delete (hide from store); item remains in order history
- **Bulk actions** (optional; can defer): Bulk price update, bulk stock update

### B.3 Order Management
- **Order list**:
  - Table: Order ID, customer name, date, status, total amount
  - Filter by status (pending, confirmed, shipped, delivered, cancelled)
  - Search by order ID or customer name
  - Sort by date (newest first) or status
- **Order detail**:
  - Customer name, email, phone
  - Shipping address
  - Items ordered (product name, quantity, price per item)
  - Order subtotal, shipping, tax, total
  - Payment status (paid, pending, failed)
  - Order status timeline with timestamps
- **Update order status**:
  - Dropdown: Pending → Confirmed → Shipped → Delivered
  - Status change triggers customer notification email
  - Timestamp recorded for each status change
- **Cancel order** (admin-only):
  - Only allowed for pending orders
  - Triggers refund notification (full refund logic deferred; MVP documents refund intent)
  - Order marked as cancelled in history

### B.4 Inventory Management
- **Stock tracking**:
  - Product list shows current stock quantity
  - Edit product to update stock
- **Low-stock alerts**:
  - Products below threshold (configurable, e.g., 5 units) flagged in dashboard
  - Alert badge on inventory page
- **Stock sync**:
  - Stock decremented on order confirmation (not earlier)
  - Prevent overselling (validation check before order completion)

---
