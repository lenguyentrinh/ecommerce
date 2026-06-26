# Sprint Change Proposal — 2026-06-26 (Address Field Set)

**Trigger:** Story 1.5 account address form vs Epic 4 / Story 4.2 checkout field-set conflict
**Author:** Correct Course (facilitated) for Nguyen Trinh
**Change scope classification:** **Moderate** (reopens a slice of an in-review frontend story; amends the not-yet-built backend story; aligns two backlog Epic 4 stories)
**Decision:** **Add Postal Code only.** Re-add `postalCode` to the account address form; `country` becomes a fixed single-market value (server-set, not a user field); `state` dropped permanently.

---

## 1. Issue Summary

During Story 1.5 UI polish (2026-06-26), the account shipping-address form was simplified from the originally-specced `{ fullName, line1, city, state, postalCode, country }` (all required) to `{ firstName, lastName, street, city }` + `isDefault`. **Postal Code, Country, and State were removed from the form.**

This surfaced during a checkpoint/as-built reconciliation of the Story 1.5 spec files. A saved shipping address with no postal code cannot fulfil an Epic 4 order (Story 4.1 snapshots `shippingAddress` as JSON onto the order and into the confirmation email; Story 4.2 lets the shopper select a saved address at checkout).

## 2. Impact Analysis

- **Story 1.5 frontend** (shipped, `review`): form/schema/type need `postalCode` re-added (required). Small, contained reopen.
- **Story 1.5 backend** (`ready-for-dev`, not built): entity/migration/DTO/service — cheapest to fix now, before code exists.
- **Story 4.1 (order, backlog):** `shippingAddress` JSON snapshot stays valid; with a fixed `country` and required `postalCode`, a saved address is complete. **No create-body change** (still `shippingAddressId`).
- **Story 4.2 (checkout, backlog):** the Step-1 "no saved address" field list must align (`First Name, Last Name, Street Address, City, Postal Code`; Country fixed; State removed). "Select saved address" now yields a directly-shippable address.
- **PRD:** multi-currency deferred to v1.1; flat $5 shipping; no carrier/address-validation API → **single-market (USD) MVP**, so `Country` as a constant is consistent and a per-address Country/State field would over-build. **No PRD change required.**

## 3. Recommended Approach — Direct Adjustment

**Add Postal Code only.** Rationale: Postal Code is the one field shipping genuinely requires; Country is redundant in a single-market MVP (server-set constant keeps the order snapshot + email complete); State is unnecessary for flat shipping and adds form friction. This restores checkout-readiness with the *minimum* reversal of the shipped UI simplification, and stays faithful to the PRD's single-market scope.

- Effort: ~1 small frontend change + backend spec edits + 2 Epic 4 AC edits.
- Risk: low. Backend not yet built; frontend change is one field.
- Timeline: negligible; unblocks Epic 4 checkout cleanly.

## 4. Detailed Change Proposals

### 4a. Frontend code (Story 1.5 — reopen a slice; `bmad-agent-dev-frontend`)

**`frontend/lib/validation/accountSchemas.ts` — `addressSchema`**
```
OLD: city: z.string().min(1, 'City is required'),
     isDefault: z.boolean().optional(),
NEW: city: z.string().min(1, 'City is required'),
     postalCode: z.string().min(1, 'Postal code is required'),
     isDefault: z.boolean().optional(),
```

**`frontend/features/account/components/AddressForm.tsx`**
- Re-add the Postal Code `InputField` (the one removed this session); place City + Postal Code in a 2-column row (`md:grid-cols-2`).
- Add `postalCode: ''` to the `EMPTY` default and `postalCode: a.postalCode` to the edit-mode `reset()`.

**`frontend/services/usersAPI.ts` — `Address`**
```
OLD: postalCode?: string;
     country?: string;
NEW: postalCode: string;   // required again (shipping needs it)
     country?: string;     // server-set single-market constant; optional in client payload
```

**Tests** — `AddressForm.test.tsx`: re-add the Postal Code field assertion and fill it in the submit test.

### 4b. Backend spec (Story 1.5 backend — `ready-for-dev`; `bmad-agent-dev-backend`)

- **Entity / migration:** `postal_code varchar(255) NOT NULL` (not nullable); `country varchar(255) NOT NULL` set **server-side to the single-market constant** (e.g. `'United States'`) — not collected from the DTO; **no `state` column**.
- **`create-address.dto.ts`:** `postalCode` `@IsNotEmpty() @IsString()` (required); `firstName, lastName, street, city` required; `isDefault?` optional; **remove `country`/`state` from the DTO** (country server-set).
- **`addAddress` / `editAddress`:** set `country` to the single-market constant (consider a config/env constant, e.g. `STORE_DEFAULT_COUNTRY`).

### 4c. Epic 4 alignment (`planning-artifacts/epics/epic-4-checkout-order-lifecycle.md`)

**Story 4.2, Step 1 (Shipping Address)**
```
OLD: if no saved addresses: the form shows fields
     (Full Name, Address Line 1, City, State, Postal Code, Country)
NEW: if no saved addresses: the form shows fields
     (First Name, Last Name, Street Address, City, Postal Code);
     Country is a fixed single-market value (not an input); State omitted for MVP.
     "Select saved address" yields a complete, shippable address.
```

**Story 4.1** — no change. `shippingAddress` JSON snapshot now always includes a complete address (required postalCode + constant country).

### 4d. Story 1.5 spec files — flip the open flag to resolved

In all three `1-5-*` files: update the address field set to `{ firstName, lastName, street, city, postalCode }` + `isDefault` (postalCode required; country server-set constant; state dropped), and change the ⚠️/🔶 "open decision / conflicts with Epic 4" notes to "**Resolved 2026-06-26 via correct-course** — add Postal Code; Country fixed single-market; State dropped."

## 5. Implementation Handoff

**Scope: Moderate** → Product Owner / Dev coordination.

1. **Frontend dev (Felix):** apply 4a (re-add postalCode field + schema + type + test). Story 1.5 frontend stays in `review` after.
2. **Backend dev (Bruno):** build Story 1.5 backend per 4b (postal_code NOT NULL, country constant, no state).
3. **Doc updates:** apply 4c (Epic 4) and 4d (Story 1.5 files).

**Success criteria:** account form captures Postal Code (required); saved address is directly usable as Epic 4 `shippingAddressId`; order snapshot + confirmation email contain a complete address; no per-address Country/State fields; specs internally consistent.

---

---

## 6. Override — same-day reversal (2026-06-26)

After this proposal was approved and the frontend change applied, the **"Add Postal Code only" decision was reversed by user direction**: Postal Code is to stay **out** of the account address form. The frontend code was reverted (no `postalCode` in `AddressForm` / `accountSchemas` / `Address` type / test).

**Effective resolution is now Option B (checkout owns shipping fields):**
- The account address form stays slim: `{ firstName, lastName, street, city }` + `isDefault`. Saved addresses are a **convenience pre-fill**, not complete shipping addresses.
- **Epic 4 / Story 4.2** checkout Step 1 **always collects Postal Code** (Country = fixed single-market constant; State omitted). Selecting a saved address pre-fills name/street/city only.
- **Epic 4 / Story 4.1 consequence (action needed):** the order's `shippingAddress` JSON must be built from the **completed checkout form**, so the create body needs the full address (or `shippingAddressId` **plus** the checkout-collected Postal Code) — **not `shippingAddressId` alone**. Update Story 4.1's create-body contract when that story is built.
- **Backend (Story 1.5):** `postal_code` / `country` stay **nullable** on the `addresses` table (consistent with Option B) — no further backend change needed.

**Trade-off accepted:** a saved address alone is not shippable; the shopper re-enters Postal Code at checkout each time.

*Generated by bmad-correct-course, 2026-06-26. Section 6 records the same-day override.*
