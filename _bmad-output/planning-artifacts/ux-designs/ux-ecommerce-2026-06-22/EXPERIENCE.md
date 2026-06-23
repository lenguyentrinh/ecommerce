---
title: "Oren — Luxury Fashion Experience Design"
project: "ecommerce (Oren)"
status: "draft"
created: "2026-06-22"
updated: "2026-06-22"
scope: "Shopper Discovery + Product Detail (MVP) — Editorial & Emotional"
brand: "Oren Premium Women's Fashion"
---

# EXPERIENCE.md — Oren Interaction & Information Architecture

How Oren feels to use: slow, thoughtful, emotional, editorial. Discovery is about inspiration and aspiration, not transactional efficiency. Behavioral spec anchored to Nunito typography and soft pastel palette from DESIGN.md.

---

## Foundation

### Form Factor & Platform Strategy

**Shopper Experience**: Mobile-first responsive (70% optimization for mobile, desktop is expanded grid).
- **Primary device**: Phone (portrait, scrolling discovery)
- **Secondary device**: Tablet/desktop (shopping sessions, comparison)
- **Touch-friendly**: 44px minimum tap targets, generous spacing
- **Responsive breakpoints**: Mobile (0–767px, 2 cols), Tablet (768–1023px, 3 cols), Desktop (1024px+, 4 cols)

**Admin Experience**: Desktop-first (100% optimization for desktop, tablet read-only).
- **Primary device**: Desktop (wide dashboard, tables, workflows)
- **Secondary device**: Tablet (status checks, basic actions)
- **Mouse-driven**: Hover states, click targets, keyboard shortcuts
- **Responsive**: Tablet-friendly (landscape orientation), mobile minimal/notifications only

### Design System Reference

Both experiences inherit from DESIGN.md tokens (Oren — Soft Minimal Luxury):
- **Colors**: Warm-neutral palette — Soft Ivory `#faf7f2` canvas, Warm Beige `#e8dccb` surfaces, Deep Muted Brown `#4a3f35` primary CTA + text, Muted Blush `#e7c6c1` / Soft Clay `#c9b2a6` accents. No tech colors.
- **Typography**: **Nunito Sans** exclusively (tracked 600/700 headlines, 400 body)
- **Spacing**: 4px base unit; ≥80px (xl) gaps between major sections
- **Shapes**: 16px card/input corners, pill buttons & chips
- **Components**: Product cards, buttons, inputs, search bar (tokens specified in DESIGN.md)
- **Accessibility**: WCAG 2.1 Level A (contrast, semantics, keyboard nav)

**Conflict resolution**: DESIGN.md wins on visual tokens (colors, fonts, shadows). EXPERIENCE.md specifies behavioral delta (how components respond, state changes, interaction patterns).

---

## Information Architecture

### Shopper IA (Discovery & Product Detail)

**Core surfaces**:

1. **Home / Discover** (landing, search-first)
   - Sticky search bar (primary entry)
   - Optional hero carousel (trending/deals, secondary)
   - Product grid (immediate visible, no scroll-to-see)
   - Category shortcuts (navigation aid, secondary)

2. **Search Results** (search query + filters)
   - Applied filters visible + clearable
   - Product grid (filtered results)
   - Sort options (price, newest, popularity)
   - Result count (transparency: "showing 24 of 156 results")

3. **Category Browse** (optional, tertiary discovery)
   - Category header + brief description
   - Product grid (filtered to category)
   - Filters + sort (same as search results)

4. **Product Detail Page (PDP)**
   - Product image gallery (hero, scrollable)
   - Product name + price + availability
   - Variant selectors (size/color, if applicable)
   - Add to cart button (primary CTA)
   - Product description (scannable, bullet points)
   - Trust elements (shipping, returns, reviews placeholder)
   - Related/recommended products (sidebar or below)

5. **Cart** (viewing items, quantities, summary)
   - Cart items list (image + name + price + quantity)
   - Update quantity / remove item
   - Cart summary (subtotal, shipping, tax, total)
   - Proceed to checkout button

6. **Order Confirmation** (post-purchase)
   - Order ID + date
   - Items ordered (recap)
   - Shipping address
   - Estimated delivery
   - Next steps (tracking link, contact support)

7. **Order History / My Orders** (account page)
   - List of past orders (date, total, status)
   - Filter by status (pending, confirmed, shipped, delivered)
   - Order detail link (view full details + tracking)

### Admin IA (Deferred to v1.1)

**Surfaces** (placeholder):
- Dashboard (overview, alerts, metrics)
- Product management (CRUD, inventory)
- Order management (list, detail, status updates)

---

## Voice and Tone

### Microcopy Philosophy

**Tone**: Professional, calm, confident, human (not robotic).
- **Not**: Sales-y, urgent, overexcited
- **Not**: Cold, formal, legal
- **Yes**: Clear, trustworthy, helpful

### Microcopy Examples

| Context | Example |
|---------|---------|
| **Search placeholder** | "Search dresses, knitwear, linen..." (conversational, on-brand) |
| **Empty state** | "No results found. Try another search or browse categories." (helpful, action-oriented) |
| **Success message** | "Added to cart! View cart or keep shopping." (friendly, offers next step) |
| **Out of stock** | "Out of stock. Similar options below." (empathetic, solution-focused) |
| **Form label** | "Shipping Address" (clear, minimal) |
| **Button labels** | "Add to Cart", "Continue to Checkout", "View Details" (action-verb driven) |
| **Trust text** | "Free shipping over $150 • 30-day returns • Free size exchanges" (concise, scannable) |
| **Error message** | "Payment failed. Please check your card details and try again." (specific, not punitive) |

---

## Component Patterns (Behavioral)

### Product Card Interaction

**Hover state (desktop)**:
- Subtle shadow appears (token: subtle shadow from DESIGN.md)
- Card elevates slightly (subtle, not jarring)

**Tap state (mobile)**:
- Card shows pressed state (opacity slight decrease)
- Navigation to PDP on tap

**States**:
- **Normal**: Image + name + price + button
- **Out of stock**: Button disabled, label "Out of Stock" over image
- **Sale/Featured**: Optional badge (secondary accent color)

### Search Bar Interaction

**Focus**:
- Border-color changes to Soft Clay `#c9b2a6` (from DESIGN.md) — soft, no aggressive focus ring
- Keyboard accessible (Tab navigation), visible focus outline retained for a11y

**Input behavior**:
- Real-time search suggestions (optional v1.1; MVP: manual search only)
- Debounce input (300ms before API call, reduces load)
- Clear button (X icon) appears when text entered

**Filter dropdown**:
- Click/tap to expand
- Checkboxes for multiple selection
- Apply button to confirm
- Clear all button to reset

### Add to Cart Button Interaction

**Default**: Deep Muted Brown `#4a3f35` pill, Ivory text; full-width (mobile), 1/2 width (desktop)

**Hover** (desktop):
- Gentle scale-up (1.02×) + slight warmth shift; 300ms `cubic-bezier(0.4,0,0.2,1)`

**Active/Press** (mobile):
- Opacity decreases slightly
- Quick feedback

**Disabled** (out of stock):
- Background muted Sand `#f1dfd1`, text Warm Gray `#787770`
- Cursor not-allowed
- Not clickable

**Success feedback** (post-click):
- Button text changes to "✓ Added to Cart" or "View Cart"
- Toast notification appears (bottom-left, 3s auto-dismiss)
- Optional: Brief bounce/highlight animation

### Variant Selector (Size/Color)

**Layout**:
- Horizontal pill chips (uppercase, tracked) or dropdown
- Selected variant highlighted (Muted Blush `#e7c6c1` fill / Soft Clay `#c9b2a6` border)

**Interaction**:
- Click/tap to select
- Real-time price update (if variant has different price)
- Visual feedback on selection

---

## State Patterns

### Loading States

**Product grid loading**:
- Skeleton cards (placeholder gray boxes) in grid
- 4-6 skeletons visible
- Smooth fade-in when real data loads

**Search results loading**:
- Show skeleton grid + "Searching..." indicator
- Max 2-second wait before timeout error

### Empty States

**No search results**:
- Large, clear message: "No results found"
- Suggestion: "Try a different search or browse categories"
- Link to browse categories or home

**Empty cart**:
- Icon + message: "Your cart is empty"
- Call-to-action: "Continue shopping"

### Error States

**Search error**:
- Message: "Something went wrong. Please try again."
- Retry button (repeats last search)
- Link to browse categories (fallback)

**Add to cart error**:
- Toast message: "Failed to add to cart. Please try again."
- No silent failures (user always informed)

**Network error**:
- Persistent banner: "Connection lost. Offline mode limited."
- Auto-retry when connection restored

---

## Interaction Primitives

### Scrolling & Navigation

**Mobile discovery**: Infinite scroll (auto-load more products as user scrolls)
- Smooth scroll behavior
- Load next page before user reaches bottom (pagination hidden)
- Loading indicator between batches (optional, subtle)

**Sticky search bar** (mobile):
- Search bar remains visible when scrolling product grid
- Scrolls away when user scrolls up to top
- Z-index: 10 (above content)

**Back navigation**:
- PDP: Back button or browser back (history-aware)
- Search results: Breadcrumb or back to home

### Forms (Checkout, Account)

**Text inputs**:
- Auto-focus first field (better mobile UX)
- Keyboard type specific (email → email keyboard, number → numeric keyboard)
- Real-time validation feedback (optional v1.1; MVP: on-blur validation)
- Error messages inline below input

**Mobile form UX**:
- Full-width inputs
- Clear labels
- Adequate tap spacing (44px minimum)
- Submit button full-width, sticky at bottom if needed

### Keyboard Navigation

**Requirements**:
- All interactive elements focusable (Tab order logical)
- Enter/Space activates buttons
- Escape closes dropdowns/modals (future)
- Screen reader compatible (semantic HTML)

---

## Accessibility Floor (Behavioral)

**WCAG 2.1 Level A** (functional accessibility, not design):

### Keyboard Navigation
- ✅ All buttons, links, inputs focusable
- ✅ Tab order logical (left-to-right, top-to-bottom)
- ✅ Focus visible (outline or border highlight)
- ✅ Escape closes any dropdowns

### Screen Reader Support
- ✅ Semantic HTML (`<button>`, `<a>`, `<label>`, heading hierarchy)
- ✅ Form labels associated with inputs (`<label for="">`)
- ✅ Image alt text (product image: "Sand Linen Midi Dress, front view")
- ✅ ARIA labels where semantic HTML insufficient (e.g., "Add to cart button, price $199")

### Color & Contrast
- ✅ No information conveyed by color alone (always paired with icon/text)
- ✅ 4.5:1 contrast ratio for body text (visual design handled in DESIGN.md)
- ✅ 3:1 contrast for UI elements and large text

### Motion & Animation
- ✅ No auto-playing animations (respects prefers-reduced-motion)
- ✅ Animations optional, not required for functionality
- ✅ GIFs/videos have play controls (future)

---

## Key Flows (Named-Protagonist Journeys)

### Flow 1: Shopper Discovery — Maya Finds a Linen Midi Dress

**Protagonist**: Maya, 28, busy professional, shopping on her phone during a quiet lunch break.

**Goal**: Find a versatile linen midi dress for work and weekend, under $200.

**Journey**:

| Step | Surface | User Action | System Response | Notes |
|------|---------|-------------|-----------------|-------|
| 1. **Land** | Home page | Opens app / lands on home | Sticky search bar visible, hero carousel (optional), product grid below | Fast, no loading wait |
| 2. **Search** | Home → Search | Taps search bar, types "linen midi dress" | Search results appear (auto-submit or manual search button) | Real-time suggestions optional (v1.1) |
| 3. **Filter** | Search results | Taps "Price" filter, selects "Under $200" | Grid filters, showing ~24 results matching criteria | Applied filters visible, easy to modify/clear |
| 4. **Browse** | Search results | Scrolls through product grid | New products load as she scrolls (infinite scroll) | Product cards show image, name, price, quick-action button |
| 5. **Discover** | Search results | Sees a product photo she likes, reads name/price | No distraction, clear hierarchy (image > price) | Quick decision-making |
| 6. **Click** | Product detail | Taps product card → PDP | Page shows large image gallery, styling notes, price, size selector, add-to-cart button | Fast page load (< 2.5s) |
| 7. **Evaluate** | Product detail | Reads styling notes, checks trust elements (shipping, returns, exchanges) | Clear, scannable information | No info hidden, no surprises at checkout |
| 8. **Decide** | Product detail | Decides to buy, taps "Add to Cart" | Button shows "✓ Added to Cart", toast notification, option to view cart or continue shopping | Positive feedback, no confusion |
| 9. **Confirm** | Cart → Checkout | Reviews cart, proceeds to checkout | Payment form appears | Transparent pricing (subtotal + tax + shipping visible upfront) |
| 10. **Complete** | Order confirmation | Enters payment details, taps "Place Order" | Order confirmation page with ID, items, shipping address, estimated delivery | Email confirmation sent, order tracking link available |

**Critical moments**:
- ✅ Search results load fast (< 2s)
- ✅ Product images are large and clear
- ✅ Add to cart is obvious and responsive
- ✅ No hidden fees (pricing transparent at checkout)
- ✅ Confirmation is clear and memorable

**Friction points to avoid**:
- ❌ Slow search (waiting > 2s)
- ❌ Unclear pricing (hidden tax/shipping until checkout)
- ❌ Complicated checkout (too many form fields, unclear steps)
- ❌ No feedback after add-to-cart (user unsure if action worked)

---

### Flow 2: Product Detail Conversion — Maya Adds to Cart

**Protagonist**: Maya (continued from Flow 1), on the PDP for the "Sand Linen Midi Dress".

**Goal**: Confirm fit and styling, then add to cart confidently.

**Journey**:

| Step | Surface | User Action | System Response | Notes |
|------|---------|-------------|-----------------|-------|
| 1. **Open** | PDP | Product detail page loads | High-quality image dominates (50% of viewport), price + availability clearly visible | No scroll-to-see critical info (price visible immediately) |
| 2. **Inspect** | PDP | Swipes through image gallery (if multi-image) | Additional product photos, can zoom (optional) | Visual exploration, high confidence |
| 3. **Read** | PDP | Scrolls to Styling Notes & details | Product name, price, fabric/fit/care in scannable lines + editorial styling copy | Not a wall of text |
| 4. **Verify** | PDP | Checks trust elements: shipping cost, return policy, exchanges | Clear text: "Free shipping over $150 • 30-day returns • Free size exchanges" | Reduces purchase anxiety |
| 5. **Select** | PDP | Taps color/size variant selector (if applicable) | Variant pills or dropdown, price updates if variant differs | Clear selected state (blush fill / clay border) |
| 6. **Decide** | PDP | Re-reads price, confirms selection | Price stays visible (sticky or scroll reminder) | Final decision point |
| 7. **Act** | PDP | Taps "Add to Cart" (large, full-width, Deep Muted Brown pill) | Button shows "✓ Added to Cart" briefly, toast notification appears: "Added to cart! View cart or keep shopping" | Positive feedback, clear next step options |
| 8. **Next** | PDP (post-add) | Taps "View Cart" or "Keep Shopping" | Navigate to cart or return to search results | User in control of momentum |

**Critical moments**:
- ✅ Price visible immediately (no scroll)
- ✅ Trust info (shipping, returns) visible before add-to-cart
- ✅ Variants clear and easy to select
- ✅ Add-to-cart button is obvious and responsive
- ✅ Success feedback is immediate and celebratory

**Conversion killers to avoid**:
- ❌ Price hidden below the fold
- ❌ Shipping cost revealed only at checkout (surprise)
- ❌ Unclear variant selector (size/color confusion)
- ❌ Silent add-to-cart (user unsure if action worked)
- ❌ Too much text (walls of detail, turns users away)

---

## Responsive & Platform Considerations

### Mobile-First (Shopper)

**Search bar**:
- Sticky, full-width, close to top (thumb-reachable area)
- Large touch target (44px+ height)

**Product grid**:
- 2 columns, 16px gap, full-width cards
- Images square (1:1 aspect ratio) for fast scanning
- Infinite scroll (no pagination buttons)

**PDP**:
- Image gallery takes 100% width (no sidebar)
- Price + CTA sticky at bottom (always reachable)
- Specs and trust info below (scroll through)

**Forms**:
- Full-width inputs
- One field per line
- Submit button full-width, sticky if needed

### Desktop (Shopper)

**Search bar**:
- Sticky or scrolls normally (less critical since mouse scrolling is easier)
- Centered, constrained width (~90% max)

**Product grid**:
- 4 columns, 24px gap
- Cards slightly larger, more breathing room
- Hover states (subtle shadow, slight elevation)

**PDP**:
- Two-column layout: Image gallery (left 60%), info (right 40%)
- Price + CTA not sticky (always visible with sidebar)
- Related products sidebar or below

---

## Document Status

**Status**: Draft  
**Scope**: Shopper Discovery + PDP (MVP priority)  
**Deferred**: Admin dashboard, checkout flow detail, account flows  
**Last updated**: 2026-06-22  
**Next**: Finalize + key-screen mockups (Home, Search Results, PDP)
