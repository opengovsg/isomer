# Foundation sub-flow: make OUI and Chakra coexist (one-time, bottom of the stack)

This runs **once** as the first PR in the Graphite stack. After it, OUI is available
additively while the entire studio UI is still rendered by Chakra — so the very first
visual diff after this PR must show **zero** changes. That proves the harness is sound
and gives us the frozen baseline.

## Why coexistence is non-trivial here

Four problems, each with a verified solution:

- **Tailwind version clash.** OUI needs Tailwind **v4**; studio uses **v3** for
  `build:preview-tw` (`src/styles/tailwind.css` → `public/assets/css/preview-tw.css`, the
  site-preview iframe). They can't share a `tailwindcss` package or a PostCSS pipeline.
  → Add v4 as a **pnpm alias** `tailwindcss-v4` (`npm:tailwindcss@4`) and compile OUI's
  stylesheet with `@tailwindcss/cli` (the v4 `tailwindcss` *bin* would collide with v3's, so
  invoke the cli by path). Studio's direct `tailwindcss` stays v3.
- **PostCSS conflict.** Importing the OUI CSS in `_app`/`preview` routes it through Next's
  v3 PostCSS, where the `tailwindcss` plugin resolves to v4 and errors
  ("trying to use tailwindcss directly as a PostCSS plugin").
  → Compile to a **static** `public/assets/css/oui.css` and load it with a `<link>` (in
  `_document.tsx` + `.storybook/preview-head.html`), bypassing PostCSS entirely.
- **Two-way reset conflict.**
  - Tailwind **preflight** resets base elements and shifts Chakra's typography → **omit
    preflight** (import only the `theme` + `utilities` layers, not the full `@import "tailwindcss"`).
  - Chakra/Emotion inject **unlayered** resets (e.g. `button { background: transparent }`)
    that beat layered utilities, leaving OUI components unstyled → emit OUI's utilities
    **unlayered** so their class specificity outranks Chakra's element resets. (They still
    don't touch Chakra components, whose class names never match.)
- **Router integration.** OUI's `Link` needs `RouterProvider` (`react-aria-components`) wired
  to Next's router.

## Steps

1. **Install deps** (scoped to studio), incl. the v4 alias and toolchain:
   ```sh
   pnpm --filter isomer-studio add @opengovsg/oui @opengovsg/oui-theme react-aria-components motion
   pnpm --filter isomer-studio add -D @tailwindcss/cli tailwindcss-react-aria-components tw-animate-css
   pnpm --filter isomer-studio add -D tailwindcss-v4@npm:tailwindcss@4   # alias; studio's `tailwindcss` stays v3
   ```

2. **Generate the Isomer theme** (non-interactive; the docs' interactive form is stale):
   ```sh
   pnpm --filter isomer-studio exec npx @opengovsg/oui-token-gen generate -t Isomer -o src/styles
   ```
   Produces and commits `src/styles/generated-Isomer.css` (token-collision warnings are non-fatal).

3. **Create `apps/studio/src/styles/oui.css`** (mirrors `@opengovsg/oui-theme/tailwind.css` but
   skips preflight and emits utilities unlayered):
   ```css
   @layer theme, base, components;
   @import "tailwindcss-v4/theme.css" layer(theme);
   @import "tailwindcss-v4/utilities.css";              /* UNLAYERED — beats Chakra's resets */
   @import "tw-animate-css";
   @plugin "tailwindcss-react-aria-components";
   @import "@opengovsg/oui-theme/base.css";
   @import "./generated-Isomer.css";
   /* + the @custom-variant / @utility / @theme blocks from oui-theme/tailwind.css */
   @theme {
     /* REQUIRED, and NOT in oui-theme/tailwind.css — it's an app-level step from OUI's
      * installation guide: https://oui.open.gov.sg/llm/getting-started/installation.md
      * OUI styles all text via var(--font-sans); if it's left at Tailwind's default system
      * stack, OUI renders in a different font than Chakra (which uses Inter) — a visible
      * drift on every migrated component. Set it to the app's Inter stack. Studio loads
      * Inter via `inter-ui/inter.css` (family "Inter") and Chakra's OGP theme uses
      * `Inter, system-ui, sans-serif`, so match that: */
     --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
   }
   @source "../../node_modules/@opengovsg/oui-theme/dist";   /* where buttonStyles etc. live */
   @source "../";   /* studio src — a DIRECTORY source; a `..`+glob scans unreliably */
   ```
   (The OUI install guide's exact line is `--font-sans: var(--font-inter), …` for the
   Next.js `next/font` setup; studio uses `inter-ui` instead, so the family is `"Inter"`.)
   Add a `build:oui-css` script that compiles it with the v4 cli (by path, to dodge the bin
   collision) → `public/assets/css/oui.css` (gitignored). It must run **before every build**
   or the deployed app / Storybook / Chromatic will be missing all OUI styles. Wire it like the
   repo already wires `generate`:
   - **turbo** (`turbo.json`): add a `build:oui-css` task (`outputs: ["public/assets/css/oui.css"]`)
     and make `build`, `build-storybook`, and `storybook` `dependsOn` it. Covers everything
     invoked through turbo (deploy `turbo build`, CI, `pnpm storybook`).
   - **Chromatic** (`.github/workflows/chromatic.yml`): the Chromatic action runs the Storybook
     build script **directly, not via turbo**, so add an explicit `Build OUI CSS` step (next to
     the `build:preview-tw` step) — the turbo dependency does not apply there.
   - **visual-diff** runs `build:oui-css` explicitly in its own `BUILD_STEPS` (it invokes the
     package script directly, bypassing turbo).

4. **Load the stylesheet via `<link>`, NOT `import`** — a static link bypasses PostCSS:
   - `apps/studio/src/pages/_document.tsx`: `<link rel="stylesheet" href="/assets/css/oui.css" />`
   - `apps/studio/.storybook/preview-head.html`: same `<link>` (storybook serves `public/`).

5. **Wire `RouterProvider`** (`react-aria-components`) inside `ThemeProvider` in `_app.tsx`
   (`navigate={(href) => void router.push(href)}`) and as a Storybook decorator. Both providers
   stay mounted for the whole migration.

6. **Capture the baseline** from this all-Chakra state (local + gitignored; it's a moving
   reference, re-captured at checkpoints — see the README's "Re-baselining"):
   ```sh
   cd tooling/visual-diff && npm install && npx playwright install chromium && cd -
   node tooling/visual-diff/run.mjs --capture-baseline
   ```

7. **Prove the harness** — a no-op diff must be clean:
   ```sh
   pnpm --filter isomer-studio typecheck
   node tooling/visual-diff/run.mjs        # expect: 0 over threshold, exit 0
   ```

8. **Submit** as the first stack PR:
   ```sh
   gt create -m "studio: add OUI alongside Chakra (migration foundation)"
   gt submit --no-interactive
   ```

## Notes for later units

- Migrated OUI components automatically pick up the OUI stylesheet; Chakra components keep
  using Emotion. No per-component provider juggling is needed.
- `ThemeProvider`, the Chakra theme, and `@chakra-ui/react`/`@opengovsg/design-system-react`
  are removed only in the **final cleanup** PR, once no usages remain.
