# Epic Quality Review

## Epic Structure Validation

### User Value Focus Check

| Epic | Title | User-Centric? | Verdict |
|---|---|---|---|
| 1 | Design System & User Authentication | "Shoppers can register, verify email, log in, and manage their account on a fully branded platform" | ✓ User value |
| 2 | Product Catalog & Discovery | "Shoppers can browse home page, search, filter, and read PDPs" | ✓ User value |
| 3 | Shopping Cart | "Shoppers can add products, update quantities, see out-of-stock warnings" | ✓ User value |
| 4 | Checkout & Order Lifecycle | "Shoppers complete Stripe payment, receive confirmation, view order history" | ✓ User value |
| 5 | Admin Operations | "Admin can manage products, fulfill/cancel orders, monitor inventory and sales" | ✓ User value |

No technical milestone epics ("Setup Database", "API Development", "Infrastructure Setup") found.

**Note on Story 1.1:** "Oren Design System Foundation" is a quasi-technical story (configuring Tailwind tokens, base components). It is user-framed ("As a shopper, I want a consistent, premium visual identity") and deliberately integrated into Epic 1 alongside auth stories rather than isolated as a standalone technical epic. This is an intentional, defensible design choice that avoids design-token duplication across 20+ stories. **Not a violation.**

### Epic Independence Validation

| Epic | Independent of future epics? | Dependencies |
|---|---|---|
| 1 | ✓ Fully standalone | None — extends existing brownfield auth |
| 2 | ✓ Standalone | Epic 1 (auth for add-to-cart context) — backward dependency |
| 3 | ✓ Standalone | Epics 1+2 — backward dependencies only |
| 4 | ✓ Standalone | Epics 1+2+3 — backward dependencies only |
| 5 | ✓ Standalone | Epics 1+2+4 — backward dependencies only |

No forward dependencies detected between epics. Epic N never requires Epic N+1.

## Story Dependency Analysis

### Within-Epic Dependencies (all correct)

**Epic 1:**
- 1.1 → 1.2: 1.2 adds role to User entity (brownfield) — independent of 1.1 ✓
- 1.2 → 1.3: 1.3 uses auth endpoints (already in brownfield) + design components from 1.1 ✓
- 1.3 → 1.4: 1.4 builds login on top of registration flow ✓
- 1.4 → 1.5: 1.5 uses auth state established in 1.4 ✓

**Epic 2:** 2.1 → 2.2, 2.3, 2.4 (all depend only on Product entity from 2.1) ✓

**Epic 3:** 3.1 → 3.2 → 3.3 (strict sequence, correct) ✓

**Epic 4:** 4.1 → 4.2 → 4.3; 4.1 → 4.4 (parallel dependency on backend) ✓

**Epic 5:** 5.1 → 5.2 → 5.3; 5.1 → 5.4; 5.1 → 5.5 (all depend on admin route from 5.1) ✓

No story references future stories as dependencies.

### Database/Entity Creation Timing

| Entity/Table | Created in | Assessment |
|---|---|---|
| `users.role` column | Story 1.2 | ✓ First time admin role is needed |
| `products` table | Story 2.1 | ✓ First time products are needed |
| `cart_items` table | Story 3.1 | ✓ First time cart is needed |
| `inventory_reserves` table | Story 3.1 | ✓ Created when cart backend is set up (needed before checkout) |
| `orders` + `order_items` tables | Story 4.1 | ✓ First time orders are needed |

No "create all tables upfront" anti-pattern. Each table is created in the story that first requires it.

## Acceptance Criteria Quality

Sampled and validated ACs across all epics:

| Story | Given/When/Then? | Error conditions? | Specific outcomes? | Verdict |
|---|---|---|---|---|
| 1.2 Role Extension | ✓ | ✓ (403 for customer JWT) | ✓ (exact column definition, HTTP codes) | ✓ Pass |
| 2.1 Product API | ✓ | ✓ (404 for soft-deleted/inactive) | ✓ (paginated shape, query params named) | ✓ Pass |
| 3.1 Cart Backend | ✓ | ✓ (HTTP 400 "Insufficient stock") | ✓ (specific cart response shape) | ✓ Pass |
| 4.1 Order Backend | ✓ | ✓ (stock < 0 flagged not thrown, payment failure flow) | ✓ (idempotency key, webhook handler events named) | ✓ Pass |
| 4.2 Checkout UI | ✓ | ✓ (Stripe error inline, cart preserved on failure) | ✓ (each step's content specified) | ✓ Pass |
| 5.1 Admin Dashboard | ✓ | ✓ (403 for non-admin) | ✓ (exact metric names, env var for threshold) | ✓ Pass |
| 5.4 Order Management | ✓ | ✓ (403 for customer JWT) | ✓ (only valid forward transitions in dropdown) | ✓ Pass |

No vague criteria ("user can login"), no missing error conditions, no non-measurable outcomes found.

## Best Practices Compliance Checklist

| Check | Epic 1 | Epic 2 | Epic 3 | Epic 4 | Epic 5 |
|---|---|---|---|---|---|
| Delivers user value | ✓ | ✓ | ✓ | ✓ | ✓ |
| Functions independently | ✓ | ✓ | ✓ | ✓ | ✓ |
| Stories appropriately sized | ✓ | ✓ | ✓ | ✓ | ✓* |
| No forward dependencies | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tables created when first needed | ✓ | ✓ | ✓ | ✓ | N/A |
| Clear BDD acceptance criteria | ✓ | ✓ | ✓ | ✓ | ✓ |
| FR traceability maintained | ✓ | ✓ | ✓ | ✓ | ✓ |

*Story 5.5 bundles three concerns (low-stock alerts, CI/CD, rate-limit validation) — all small items, acceptable sizing.

## Quality Findings by Severity

### 🔴 Critical Violations

None.

### 🟠 Major Issues

None.

### 🟡 Minor Concerns

**MC-1: Story 1.1 is a technical prerequisite framed as user value.**
Justification accepted (deliberate design choice, not isolated as a technical epic, immediately followed by auth stories that make Epic 1 deliver complete user value). No remediation required; document in implementation notes.

**MC-2: Story 5.5 bundles three distinct concerns.**
"Low-Stock Alerts, CI/CD & Rate Limiting Finalisation" combines infrastructure items that are small but conceptually separate. Not a sizing problem in practice (all three together are under one story's scope). No remediation required.

**MC-3: Rate limiting configured in Story 1.2 but validated in Story 5.5.**
Split is intentional (configure early, end-to-end validate at project close). No remediation required; developer must carry the throttler config context from Story 1.2 through to Story 5.5 validation.

**MC-4: `POST /api/cart/merge` endpoint (Story 3.3) not in Story 3.1 API spec.**
Story 3.3 specifies a `POST /api/cart/merge` endpoint for guest→authenticated cart merge, but this endpoint is not listed in Story 3.1's backend API acceptance criteria. The developer creating Story 3.3 will need to add this endpoint — it won't exist from Story 3.1 alone. Recommend: when creating the Story 3.3 story file, explicitly note that the merge endpoint must be added to the CartController.

## Quality Summary

- Total Epics reviewed: 5 / 5
- Total Stories reviewed: 21 / 21
- Critical violations: 0
- Major issues: 0
- Minor concerns: 4
- Overall quality rating: **High — implementation-ready**

---
