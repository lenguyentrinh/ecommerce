# Spine Pair Review — ecommerce (Oren)

## Overall verdict

The pair is in solid shape after the Stitch reconciliation: the visual purge worked (zero indigo/Inter residue), color tokens are fully defined with hex, and the two Key Flows are well-formed with named protagonists, numbered steps, climax-equivalent beats, and failure paths. The main weaknesses are **scope creep beyond the stated MVP** (Cart, Order Confirmation, Order History are speced as IA surfaces and appear in flows but have no component/state/flow support), a **DESIGN.md/EXPERIENCE.md contradiction on product-card aspect ratio and grid** that downstream build would trip on, and an **orphaned, off-brand `.working/` artifact** plus the documented-but-absent key-screen mockups. Verdicts skew adequate-to-strong; nothing is broken, but several mediums would bite an implementer.

## 1. Flow coverage — adequate

Checked EXPERIENCE.md Key Flows against the IA surfaces and the decision log's stated critical loop (Discovery → PDP → Add to Cart). Both flows have a named protagonist (Maya), numbered steps, a "Decide/Act" climax beat, explicit "Critical moments," and a failure path ("Friction points / Conversion killers to avoid" + inline failure responses like the add-to-cart toast). Flow 2 is a clean zoom-in on the PDP conversion.

### Findings
- **medium** Flow 1 steps 9–10 ("Confirm" at Cart→Checkout, "Complete" at Order confirmation) traverse Cart, Checkout, and Order Confirmation surfaces, but those surfaces have **no Key Flow of their own, no state coverage, and Checkout is explicitly listed as Deferred** (EXPERIENCE.md Document Status). The flow therefore promises an experience the rest of the spine doesn't specify (Flow 1 table, lines 329–330). *Fix:* either trim Flow 1 to end at the add-to-cart success beat (matching the declared MVP loop), or add minimal Cart/Confirmation flow + state coverage so the journey isn't writing checks the spec can't cash.
- **low** The "failure path" for Flow 1/2 is expressed as a bulleted "to avoid" list rather than an in-line failure branch like the example spine's "Failure: data save fails → …". The add-to-cart failure is covered in State Patterns, but the flows themselves don't fork. *Fix:* add a one-line failure fork to each flow's climax step (e.g., "Add-to-cart fails → toast 'Failed to add…', item not added, retry") for parity with the example shape.
- **low** Order History / My Orders (IA surface 7) and Category Browse (surface 3) have no journey touching them. Acceptable for an MVP-scoped doc, but they're speced as IA without any behavioral demand — see §4. *Fix:* note them as navigational-only or defer explicitly.

## 2. Token completeness — strong

Extracted every frontmatter token (colors, typography roles, rounded scale, spacing scale) and every inline hex/`{token}`-style reference in both files. All color tokens carry a hex value. Every color referenced in prose (DESIGN.md Components, EXPERIENCE.md interactions) resolves to a defined frontmatter color. No `{path.to.token}` reference syntax is actually used in either file — references are by name + literal hex instead — so there are no dangling `{...}` paths to break.

### Findings
- **medium** Contrast targets are **asserted but not verified for the load-bearing warm-gray combination**, which is exactly the flagged risk. Warm Gray `#787770` on Soft Ivory `#faf7f2` is used for price and metadata (DESIGN.md Product Card "Price weight 400 #787770"; PDP "Price: Body MD, Warm Gray"). `#787770` on `#faf7f2` is ≈3.1:1 — below the 4.5:1 AA body floor. DESIGN.md Accessibility (line 141) already hedges ("verify Warm Gray… and darken to `#6a6a63` where it fails") but the spine ships the un-darkened token as the price color in the component specs. *Fix:* resolve the hedge — either bump the metadata color to the `#6a6a63` (or darker) that passes, or explicitly classify price/metadata as large-text (≥18.66px bold / 24px) and state the 3:1 target; don't leave "verify" as a runtime TODO in a source-of-truth doc.
- **low** `surface-secondary` `#e8dccb` (Warm Beige) is used as the product-card **image placeholder** and as input fill; Deep Muted Brown text on Warm Beige is fine, but Warm Gray on Warm Beige (if metadata ever sits on a beige card) is the same sub-AA risk. *Fix:* state which text roles are permitted on `surface-secondary`.
- **low** Several frontmatter tokens are defined but never referenced in prose: `surface-container` `#fdebdc`, `surface-variant` `#f1dfd1` (though `#fdebdc`/`#f1dfd1` appear as "Sand" in the Colors table and `#f1dfd1` is used for the disabled button in EXPERIENCE.md), `success`, `alert`, `error-container`. Not a defect — semantic reserves are legitimate — but worth a one-word "reserved" tag so a consumer doesn't hunt for usage.

## 3. Component coverage — adequate

Extracted every component named in either file and checked for a DESIGN.md.Components visual spec + an EXPERIENCE.md.Component Patterns behavioral spec. Strong overlap on the core set.

| Component | DESIGN.md visual | EXPERIENCE.md behavioral | Notes |
|---|---|---|---|
| Buttons (primary/secondary) | ✅ Buttons | ✅ Add to Cart Button Interaction | Primary well-covered; secondary has no behavioral spec |
| Product Card | ✅ Product Card | ✅ Product Card Interaction | Strong both sides |
| PDP | ✅ Product Detail Page | ✅ (via Flow 2 + Variant Selector) | Adequate |
| Input fields | ✅ Input fields | ◑ Forms (Interaction Primitives) | Behavioral is generic, not input-specific |
| Search bar | ✅ Search bar | ✅ Search Bar Interaction | Strong both sides |
| Chips / labels | ✅ Chips / labels | ◑ folded into Variant Selector | No standalone behavioral spec for filter/category chips |
| Variant Selector (size/color) | ◑ inside PDP "Size selector" | ✅ Variant Selector | Visual spec is a PDP sub-bullet, not its own entry; naming differs ("Size selector" vs "Variant Selector") |
| Filter dropdown | ✗ no visual spec | ✅ under Search Bar Interaction | Behavioral only; no DESIGN.md anatomy |
| Toast / notification | ✗ no visual spec | ◑ mentioned in Add-to-Cart success + State Patterns | No visual token/anatomy; position ("bottom-left") asserted only behaviorally |

### Findings
- **medium** **Toast/notification** is behaviorally load-bearing (it's the success-feedback climax of both flows and the add-to-cart/network error channel) but has **no DESIGN.md visual spec** — no surface color, radius, shadow, or position token. *Fix:* add a Toast entry to DESIGN.md.Components (surface `#fff8f4`, radius `lg` 16px, ambient shadow, dismiss timing) so the brand's "luxury doesn't shout" applies to it.
- **medium** **Filter dropdown** has behavioral rules (expand, checkboxes, apply/clear) but no visual anatomy in DESIGN.md. *Fix:* add a Filter/dropdown visual spec or fold it under an existing surface.
- **low** **Variant selector** naming is inconsistent — DESIGN.md calls it "Size selector" (a PDP sub-bullet), EXPERIENCE.md calls it "Variant Selector (Size/Color)" and gives it top-level status. *Fix:* unify the name and promote it to a named Components entry in DESIGN.md.
- **low** **Secondary button** has a visual spec but no behavioral rules; **chips** have visual + uppercase/tracking but their interactive (filter toggle) behavior lives only inside Variant Selector. Minor.

## 4. State coverage — adequate

Walked each shopper IA surface and checked for empty / cold-load (skeleton) / focus / error / offline states. State Patterns covers the high-value surfaces well: product-grid skeleton, search-results loading+timeout, no-results empty, empty cart, search error w/ retry, add-to-cart error, network/offline banner with auto-retry. Focus states are covered in Component Patterns + Accessibility.

### Findings
- **medium** **PDP has no state coverage.** No PDP loading/skeleton state (only "Fast page load < 2.5s" is asserted in Flow 1), no PDP error state (product fetch fails / 404 / discontinued product), and the out-of-stock state lives only on the *card* ("Out of Stock" over image) — the PDP-level out-of-stock experience (disabled CTA + "Similar options below" microcopy exists in Voice & Tone but isn't wired to a PDP state). *Fix:* add PDP cold-load skeleton, product-not-found error, and PDP out-of-stock state.
- **medium** **Cart and Order Confirmation have no states** despite being IA surfaces reached by Flow 1 (empty cart is covered, but cart loading, cart item-removed, and order-confirmation success/failure are not). *Fix:* either defer these surfaces explicitly out of MVP (and trim Flow 1, per §1) or add their states.
- **low** **Order History** (IA surface 7) has no empty/loading/error states. Consistent with it being unscoped; flag as deferred.
- **low** Offline state is global-banner only; no per-surface offline degradation noted (e.g., add-to-cart while offline). The microcopy "Offline mode limited" implies behavior that isn't specified. *Fix:* one line on what "limited" means.

## 5. Visual reference coverage — thin

Listed every file in `.working/`: exactly one — `design-direction.html`. No `mockups/`, `wireframes/`, or `imports/` folders exist (confirmed). Neither spine links to `design-direction.html` from any section.

### Findings
- **high** `.working/design-direction.html` is **orphaned and off-brand — pre-pivot residue that contradicts the source of truth.** It still shows Indigo `#4f46e5`/`#4338ca` CTAs, near-black `#1a1a1a` and warm-brown `#8b7355` text, system-font stack (no Nunito Sans), "Warm Boutique Commerce" subtitle, 6–12px radii (not 16px/pill), and "Wireless Headphones / Electronics" content — precisely the styling and copy D4 says was purged. It is not referenced by either spine. *Fix:* delete or regenerate this artifact to the Oren system; in its current state it is a trap for any reader who opens `.working/` expecting a "visual reference."
- **medium** **No key-screen mockups exist**, though both Document Status footers and the decision log (D4 "Next") promise them (Home, Search Results, PDP) and the Stitch source has 3 screens. The spine references "Stitch 3 screens" (DESIGN.md References) but provides no inline image/HTML link a consumer can open. *Fix:* reconcile the 3 Stitch screens into `mockups/` and link them inline at the IA / Components / Flow sections.
- **low** DESIGN.md References cites the Stitch project ID (`projects/2621556029010588670`) but there's no rendered/exported artifact in the run folder — the reference is unresolvable without Stitch access. *Fix:* export the canonical screens locally.

## 6. Bloat & overspecification — adequate

DESIGN.md legitimately carries editorial voice (Brand & Style, color philosophy) — appropriate per spec. EXPERIENCE.md is mostly behavioral. A few overspecifications and one source-restatement.

### Findings
- **low** EXPERIENCE.md restates visual tokens already owned by DESIGN.md in several places (Add-to-Cart "Deep Muted Brown `#4a3f35` pill, Ivory text"; Variant "Muted Blush `#e7c6c1` fill / Soft Clay `#c9b2a6` border"; disabled "Sand `#f1dfd1`"). The hex literals are restatement — the behavioral delta is what belongs here. The example spine references tokens by name/role and lets DESIGN.md own the hex. *Fix:* drop the hex codes from EXPERIENCE.md, keep the role names.
- **low** EXPERIENCE.md "Design System Reference" (lines 35–41) re-summarizes the entire DESIGN.md palette/type/spacing. Useful as a pointer but borders on duplicating the source; a one-line "inherits DESIGN.md tokens; deltas below" (as the shadcn example does) would be leaner and not drift out of sync.
- **low** DESIGN.md "Dark Mode & Responsive" + "Document Status" + "References" tail is a bit long for a source-of-truth doc, but each earns marginal value. No action required.
- **low** EXPERIENCE.md Foundation includes a full **Admin Experience** form-factor block (lines 27–31) and an Admin IA section (97–103) for a scope explicitly deferred to v1.1. Two placeholder sections a consumer of the MVP spec won't read. *Fix:* compress to a single "Admin deferred to v1.1" line.

## 7. Inheritance discipline — adequate

`source_of_truth` frontmatter in DESIGN.md resolves to the Stitch project (external, but consistent across doc and log). EXPERIENCE.md token references resolve to DESIGN.md tokens by name. Glossary (color names, type roles) is consistent across both files. The purge is verified — no indigo/Inter in either spine.

### Findings
- **medium** **EXPERIENCE.md has no `sources:` frontmatter.** The example experience spine declares `sources: [.../prd.md]`; this one has no `sources` and no pointer back to DESIGN.md in frontmatter (only prose). Inheritance is implied, not machine-declared. *Fix:* add `sources:` (DESIGN.md and the PRD, if one exists) to EXPERIENCE.md frontmatter.
- **medium** **DESIGN.md has no `components:` frontmatter block**, though it has a rich prose Components section and the spec + example both use a `components:` map with `{path.to.token}` references. The component specs are therefore prose-only and not machine-resolvable. *Fix:* optional but recommended — add a `components:` frontmatter map (button-primary, product-card, input, search-bar, chip, toast) using `{colors.*}`/`{rounded.*}` references, so the resolver can flatten them.
- **medium** **Aspect-ratio / grid contradiction across the pair (and within EXPERIENCE.md).** DESIGN.md Product Card specifies image **aspect-ratio 4:5** (portrait) and the Layout section specifies **2-col staggered masonry** mobile. EXPERIENCE.md Responsive (line 393) says product images are **square 1:1** "for fast scanning" and the grid is plain **2 columns, 16px gap** (not masonry). DESIGN.md is source of truth, so EXPERIENCE.md is wrong on both counts. *Fix:* correct EXPERIENCE.md to 4:5 portrait + staggered masonry, or log a deliberate deviation.
- **low** Grid column counts agree (2/3/4 across mobile/tablet/desktop) between Foundation and both DESIGN.md and Responsive — good. PDP split (image 60% / info 40%) is consistent across both files — good.
- **low** Naming: "Size selector" (DESIGN.md) vs "Variant Selector" (EXPERIENCE.md) — already flagged in §3; it's an inheritance-discipline miss too (component names should be identical across sections/files).

## 8. Shape fit — strong

**DESIGN.md** sections are in canonical order: Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts. Order-locked sequence is intact. Trailing Dark Mode & Responsive / References / Document Status are additive and don't violate order.

**EXPERIENCE.md** has all required defaults: Foundation, Information Architecture, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows. Required-when-applicable: **Responsive** is present and triggered (multi-surface/breakpoints) ✅.

### Findings
- **medium** **Inspiration section is missing from EXPERIENCE.md though it is triggered.** The decision log shows explicit reference products and rejects: lifted from "editorial lookbooks, Pinterest, COS / The Row" (DESIGN.md References) and rejected directions (D1→D4: light 300/400 weights rejected, 4px corners rejected, indigo/Inter purged, algorithmic search-first rejected in favor of editorial discovery). The shadcn example carries a full "Inspiration & Anti-patterns" section for exactly this trigger; Oren's belongs in EXPERIENCE.md and is absent. *Fix:* add an Inspiration & Anti-patterns section capturing the lifted-from references and the rejected pivots.
- **low** No invented sections that fail to earn their place; the structure is clean.

## Mechanical notes

- **Name inconsistencies:** "Size selector" (DESIGN.md Components, PDP sub-bullet) vs "Variant Selector (Size/Color)" (EXPERIENCE.md) — unify. Everything else (color names, type roles, button tiers) is consistent across files.
- **Cross-refs:** Both spines reference `.decision-log.md` D4 correctly. DESIGN.md References cites Stitch `projects/2621556029010588670` (external, unresolvable in-repo). No broken in-repo links — but also **no inline link to the one `.working/` artifact**, which is itself stale/off-brand (§5).
- **Frontmatter completeness:** DESIGN.md frontmatter is rich (colors/typography/rounded/spacing all present, all hex set) but **omits the spec's `components:` and `description:` keys** (`title` is used instead of `description`). EXPERIENCE.md frontmatter **omits `sources:`** (present in the example) — inheritance is prose-only.
- **Purge verification:** Confirmed zero `indigo` / `#4f46e5` / `#4338ca` / `Inter` in either spine. The only surviving instances of that styling are in the orphaned `.working/design-direction.html` (§5, high).
- **Token reference style:** Neither spine uses the `{path.to.token}` syntax from the spec; references are name+hex. Not a defect, but it means no machine resolution and invites the hex-restatement drift flagged in §6/§7.
- **Contrast TODO left live:** DESIGN.md line 141 leaves "verify Warm Gray… darken where it fails" as an unresolved instruction inside a source-of-truth doc (§2, medium).
