# Validation Report — ecommerce (Oren)

- **DESIGN.md:** `_bmad-output/planning-artifacts/ux-designs/ux-ecommerce-2026-06-22/DESIGN.md`
- **EXPERIENCE.md:** `_bmad-output/planning-artifacts/ux-designs/ux-ecommerce-2026-06-22/EXPERIENCE.md`
- **Run at:** 2026-06-22
- **Lenses run:** Rubric walker

## Overall verdict

The pair is in solid shape after the Stitch reconciliation: the visual purge worked (zero indigo/Inter residue), color tokens are fully defined with hex, and both Key Flows are well-formed (named protagonist Maya, numbered steps, climax beats, failure-avoidance paths). The main weaknesses are **scope creep beyond the stated MVP** (Cart, Order Confirmation, Order History are speced as IA and appear in flows but have no component/state/flow support), a **DESIGN.md ↔ EXPERIENCE.md contradiction on product-card aspect ratio and grid**, and an **orphaned, off-brand `.working/` artifact** plus the documented-but-absent key-screen mockups. Nothing is broken, but several mediums would bite an implementer.

## Category verdicts

- Flow coverage — adequate
- Token completeness — **strong**
- Component coverage — adequate
- State coverage — adequate
- Visual reference coverage — **thin**
- Bloat & overspecification — adequate
- Inheritance discipline — adequate
- Shape fit — **strong**

## Findings by severity

### Critical (0)
_None._

### High (1)

**[Visual reference] Orphaned, off-brand `.working/design-direction.html`** (§5 · `.working/design-direction.html`)
The artifact is pre-pivot residue contradicting the source of truth: indigo `#4f46e5`/`#4338ca` CTAs, near-black `#1a1a1a` + warm-brown `#8b7355` text, system-font stack (no Nunito Sans), "Warm Boutique Commerce" subtitle, 6–12px radii (not 16px/pill), and "Wireless Headphones / Electronics" content — exactly what D4 says was purged. Not referenced by either spine.
Fix: delete or regenerate it to the Oren system; in its current state it's a trap for anyone opening `.working/`.

### Medium (10)

**[Flow] Flow 1 promises Cart→Checkout→Confirmation the spec doesn't cover** (§1 · Flow 1 steps 9–10)
Those surfaces have no Key Flow, no state coverage, and Checkout is explicitly Deferred. Fix: trim Flow 1 to the add-to-cart success beat, or add minimal Cart/Confirmation flow + states.

**[Token] Warm-gray price/metadata color ships sub-AA** (§2 · DESIGN.md Product Card / PDP)
Warm Gray `#787770` on Soft Ivory `#faf7f2` ≈ 3.1:1, below the 4.5:1 body floor; DESIGN.md line 141 leaves "darken where it fails" as a live TODO. Fix: bump metadata to `#6a6a63`+ that passes, or classify price/metadata as large-text and state the 3:1 target.

**[Component] Toast/notification has no DESIGN.md visual spec** (§3 · Components)
It's the success-feedback climax of both flows and the error channel, but has no surface/radius/shadow/position token. Fix: add a Toast entry (surface `#fff8f4`, radius lg 16px, ambient shadow, dismiss timing).

**[Component] Filter dropdown has no DESIGN.md visual anatomy** (§3 · Components)
Behavioral rules exist (expand, checkboxes, apply/clear) but no visual spec. Fix: add a Filter/dropdown visual spec or fold under an existing surface.

**[State] PDP has no state coverage** (§4 · State Patterns)
No PDP cold-load skeleton, no product-fetch error/404, and out-of-stock lives only on the card. Fix: add PDP skeleton, product-not-found error, and PDP out-of-stock state.

**[State] Cart and Order Confirmation have no states** (§4 · State Patterns)
Empty cart is covered, but cart loading, item-removed, and order-confirmation success/failure are not. Fix: defer these surfaces explicitly out of MVP (and trim Flow 1) or add their states.

**[Inheritance] EXPERIENCE.md has no `sources:` frontmatter** (§7 · EXPERIENCE.md frontmatter)
Inheritance from DESIGN.md/PRD is prose-only, not machine-declared. Fix: add `sources:` (DESIGN.md and the PRD if one exists).

**[Inheritance] DESIGN.md has no `components:` frontmatter block** (§7 · DESIGN.md frontmatter)
Component specs are prose-only, not machine-resolvable. Fix (recommended): add a `components:` map (button-primary, product-card, input, search-bar, chip, toast) using `{colors.*}`/`{rounded.*}` references.

**[Inheritance] Aspect-ratio / grid contradiction across the pair** (§7 · DESIGN.md Product Card vs EXPERIENCE.md line 393)
DESIGN.md = 4:5 portrait images + 2-col staggered masonry; EXPERIENCE.md Responsive = square 1:1 + plain 2-col grid. DESIGN.md is source of truth. Fix: correct EXPERIENCE.md to 4:5 + masonry, or log a deliberate deviation.

**[Shape fit] Inspiration & Anti-patterns section missing though triggered** (§8 · EXPERIENCE.md)
The log shows explicit references (editorial lookbooks, Pinterest, COS/The Row) and rejects (light 300/400 weights, 4px corners, indigo/Inter, algorithmic search-first). Fix: add an Inspiration & Anti-patterns section capturing references + rejected pivots.

### Low (13)

- **[Flow]** Failure paths are "to avoid" bullet lists, not inline forks at the climax step. Fix: add a one-line failure fork to each flow.
- **[Flow]** Order History (surface 7) and Category Browse (surface 3) have no journey. Fix: mark navigational-only or defer.
- **[Token]** Define which text roles are permitted on `surface-secondary` `#e8dccb` (Warm Gray on beige repeats the sub-AA risk).
- **[Token]** Tag unreferenced semantic reserves (`success`, `alert`, `error-container`, `surface-container`) as "reserved".
- **[Component]** "Variant selector" naming: DESIGN.md "Size selector" (sub-bullet) vs EXPERIENCE.md "Variant Selector" — unify + promote to a named Components entry.
- **[Component]** Secondary button has visual but no behavioral spec; chips' filter-toggle behavior lives only inside Variant Selector.
- **[State]** Order History has no empty/loading/error states (consistent with being unscoped — flag deferred).
- **[State]** Offline state is global-banner only; "Offline mode limited" microcopy implies unspecified behavior. Fix: one line on what "limited" means.
- **[Bloat]** EXPERIENCE.md restates DESIGN.md hex literals (Add-to-Cart, Variant, disabled). Fix: drop hex, keep role names.
- **[Bloat]** "Design System Reference" re-summarizes the whole palette/type/spacing; a one-line "inherits DESIGN.md; deltas below" is leaner.
- **[Bloat]** Admin Experience form-factor + Admin IA are placeholder sections for v1.1-deferred scope. Fix: compress to one "Admin deferred to v1.1" line.
- **[Inheritance]** Grid counts + PDP 60/40 split agree across files (positive note).
- **[Shape fit]** No invented sections fail to earn their place; structure is clean (positive note).

## Reviewer files

- `review-rubric.md`
