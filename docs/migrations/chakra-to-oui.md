# Migrating `apps/studio` from Chakra UI to OUI + Tailwind

A progressive, visual-regression-gated, Graphite-stacked migration of the Studio CMS UI
off Chakra UI v2 and onto [OUI](https://oui.open.gov.sg) (`react-aria-components` + Tailwind).

This runbook is for humans. The same workflow is automated by the `/migrate-to-oui` Claude
Code skill (`.claude/skills/migrate-to-oui/`); the skill's `reference/component-map.md` and this
doc share the same mapping tables — keep them in sync.

## Why

`apps/studio` renders its UI with two Chakra dependencies:

- **`@opengovsg/design-system-react@1.34.0`** (OGP DS components) — ~163 files.
- **`@chakra-ui/react`** (raw Chakra primitives & hooks) — ~278 files.

We are moving to OUI for components and plain Tailwind for layout/typography. The migration
must be **progressive** (the app stays shippable at every step), **safe** (no visual
regressions), and **reviewable** (small, ordered PRs). `packages/components` is already
Tailwind-based and is out of scope.

## The two tracks

| Track | From | To |
|---|---|---|
| **A** | `@opengovsg/design-system-react` components | `@opengovsg/oui` components |
| **B1** | raw `@chakra-ui/react` layout/typography (`Box`, `Flex`, `Text`, …) | plain Tailwind elements |
| **B2** | raw `@chakra-ui/react` components (`Modal*`, `Tooltip`, …) | `@opengovsg/oui` components |
| **B3** | raw `@chakra-ui/react` hooks/factories (`useDisclosure`, `Icon`, …) | react-aria / React / Tailwind shims |

A migration **unit** = one component type (covering both import sources, so B2 folds into the
matching A unit) or one B1 primitive. **One unit = one Graphite PR.**

## Coexistence: how both run at once

Both design systems are mounted simultaneously for the whole migration. Migrated code uses OUI;
everything else stays Chakra until removed in the final cleanup.

Two things make this non-trivial — and both are handled in the **Foundation** PR:

- **Tailwind versions.** OUI needs Tailwind v4 (CSS-first). Studio uses Tailwind v3 for the
  `build:preview-tw` pipeline (`src/styles/tailwind.css` → `public/assets/css/preview-tw.css`,
  which styles the **site preview iframe** rendering `packages/components`). OUI gets its **own
  separate** v4 stylesheet (`src/styles/oui.css`); the two pipelines never merge.
- **CSS reset.** Tailwind `preflight` is **disabled** for the OUI stylesheet so it doesn't
  clobber Chakra/Emotion's base styles.

OUI's `Link` also needs `RouterProvider` from `react-aria-components`, mounted inside the
existing Chakra `ThemeProvider`.

## One-time Foundation (first PR in the stack)

Full detail in `.claude/skills/migrate-to-oui/reference/coexistence-setup.md`. Summary:

1. `pnpm --filter isomer-studio add @opengovsg/oui @opengovsg/oui-theme react-aria-components motion`
   (+ Tailwind v4 toolchain kept separate from `build:preview-tw`).
2. `pnpm --filter isomer-studio exec npx @opengovsg/oui-token-gen generate` → choose **Isomer**;
   commit the generated theme CSS.
3. Add `apps/studio/src/styles/oui.css` (`@import "@opengovsg/oui-theme/tailwind.css"` + `@source`
   + the generated Isomer theme + `@theme`), preflight off.
4. Wire `RouterProvider` inside `ThemeProvider` in `src/pages/_app.tsx`; mirror it in
   `.storybook/preview.tsx`; import the OUI stylesheet in both.
5. Capture the frozen baseline (next section) and prove a no-op diff is clean.
6. `gt create -m "studio: add OUI alongside Chakra (migration foundation)" && gt submit`.

## The visual-diff gate

We deliberately **do not** use Chromatic for the per-PR loop — its baseline drifts as `main`
moves. Instead, `tooling/visual-diff` freezes a PNG baseline of the pre-migration (all-Chakra)
Storybook; every PR must render pixel-identical to it.

```sh
# install (once) — npm-self-contained, excluded from the pnpm workspace
cd tooling/visual-diff && npm install && npx playwright install chromium && cd -

# capture the frozen baseline (once, on the Foundation branch, pre-migration)
node tooling/visual-diff/run.mjs --capture-baseline

# check a PR (default = all stories; exits non-zero if any story is over threshold)
node tooling/visual-diff/run.mjs
node tooling/visual-diff/run.mjs --filter "*modal*"   # faster, scoped check
```

Read `.context/visual-diff/summary.md` — stories **over threshold** are listed first with paths
to `head.png` and `diff.png`. The default threshold is a 0.1% changed-pixel ratio per story
(`--threshold`), which absorbs antialiasing noise. `baselines/` and `.context/` are gitignored.
See `tooling/visual-diff/README.md` for all flags.

## The loop (one unit per PR)

1. **Pick the unit** (suggested order below).
2. **Inventory** usages from both sources:
   ```sh
   grep -rn 'from "@opengovsg/design-system-react"' apps/studio/src | grep '<Name>'
   grep -rn 'from "@chakra-ui/react"' apps/studio/src | grep '<Name>'
   ```
3. **Branch:** `gt create -m "<unit>: migrate to OUI/Tailwind"`.
4. **Edit every usage** per the mapping tables. Leave unrelated components on Chakra.
5. **Quality gates:** `pnpm --filter isomer-studio typecheck` · `pnpm lint` ·
   `pnpm --filter isomer-studio test:unit`.
6. **Visual gate:** `node tooling/visual-diff/run.mjs` (use `--filter` to scope). Inspect any
   diffs; fix or document intentional changes (record them in the gaps register below).
7. **Submit:** `gt submit --no-interactive`. PR subject ≤ 70 chars, no ticket number in the
   subject; note the visual-diff result + any gaps in the body.
8. Move to the next unit (a new PR on top of the stack).

### Suggested stack order

`Box` → `Flex`/`Stack`/`VStack`/`HStack` → `Grid`/`GridItem` → `Text`/`Heading`/`Divider`
→ `Button` (+`IconButton`) → `useToast` → `Modal*` → `Menu*` → `Tooltip`/`Popover*`
→ `Input`/`Textarea`/form `Field`s → `SingleSelect` → `Tabs`/`Accordion`/`Table*`
→ `Badge`/`Link`/`Breadcrumb`/`Pagination`/`Switch`/`Radio`/`Searchbar`/`Spinner`/`GovtBanner`
→ B3 hooks/factories → final cleanup.

Pervasive primitives first de-risks layout before component swaps build on top. If one B1
primitive PR is too large to review, sub-split it by feature folder and say so in the PR.

## Final cleanup (last PR)

```sh
grep -rn "@chakra-ui/react\|@opengovsg/design-system-react" apps/studio/src   # must be empty
```

Then remove both packages (and Emotion, if unused) from `apps/studio/package.json`; drop
`ThemeProvider`, `apps/studio/src/theme/`, the `build:theme` script, and the Chakra Storybook
decorator; delete `tooling/visual-diff/baselines/` (and optionally the tool). Run all gates once
more and `gt submit`.

## Graphite cheatsheet

| Command | Purpose |
|---|---|
| `gt create -m "<msg>"` | New branch on top of the current stack (commits staged changes) |
| `gt modify` | Amend the current branch with new changes |
| `gt submit --no-interactive` | Create/update PRs for the whole stack |
| `gt restack` | Rebase the stack after edits lower down |
| `gt log` / `gt log short` | Show the stack |
| `gt up` / `gt down` | Move between branches in the stack |

## Mapping tables

These mirror `.claude/skills/migrate-to-oui/reference/component-map.md` — see it for the full
prop-translation cheatsheet. OUI uses react-aria conventions: `onClick`→`onPress`,
`disabled`→`isDisabled`, style props (`mt`/`px`/`bg`) → Tailwind `className`. Verify each
component's API at https://oui.open.gov.sg before editing.

### Track A / B2 — components → OUI (highlights)

| Chakra | OUI |
|---|---|
| `Button`, `IconButton` | `Button` |
| `useToast` | OUI Toast (provider + trigger fn — verify API) |
| `FormControl`/`FormLabel`/`FormErrorMessage` | `Field` primitives |
| `Input` / `Textarea` / `NumberInput*` | `TextField` / `TextAreaField` / `NumberField` |
| `SingleSelect` | `Select` (or `ComboBox` if filterable) |
| `Menu*` / `Modal*` / `Tooltip`/`Popover*` | `Menu` / `Modal` / `Tooltip` |
| `Tabs*` / `Accordion*` / `Table*` | `Tabs` / `Accordion` / `Table` |
| `Infobox`/`Banner`/`Badge`/`Link`/`Breadcrumb`/`Pagination`/`Switch`/`Radio`/`Searchbar` | same-named OUI |
| `Spinner` | OUI `Spinner` (exists; undocumented) |
| `RestrictedGovtMasthead` | OUI `GovtBanner` |

### Track B1 — raw primitives → Tailwind (highlights)

| Chakra | Replacement |
|---|---|
| `Box` | `<div className>` |
| `Flex` / `HStack` / `VStack` / `Stack` | `<div className="flex …">` (+ `gap-*`, `flex-col`) |
| `Grid` / `GridItem` / `SimpleGrid` | `<div className="grid …">` / grid-child utilities |
| `Spacer` / `Center` / `Wrap` / `Container` | `flex-1` / centering / `flex-wrap` / `mx-auto max-w-*` |
| `Divider` | `<hr className>` |
| `Text` / `Heading` | `<p>`/`<span>` / `<h*>` + text utilities |
| `List`/`ListItem`/`UnorderedList` | `<ul>`/`<ol>`/`<li>` |
| `chakra.X` factory | `<X className>` |
| `Skeleton` | OUI skeleton if present, else Tailwind `animate-pulse` |

### Track B3 — hooks/factories → shim/idiom (highlights)

| Chakra | Replacement |
|---|---|
| `useDisclosure` | react-aria `useOverlayTriggerState` or a small local `useDisclosure` shim |
| `Icon` | render the icon component directly + Tailwind sizing |
| `Portal` | react-aria overlay / `createPortal` |
| `useToken`/`useTheme`/`useBreakpointValue` | CSS vars / Tailwind tokens / media or container queries |
| `useMultiStyleConfig`/`createMultiStyleConfigHelpers` | migrate the whole styled component (OUI + `cva`/`tailwind-variants`) |
| `extendTheme`/`ThemeProvider`/Chakra type helpers | removed in final cleanup |

## Gaps & shims register

Record components with no clean OUI/Tailwind equivalent and the decision taken, plus any
intentional visual changes accepted past the diff gate. Update this as the migration proceeds.

| Item | Status / decision |
|---|---|
| `Card` (raw) | No OUI Card — rebuild with Tailwind composition |
| `LinkBox`/`LinkOverlay` | Recompose clickable-card pattern around OUI `Link` |
| `Table*` | Use OUI `Table`; fall back to semantic `<table>` + Tailwind if it doesn't fit (note here) |
| `useDisclosure` | Decide: react-aria state vs local shim (record which, once chosen) |
| _intentional visual changes_ | _list story id + reason as they are accepted_ |
