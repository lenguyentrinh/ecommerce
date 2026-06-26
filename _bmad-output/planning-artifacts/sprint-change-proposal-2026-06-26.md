# Sprint Change Proposal — 2026-06-26

**Trigger:** Story 1.5 `/account` design-fidelity check against Stitch
**Author:** Felix (Frontend) via correct-course
**Change scope classification:** **MAJOR** (epic ACs + architecture/backend + PRD boundary + UX reconciliation; affects an in-review story)

---

## 1. Issue Summary

During a post-implementation design-fidelity check, the canonical Stitch screen **"Account & Address | Oren"** (project `2621556029010588670`, screen `dff889adc5a842338fc847d74383910d`) was found to be a **two-column Settings dashboard** far richer than Story 1.5's acceptance criteria.

Story 1.5 was authored on the stated assumption that UX `EXPERIENCE.md` **deferred** account/checkout flows — so its ACs describe a simple single-column, three-card layout. A canonical Stitch design exists and **supersedes** that assumption. The frontend half of 1.5 was implemented (and is in `review`) against the simpler ACs, so it diverges from the design source of truth.

**Stitch design adds, beyond current ACs:** a left settings sidebar (Personal Details · Address Book · Order History · **Payments** · Sign Out) + editorial image; a 2-column Profile card with avatar + subtitle + lock-icon email; Address Management rendered as **address cards** with a **DEFAULT badge**, per-address **Edit/Remove**, a dashed **"New Address"** add-card, and **Country as a `<select>`**.

## 2. Impact Analysis

- **Epic 1 / Story 1.5 (ACs):** Current AC1 describes 3 stacked cards; Stitch requires the dashboard shell + richer Profile/Address treatment. **AC rewrite required.**
- **PRD boundary conflict — "Payments":** The PRD scopes payments to **checkout only** (Stripe test mode); `out-of-scope-deferred` explicitly defers *"Multiple payment methods: Apple Pay, Google Pay, other wallets."* There is **no saved-payment-methods/wallet** concept in the PRD. → A *functional* Payments section is **out of MVP scope**.
- **Architecture / Backend (Bruno's split):** New work implied — address `isDefault` column (+ migration), `PATCH /users/addresses/:id` (edit), set-default endpoint. **No** functional Payments endpoint (per PRD).
- **UX:** `EXPERIENCE.md`'s "account deferred" note is **stale** — the Stitch screen is canonical and should be referenced.
- **Frontend (in `review`):** the single-column `/account` build + its 3 test suites (9 tests) require substantial rework → the frontend story re-opens to `in-progress`.

## 3. Recommended Approach — Direct Adjustment (amend Story 1.5) + scope guard

Amend Story 1.5 to match Stitch **for in-scope sections**, with one guard:

- ✅ **Build:** settings sidebar shell (nav + "Settings" title + editorial image), 2-col Profile card (avatar, subtitle, lock email), Address Management (DEFAULT badge, per-address Edit, dashed add-card, Country `<select>`).
- 🟡 **Payments nav item:** render for **visual fidelity** as a **disabled / "Coming soon"** entry — **no** functional wallet. (Respects PRD out-of-scope; avoids a PRD change.)
- ➕ **Backend additions** (Bruno): address `isDefault` (+ migration, set-default), `PATCH /users/addresses/:id`.
- ❌ **Do NOT** build saved-payment-methods functionality in MVP. Logged as a future story if/when the PRD adds it.

**Why amend 1.5 (not a new 1.6):** same feature, same `/account` route; the frontend half is in `review` and backend hasn't started — cleanest to re-open and extend rather than fork.

## 4. Detailed Change Proposals

### 4a. Epic 1 / Story 1.5 — Acceptance Criteria (rewrite AC1; add AC6/AC7)
```
AC1 (was): three stacked cards (Profile / Shipping Addresses / Order History link).
AC1 (new): /account renders a two-column Settings dashboard —
  left: "ACCOUNT" eyebrow + "Settings" (display-lg) + vertical nav
        [Personal Details (active) · Address Book · Order History · Payments (disabled, "Coming soon") · Sign Out]
        + editorial image w/ quote (md+);
  right: Profile Information card (2-col: Full Name ‖ Email[read-only,lock], Phone full-width, avatar, subtitle, "Save Changes")
        + Address Management card.
  Tokens: Oren palette, Nunito Sans, .input-luxury inputs (surface-container bg, rounded-xl), luxury-shadow cards.

AC6 (new — Default address): saved addresses render as cards; one is flagged "DEFAULT";
  shopper can set another as default → PATCH default; badge moves. (≤2 addresses still enforced.)

AC7 (new — Edit address): each saved address has "Edit" → PATCH /users/addresses/:id updates it in place; toast "Address updated".
```

### 4b. Backend split story (`-backend.md`) — add tasks
```
+ Address.isDefault (boolean, default false) column + migration; first address auto-default.
+ PATCH /users/addresses/:id (edit, ownership-checked) → returns updated Address.
+ PATCH /users/addresses/:id/default (set default; unset others) → returns { data: Address[] } or { message }.
  (Country stays a free string; the <select> is a frontend affordance.)
```

### 4c. Frontend split story (`-frontend.md`) — supersede Tasks 8–11
```
~ Task 8 (/account): rebuild as the two-column dashboard shell (sidebar + content).
~ Task 9: ProfileSection → 2-col grid + avatar + subtitle + lock email; AddressSection → address cards
   (DEFAULT badge, Edit, Remove, dashed add-card), Country <select>, editAddressAPI + setDefaultAPI wiring.
+ Payments: disabled nav item ("Coming soon"); Order History + Sign Out as nav entries.
~ Task 11: update the 9 tests for the new structure/labels; add Edit + set-default coverage.
~ Reuse the existing InputField (default variant) where it fits; align to .input-luxury tokens.
```

### 4d. UX — reconcile
```
EXPERIENCE.md: replace "account flows deferred" note with a reference to the canonical Stitch
"Account & Address | Oren" screen.
```

## 5. Implementation Handoff

- **Scope:** MAJOR → re-open Story 1.5 (frontend `review` → `in-progress`; sprint key stays `in-progress`).
- **Backend (Bruno / `bmad-agent-dev-backend`):** 4b — `isDefault`, edit + set-default endpoints. Land first.
- **Frontend (Felix):** 4c — dashboard rebuild + test updates, integrate against 4b.
- **Out of scope (logged):** functional Payments/wallet — future story, gated on a PRD change.
- **Success criteria:** `/account` matches Stitch 95–100% for in-scope sections; Payments shown but disabled; all ACs incl. AC6/AC7 covered by passing tests; no PRD out-of-scope features built.
