# Deferred Work

## Deferred from: code review of 1-1-oren-design-system-foundation (2026-06-23)

- **Header/Footer color mismatch** — Header uses `bg-white`, Footer uses `bg-slate-50 border-slate-200`, which clash visually with the new warm-ivory system. Out of scope for Story 1.1 per story notes; revisit when design system rollout covers layout components.
- **Semantic color token contrast** — `--color-success`, `--color-alert`, and `--color-error` are all desaturated warm neutrals with no perceptible hue difference. Risks WCAG 1.4.1 failure for color-only feedback. Color palette is owned by UX design artifacts; flag to UX for next design iteration.
- **`body` background-color transition initial flash** — `transition-property: background-color` on `html, body` may cause a brief animated flash from browser default white to `#faf7f2` on first paint. Cosmetic issue; address if visible in user testing.
- **jest.config.ts missing CSS module transform** — No `moduleNameMapper` entry for `.css` files. Currently latent (component specs don't import CSS). Will throw `SyntaxError` if any integration test renders `layout.tsx` or imports a CSS file directly. Add a `moduleNameMapper` entry for `.css` → `identity-obj-proxy` before writing integration tests.
