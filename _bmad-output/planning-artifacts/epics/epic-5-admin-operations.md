# Epic 5: Admin Operations

The admin can manage the product catalogue, fulfill and cancel orders, and monitor inventory and sales from a protected dashboard.

## Story 5.1: Admin Route Group & Dashboard

As an admin,
I want to access a protected dashboard that shows me key business metrics at a glance,
So that I can monitor sales, pending orders, and stock alerts without digging through data.

**Acceptance Criteria:**

**Given** the admin route group needs to be created
**When** `app/(admin)/admin/layout.tsx` is created
**Then** the layout performs a server-side auth check: reads the JWT, decodes the role; if `role !== 'admin'` it redirects to `/login`; if `role === 'admin'` it renders the admin shell (sidebar nav + content area); the admin shell uses a desktop-first layout; Oren palette applied (Warm Beige sidebar, Soft Ivory content area)

**Given** the admin navigates to `/admin`
**When** the dashboard page renders
**Then** four metric cards are shown: "Total Orders Today", "Pending Orders", "Low Stock Products", "Total Revenue (this month)"; each card is a Warm White surface with ambient shadow, Headline MD value, Label SM label; data fetched from `GET /api/admin/dashboard/stats`

**Given** `GET /api/admin/dashboard/stats` is called by an admin JWT
**When** the endpoint responds
**Then** it returns `{ totalOrdersToday, pendingOrders, lowStockCount, totalRevenue }`; the `LOW_STOCK_THRESHOLD` env var controls the low-stock cutoff (default 5); all admin API endpoints return 403 Forbidden for non-admin JWTs

**Given** the dashboard renders below the metric cards
**When** the page loads
**Then** a "Recent Orders" widget shows the 5 most recent orders (order ID, customer name, status badge, total); a "Low Stock Alerts" widget lists products with `stockQuantity <= threshold` with product name, stock count, and an "Edit" link; clicking any order row navigates to `/admin/orders/:id`

## Story 5.2: Admin Product Management — List, Create & Edit

As an admin,
I want to add, edit, and manage products in the catalogue,
So that the store always has accurate, up-to-date product listings for shoppers.

**Acceptance Criteria:**

**Given** the admin navigates to `/admin/products`
**When** the product list page renders
**Then** a table shows all products: columns are Name, Category, Price, Stock Qty, Status (Active/Inactive); above the table: a search input and a Category filter dropdown; pagination at 25 items per page; an "Add Product" primary button is in the top-right; soft-deleted products are shown with an "Archived" badge

**Given** the admin searches or filters the product list
**When** `GET /api/admin/products?search=&category=&page=` is called
**Then** the table refreshes with filtered results; the endpoint requires admin JWT

**Given** the admin clicks "Add Product"
**When** the `/admin/products/new` form renders
**Then** form fields are: Name (required), Description (textarea, required), Category (dropdown + "Add new…"), Price (number, required), Stock Quantity (integer, required), Images (file upload, 1–5 images, max 5 MB each), Active/Inactive toggle; all inputs use `<InputField>` Oren styling

**Given** the admin submits the add product form
**When** `POST /api/admin/products` is called
**Then** images are uploaded to S3/Cloudinary via `multer` + `@aws-sdk/client-s3` (or `cloudinary`); only object keys are stored in `product.imageKeys` (never full URLs); the product is created and the admin is redirected to `/admin/products` with a toast "Product created"; if image upload fails the product is not created

**Given** the admin clicks "Edit" on a product
**When** the `/admin/products/:id/edit` form renders
**Then** the form is pre-populated with current product data; image previews show existing images (URLs generated at read time); the admin can remove or add images; "Save Changes" calls `PATCH /api/admin/products/:id`; on success: toast "Product updated" and redirect to product list

**Given** the admin toggles a product's Active/Inactive status
**When** the toggle is saved
**Then** an inactive product is hidden from all shopper-facing pages; the product remains visible in the admin list with an "Inactive" badge

## Story 5.3: Admin Product Soft Delete & Image Storage

As an admin,
I want to archive products without losing their order history,
So that past order records remain accurate even after a product is removed.

**Acceptance Criteria:**

**Given** the admin clicks "Delete" on a product and confirms
**When** `DELETE /api/admin/products/:id` is called
**Then** the product's `deletedAt` field is set (`@DeleteDateColumn` soft delete); the product is hidden from all shopper-facing API responses; existing `OrderItems` referencing it are not affected; toast "Product archived" confirms the action

**Given** a soft-deleted product is referenced in an order detail
**When** the order detail loads
**Then** the `OrderItem` displays the snapshotted `productName` and `price` captured at order time; no "product not found" error appears

**Given** image storage via S3 or Cloudinary is configured
**When** the backend processes a product image upload
**Then** `@aws-sdk/client-s3` (or `cloudinary` SDK) is installed; `AWS_BUCKET_NAME`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (or `CLOUDINARY_URL`) are read from env; the returned object key is stored in `product.imageKeys`; `GET /api/products/:id` generates a URL from the key at read time

**Given** the `multer` middleware is configured
**When** a file upload request arrives
**Then** only image MIME types (`image/jpeg`, `image/png`, `image/webp`) are accepted; files exceeding 5 MB are rejected with HTTP 400 "File too large"; a maximum of 5 files per request is enforced

## Story 5.4: Admin Order Management — List, Detail & Status Updates

As an admin,
I want to view all orders, update their status, and cancel pending ones,
So that I can fulfill orders efficiently and keep customers informed.

**Acceptance Criteria:**

**Given** the admin navigates to `/admin/orders`
**When** the order list page renders
**Then** a table shows all orders: columns are Order ID, Customer Name, Date, Status (badge), Total; status filter tabs (All, Pending, Confirmed, Shipped, Delivered, Cancelled), a search input (by order ID or customer name), and a sort toggle (Newest/Oldest); pagination at 25 per page; data from `GET /api/admin/orders`

**Given** the admin clicks an order row
**When** the `/admin/orders/:id` detail page renders
**Then** it shows: customer name, email, phone; shipping address; ordered items (snapshotted name, qty, unit price); subtotal, shipping, tax, total; payment status; a status timeline with timestamps; a status update dropdown and a "Cancel Order" button

**Given** the admin selects a new status and clicks "Update Status"
**When** `PATCH /api/admin/orders/:id/status` is called with `{ status }`
**Then** the order status is updated in the database; a timestamp is recorded; `MailService.sendOrderStatusUpdate(order)` is called automatically; the status timeline reflects the change immediately; the dropdown only offers valid forward transitions (Pending → Confirmed → Shipped → Delivered)

**Given** `GET /api/admin/orders` or `PATCH /api/admin/orders/:id/status` is called with a customer JWT
**When** the endpoint receives the request
**Then** it returns HTTP 403 Forbidden

**Given** the admin clicks "Cancel Order" on a pending order and confirms
**When** `PATCH /api/admin/orders/:id/cancel` is called
**Then** the order status is set to `cancelled`; a cancellation email is sent noting "full refund intent" (refund processing deferred to v1.1); the cancel button is hidden for non-pending orders

## Story 5.5: Low-Stock Alerts, CI/CD & Rate Limiting Finalisation

As an admin,
I want automated low-stock alerts and a reliable deployment pipeline,
So that I never miss a restock need and every code change reaches production safely.

**Acceptance Criteria:**

**Given** the low-stock alert system is required
**When** `GET /api/admin/dashboard/stats` is called
**Then** products with `stockQuantity <= LOW_STOCK_THRESHOLD` are counted and returned as `lowStockCount`; `GET /api/admin/products/low-stock` returns the full list (name, category, current qty, threshold) for the dashboard widget

**Given** the admin views the Low Stock Alerts widget
**When** products are below threshold
**Then** each entry shows product name, current stock, and an "Edit" link; if no products are below threshold the widget shows "All products are well-stocked ✓" in Oren success color `#a89a7f`

**Given** the GitHub Actions CI/CD pipeline is configured
**When** a PR is opened or a commit is pushed
**Then** a workflow runs `npm run lint` and `npm test` for both backend and frontend; the PR cannot be merged if either check fails

**Given** code is merged to the `main` branch
**When** the GitHub Actions deploy workflow runs
**Then** the frontend auto-deploys to Vercel; the backend auto-deploys to Railway or Render; both deploy jobs run in parallel; a deployment failure sends a GitHub notification

**Given** the `@nestjs/throttler` rate limiting was configured in Story 1.2
**When** end-to-end protection is validated
**Then** admin endpoints (`/api/admin/*`) inherit the 60 req/min global limit; payment endpoints (`/api/payments/*`) are confirmed at 10 req/min; requests beyond the limit receive HTTP 429
