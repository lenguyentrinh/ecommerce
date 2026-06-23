# User Journeys

## Journey 1: Shopper - Browse, Search, Purchase, and Track Order

**Protagonist**: Maya, a busy consumer shopping for electronics and fashion online.

**Flow**:
1. **Browse** → Maya lands on the home page, sees featured products or categories
2. **Search & Filter** → Maya searches for "wireless headphones" and filters by price, rating, or brand
3. **View Product** → Maya clicks a product, sees images, description, price, stock status, reviews (future)
4. **Add to Cart** → Maya adds the item to her cart; cart updates with quantity and total
5. **Manage Cart** → Maya reviews her cart, updates quantity, removes items if needed
6. **Checkout** → Maya enters shipping address, selects shipping method, reviews order summary
7. **Authentication** → Maya logs in or registers; form is streamlined and part of checkout (not a friction point)
8. **Payment** → Maya enters payment details (mock payment in MVP), sees confirmation of charge
9. **Order Confirmation** → Maya receives order summary with order ID, estimated delivery, and next steps
10. **Order Tracking** → Maya visits "Order History" to view order status and track progress

**Critical Moments** (where we must not fail):
- ✅ Cart is always in sync with inventory
- ✅ Checkout does not lose data on network interruption (or gracefully recovers)
- ✅ Payment confirmation is reliable (99%+ success rate)
- ✅ Order confirmation email arrives promptly with order details

**Edge Cases & Handling**:
- **Out of stock during checkout**: If product goes out of stock after adding to cart but before payment, warn user and offer similar products or removal
- **Failed payment**: Clear error message, user can retry without losing cart data
- **Abandoned cart**: Cart persists; no deletion in MVP (future: recovery emails)
- **Duplicate order prevention**: Idempotent payment submission (prevent double charges)

---

## Journey 2: Admin - Manage Inventory and Orders

**Protagonist**: Alex, the business owner managing products and customer orders.

**Flow**:
1. **Admin Login** → Alex logs in to admin dashboard with secure credentials
2. **View Dashboard** → Alex sees overview: recent orders, low-stock alerts, sales summary
3. **Manage Products** → Alex can:
   - **Add product**: Upload images, enter description, price, stock quantity, category
   - **Edit product**: Update details, pricing, stock levels
   - **Delete product**: Remove listing (soft delete or archive in future)
4. **Manage Orders** → Alex can:
   - **View orders**: Filter by status (pending, confirmed, shipped, delivered)
   - **Update order status**: Mark as confirmed, shipped, or delivered
   - **View order details**: Customer info, items ordered, shipping address, payment status
5. **Manage Inventory** → Alex monitors stock levels and gets alerts for low inventory

**Critical Moments**:
- ✅ Order status changes propagate to customer email instantly
- ✅ Inventory updates prevent overselling
- ✅ Admin actions are logged for audit trail

**Edge Cases**:
- **Low stock alert**: Auto-flag products below threshold (configurable in MVP)
- **Order cancellation**: Basic admin-only capability to cancel pending orders (refund logic deferred)
- **Concurrent edits**: If product is edited while customer views it, data consistency is maintained

---
