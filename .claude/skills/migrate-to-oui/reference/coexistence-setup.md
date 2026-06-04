# Foundation sub-flow: make OUI and Chakra coexist (one-time, bottom of the stack)

This runs **once** as the first PR in the Graphite stack. After it, OUI is available
additively while the entire studio UI is still rendered by Chakra — so the very first
visual diff after this PR must show **zero** changes. That proves the harness is sound
and gives us the frozen baseline.

## Why coexistence is non-trivial here

- **Tailwind version clash.** OUI uses Tailwind **v4** (CSS-first: `@import`, `@theme`,
  `@tailwindcss/postcss`). `apps/studio` uses Tailwind **v3** via `tailwind.config.js` and
  the `build:preview-tw` script that compiles `src/styles/tailwind.css` →
  `public/assets/css/preview-tw.css` for the **site preview iframe** (which renders
  `packages/components`). These two pipelines must stay independent.
  → Give OUI its **own** stylesheet (`src/styles/oui.css`) compiled by Tailwind v4, imported
  into the studio app/Storybook. Do **not** route OUI through `build:preview-tw`.
- **CSS reset conflict.** Tailwind's `preflight` resets base elements and would fight
  Chakra/Emotion's global styles. → **Disable preflight** on the OUI stylesheet.
- **Router integration.** OUI's `Link` needs `RouterProvider` (`react-aria-components`) wired
  to Next's router for client-side navigation.

## Steps

1. **Install deps** (scoped to studio):
   ```sh
   pnpm --filter isomer-studio add @opengovsg/oui @opengovsg/oui-theme react-aria-components motion
   ```
   Add the Tailwind v4 toolchain (`tailwindcss@4`, `@tailwindcss/postcss`) **without** breaking
   the existing v3 `build:preview-tw` step — keep a separate config/entry for OUI.

2. **Generate the Isomer theme** (built-in product preset):
   ```sh
   pnpm --filter isomer-studio exec npx @opengovsg/oui-token-gen generate   # choose "Isomer"
   ```
   Commit the generated theme CSS (e.g. `src/styles/oui-theme-isomer.css`).

3. **Create the OUI stylesheet** `apps/studio/src/styles/oui.css`:
   ```css
   @import "@opengovsg/oui-theme/tailwind.css";
   @source "../../node_modules/@opengovsg/oui-theme";
   @import "./oui-theme-isomer.css";

   @theme {
     --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
   }
   ```
   Ensure preflight is **off** for this build (avoid resetting Chakra's base styles). Verify the
   exact directive against the current OUI docs — https://oui.open.gov.sg/llm/getting-started/next.md
   and .../theming.md — as the recommended setup may evolve.

4. **Wire providers** in `apps/studio/src/pages/_app.tsx`: import the OUI stylesheet, and mount
   `RouterProvider` (from `react-aria-components`) **inside** the existing
   `ThemeProvider` (from `@opengovsg/design-system-react`). Both providers stay mounted for the
   whole migration. Wire `RouterProvider`'s `navigate` to Next's router (`useRouter().push`).

5. **Mirror it in Storybook** `apps/studio/.storybook/preview.tsx`: import the OUI stylesheet and
   add `RouterProvider` to the decorator chain alongside the existing Chakra `ThemeProvider`
   decorator. Stories must render under the same provider stack as the app.

6. **Capture the frozen baseline** from this all-Chakra state:
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
