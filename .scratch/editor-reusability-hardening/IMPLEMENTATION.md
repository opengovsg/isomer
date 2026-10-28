# Image-editor integration hardening — implementation spec

**Purpose:** Post-review hardening of the image-adjustment editor's *integration seams*, so a
new image-upload component is easier and safer to wire in. Output of a design grill; all
decisions below are settled. This is a handoff for an implementing agent working the
`image-manipulation` stacked-PR series.

Work in the worktrees: wave-0 = `/Users/damien/.herdr/worktrees/isomer/image-manipulation-wave-0`
(branch `image-manipulation`), wave-4 = `/Users/damien/.herdr/worktrees/isomer/image-manipulation-wave-4`
(branch `image-manipulation-wave-4`). Waves 1–3 have no dedicated worktree (check the branch out).

---

## Background: the integration (5 seams)

A component becomes image-editable through these seams; only #4 is per-component logic.

1. **Image field** — schema field via `ImageSrcSchema` sets `format: "image"`.
2. **Entry point** — `jsonFormsImageControlTester` matches any `format: "image"` field →
   renders `JsonFormsImageControl`. Automatic; no per-component registration.
3. **Stored edit** — sibling `imageAdjustment: Type.Optional(imageAdjustmentSchema)`.
4. **Config** — `resolveAdjustmentConfig({block, fieldName})` returns an `AdjustmentConfig`
   (or `undefined` → edit hidden, upload still works). Hand-maintained if-chain keyed on
   `block.type`/`variant`.
5. **Render** — crop/rotate/flip are **baked into the stored `src`** (no render work); only
   **focal** is render-time, applied as CSS `object-position` via `getFocalObjectPosition`
   into `ImageClient`.

Key files:
- Contract: `apps/studio/src/features/editing-experience/components/ImageAdjustmentModal/AdjustmentConfig.ts`
- Registry: `.../ImageAdjustmentModal/adjustmentConfigRegistry.ts` (+ `.test.ts`)
- Entry control: `apps/studio/src/features/editing-experience/components/form-builder/renderers/controls/JsonFormsImageControl.tsx`
- `ImageClient`: `packages/components/src/templates/next/components/internal/ImageClient/ImageClient.tsx`
  (+ props in `packages/components/src/interfaces/internal/Image.ts`)
- Focal helper: `packages/components/src/utils/getFocalObjectPosition.ts`

## The stack (PRs, all OPEN except wave-5 draft)

```
main ← wave-0 #3550 ← wave-1 #3552 ← wave-2 #3569 ← wave-3 #3618 ← wave-4 #3621 ← wave-5 #3667(draft)
```
Wave scopes: 0 = foundation (schema, contract, modal, bake, HeroGradient+Contentpic) ·
1 = HeroLargeImage/HeroBlock/Infopic · 2 = HeroFloating/Blockquote/InfoCards ·
3 = safeguards (low-res warning, rotate/flip, lockout tests) · 4 = native Image/ImageGallery,
modal redesign, auto-open, imageFit-in-modal · 5 = per-breakpoint-crop foundation.

---

## Settled decisions (why, so you don't re-litigate)

- **Optional integration is the design.** `resolveAdjustmentConfig → undefined` = not integrated;
  do NOT add an exhaustiveness check (it would fight in-flight/opt-out components).
- **Keep the flat config; do NOT introduce a strategy-shaped config.** Per-breakpoint is a
  *cross-cutting multiplier*, not a new axis-variant — it fits the flat shape as an additive
  opt-in object (mirroring wave-5's additive `tiers`). Strategy buys nothing here.
- **Keep `skipRealComponentPreview`.** Load-bearing for array-nested (InfoCards, ImageGallery)
  and CSS-background (FullInfopic) components that can't render a focused single-image preview.

---

## Work items

### W1 — Opt-out registry (Q1) · wave-3 · LIGHTWEIGHT

**Goal:** make the deliberate "not adjustable" set explicit; do NOT force exhaustiveness.

The wave-3 test `adjustmentConfigRegistry.test.ts` already asserts `logocloud`/`video`/`navbar`
→ `undefined`. Formalize only:
- Extract the excluded types to a named, commented constant (e.g. `INTENTIONALLY_NOT_ADJUSTABLE`)
  the test iterates.
- Add a one-line comment at `resolveAdjustmentConfig`'s `return undefined`: "absence = not
  integrated (optional by design); deliberate opt-outs are asserted in the registry test."

**Acceptance:** suite still green; no behavior change; the opt-out set is named + documented.
**Do NOT:** assert "every image-bearing type must resolve a config."

### W2 — Scrim-className guardrail (Q3) · wave-4 · TEST-ONLY

**Goal:** stop a config `scrim.className` silently diverging from the real component (the
cause of the cards-overlay bug).

Add a node test (studio) that, for every `AdjustmentConfig` with a `scrim`, reads the real
component's source and asserts the className substring-appears in it:
- `hero:gradient` → `packages/components/.../complex/Hero/HeroGradient.tsx`
- `infocards:cardsWithFullImages` → `.../complex/InfoCards/components/InfoCardWithFullImage.tsx`

Use `fs.readFileSync` on the component path; `expect(source).toContain(config.scrim.className)`.

**Acceptance:** passes now (scrims were aligned to the real components). **If it fails for
`hero:gradient`, that's the guardrail doing its job** — align the hero scrim config to
HeroGradient's exact gradient className (same fix pattern as cards).

### W3 — `ImageClient` owns focal (Q4) · wave-0 (+1,+2) · CASCADES THE STACK

**Goal:** a new focal component gets focal by passing `imageAdjustment` to `ImageClient`,
instead of every consumer importing `getFocalObjectPosition`, computing, and passing
`objectPosition`. Removes the "configured-but-forgot-to-render" footgun.

**Change (wave-0):**
- `ImageClientProps` (`interfaces/internal/Image.ts`): add `imageAdjustment?: ImageAdjustment`.
- `ImageClient.tsx`: compute the applied object-position with explicit-wins precedence:
  ```ts
  const resolvedObjectPosition =
    objectPosition ?? getFocalObjectPosition(imageAdjustment?.focal)
  // apply resolvedObjectPosition (keep the existing "only when set" style guard)
  ```
  Keep `objectPosition` as a still-supported override (FullInfopic / edge cases pass it).
- Migrate wave-0's consumer **HeroGradient.tsx**: pass `imageAdjustment={imageAdjustment}`,
  drop the local `getFocalObjectPosition`/`objectPosition` wiring.

**Migrate the other 4 consumers in their own waves** (verify each routes through `ImageClient`
first; if it renders a raw `<img>`/CSS bg, treat like FullInfopic):
- wave-1: `HeroBlock.tsx`, `HeroLargeImage/…` (via `ImageContainer.tsx`), Infopic `BlockInfopic.tsx`
- wave-2: `InfoCards/components/InfoCardImage.tsx` (covers both infocards variants)

**Exception — do NOT migrate:** `Infopic/components/FullInfopic.tsx` renders focal via CSS
`background-image` + `backgroundPosition`, not `<img>`/`ImageClient`. It keeps its manual
`getFocalObjectPosition` call. Document it as the one exception.

**Acceptance:** typecheck green; focal renders identically to before for all 6 components
(visual parity); a hypothetical new focal component needs only to pass `imageAdjustment`.

**FALLBACK (if the full-stack cascade isn't worth paying now):** add the `ImageClient`
capability additively at **wave-4** instead, migrate **no** existing consumers, and let future
components opt in. Zero cascade, but the API is unused until the next component and the existing
5 keep their manual wiring. Choose this only on the maintainer's explicit call.

### W4 — Capability flags replace `startsWith` (Q5) · wave-4 · SELF-CONTAINED

**Goal:** stop driving behavior off `componentType` string-prefix matching; declare it.

- `AdjustmentConfig.ts`: add
  ```ts
  autoOpenOnUpload?: boolean   // pop the editor right after upload (hero banners)
  ownsImageFitField?: boolean  // has a sibling imageFit the modal's fit control writes
  ```
- `adjustmentConfigRegistry.ts`: set `autoOpenOnUpload: true` on the 4 hero configs
  (gradient/block/largeImage/floating); `ownsImageFitField: true` on the 2 infocards configs.
- `JsonFormsImageControl.tsx`: replace
  - `config?.componentType.startsWith("hero:")` → `config?.autoOpenOnUpload`
  - `config?.componentType.startsWith("infocards:")` → `config?.ownsImageFitField`

**Acceptance:** auto-open still fires only for heroes; the imageFit control still appears only
for infocards; `grep "componentType.startsWith"` in JsonFormsImageControl returns nothing.
Leave the `componentType` field in place (it's a label now; removing it is a separate call).

---

## Stack mechanics & recommended order

Do cheap/top-of-stack first, decide W3 last:
1. **W2, W4 (wave-4):** edit on `image-manipulation-wave-4`; rebase wave-5 on top.
2. **W1 (wave-3):** edit on wave-3; rebase wave-4, wave-5.
3. **W3 (wave-0 proper):** edit wave-0 → rebase wave-1 → edit wave-1 → rebase wave-2 → edit
   wave-2 → rebase wave-3/4/5. Full re-stack. **Or** take the wave-4-additive fallback and
   skip the cascade entirely.

Each lower-wave edit forces rebasing every wave above it; the stack is actively maintained, so
this is routine but not free. Push each branch after its edit; `staging` is FF'd from wave-4
separately when the maintainer asks.

## Verification (repo conventions)

Run from `apps/studio` (studio changes) and the repo root (components changes):
- Typecheck: `pnpm run typecheck` — **ignore the pre-existing `src/server/modules/audit`
  (`auditLogExport`) errors and the dirty `packages/db/src/generated/*` files; both predate
  this work and are out of scope.**
- Lint: `pnpm exec oxlint --type-aware <changed paths>`
- Format (CI gate — must pass): `pnpm exec oxfmt --check <changed paths>` (run without
  `--check` to fix; stage only source files, never the generated DB files).
- Tests: `pnpm exec dotenv -e .env.test -- vitest run <test paths>`. Browser (`*.browser.test.tsx`)
  tests need `pnpm exec playwright install chromium` once.

Commit-message trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

## Out of scope (explicitly deferred)

- Strategy-shaped `AdjustmentConfig` (stay flat; add a 1-line comment that it trends toward a
  strategy shape only if the optional-field count crosses ~8–10).
- Typed-exhaustive registry lookup (would break optional integration).
- Removing the `componentType` field.
- Deriving `previewStates` aspect ratios from the real component (self-correcting for
  real-component previews; low stakes).
- Per-breakpoint *config* as a nested object — keep wave-5's bare `tiers?: Breakpoint[]` until
  a per-breakpoint-specific config value is actually needed.
