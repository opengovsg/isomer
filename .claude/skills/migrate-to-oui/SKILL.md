---
name: migrate-to-oui
description: >-
  Migrate apps/studio off Chakra (the @opengovsg/design-system-react components AND
  raw @chakra-ui/react primitives) to @opengovsg/oui + Tailwind, one component-type
  per Graphite-stacked PR, gated by the local visual-diff tool. Use when asked to
  "migrate <component> to OUI", "continue the OUI migration", "replace a Chakra
  primitive with Tailwind", or to set up the migration foundation.
---

# migrate-to-oui

Drive the progressive migration of `apps/studio` from Chakra UI v2 to OUI + Tailwind.

**One invocation migrates exactly ONE unit and submits ONE Graphite PR.** A "unit" is a
single component type (e.g. all `Button`) or a single layout/typography primitive
(e.g. all `Flex`). Keeping it to one unit keeps the stack small and each Chromatic-free
visual diff easy to read. Stop after submitting; the next invocation continues the stack.

Read `reference/component-map.md` for the old→new mapping and `reference/coexistence-setup.md`
for the one-time Foundation setup. Authoritative OUI docs: https://oui.open.gov.sg/llms.txt
(and the per-component `https://oui.open.gov.sg/llm/...md` pages). **Read the install guide
before Foundation — https://oui.open.gov.sg/llm/getting-started/installation.md — it has
app-level steps (e.g. setting `--font-sans` to Inter) that aren't in `oui-theme`'s own
stylesheet and are easy to miss; skipping the font step makes OUI render in a different font
than Chakra.**

## Two tracks

- **Track A** — `@opengovsg/design-system-react` components → `@opengovsg/oui`.
- **Track B** — raw `@chakra-ui/react`:
  - **B1** layout/typography (`Box`, `Flex`, `VStack`, `HStack`, `Stack`, `Grid`, `Text`,
    `Heading`, `Divider`, the `chakra` factory, …) → **plain Tailwind** (`<div className>` etc.).
  - **B2** Chakra components with an OUI equivalent (`Modal*`, `Tooltip`, `Menu*`, `Input`,
    `Table*`, …) → OUI. **Fold B2 into the matching component-type unit** — e.g. one "Modal"
    PR migrates Modal usage from *both* import sources.
  - **B3** hooks/factories (`useDisclosure`, `Icon`, `Portal`, `useToken`, `useTheme`,
    `useMultiStyleConfig`, …) → react-aria / plain React / Tailwind shims. Riskiest; do these
    near the end, case-by-case. **Never guess** an equivalent — flag it instead.

## Preconditions: is the Foundation done?

Before any unit, confirm the Foundation PR exists at the bottom of the stack:

```sh
grep -q '@opengovsg/oui' apps/studio/package.json && echo "oui installed" || echo "MISSING"
ls tooling/visual-diff/baselines >/dev/null 2>&1 && echo "baselines present" || echo "MISSING"
```

If anything is missing, run the **Foundation sub-flow** in `reference/coexistence-setup.md`
as its own PR first, then stop and report. Do not migrate a unit onto a missing foundation.

## The loop (one unit per invocation)

1. **Pick the unit.** Default order (cheap+pervasive first to de-risk layout, then components):
   `Box` → `Flex`/`Stack`/`VStack`/`HStack` → `Grid`/`GridItem` → `Text`/`Heading`/`Divider`
   → `Button` (+IconButton) → `useToast` → `Modal*` → `Menu*` → `Tooltip`/`Popover*`
   → `Input`/`Textarea`/form `Field`s → `SingleSelect` → `Tabs`/`Accordion`/`Table*`
   → `Badge`/`Link`/`Breadcrumb`/`Pagination`/`Switch`/`Radio`/`Searchbar`/`Spinner`/`GovtBanner`
   → **B3 hooks/factories** → **final cleanup**. Honour an explicit unit the user names.

2. **Inventory usages** of that unit across `apps/studio/src/` from *both* import sources.
   ⚠️ **Imports are frequently multi-line** (`import {\n  Button,\n  ...\n} from "..."`). A
   line-oriented `grep` (and macOS's **BSD grep**, whose `-P`/`-z` multiline flags are broken)
   will silently miss every multi-line import — undercounting the unit by 2–3×. **Never inventory
   with a single-line `grep`.** Use a multi-line-aware search. Canonical (portable, no tooling
   assumptions) — a Node scan that parses each import block via `matchAll`:
   ```sh
   node -e '
   const fs=require("fs"),path=require("path"),NAME=process.argv[1];
   const walk=(d,a=[])=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.name==="node_modules"||e.name===".next")continue;const p=path.join(d,e.name);e.isDirectory()?walk(p,a):/\.(tsx?|jsx?)$/.test(e.name)&&a.push(p)}return a};
   const block=/import\s*\{([^}]*)\}\s*from\s*"(@chakra-ui\/react|@opengovsg\/design-system-react)"/g;
   for(const f of walk("apps/studio/src")){const s=fs.readFileSync(f,"utf8");
     for(const m of s.matchAll(block))for(const x of m[1].split(","))if(x.trim().split(/\s+as\s+/)[0].trim()===NAME){console.log(f);break}}
   ' <Name> | sort -u
   ```
   (If `rg` is genuinely on PATH, `rg -lU` with a multi-line pattern works too — but verify it is
   ripgrep, not a shell alias, and never fall back to plain `grep`.)
   After listing files, **classify each**: a usage wrapped by a Chakra overlay trigger
   (`Menu.Button`/`MenuButton`/`PopoverTrigger`/`<Tooltip>`/`as={Button}`) is *trigger-coupled* —
   migrate it **with that overlay's unit**, not here (Chakra clones the trigger child and injects
   `onClick`/`ref`; a react-aria Button ignores those). A file can be **mixed** (a standalone
   Button *and* a trigger Button) — migrate only the standalone one now and alias the DS import
   (`import { Button as DsButton } from "..."`) for the trigger left behind.
   (Watch for `*` patterns: `Modal`, `ModalBody`, `ModalHeader`, … all belong to the Modal unit.)

3. **Map** old → new via `reference/component-map.md`. For anything not in the map or marked
   "verify", check the OUI docs/source first. If there is genuinely no OUI equivalent, build a
   **bridge component** (`reference/bridge-components.md`) over react-aria primitives + OUI's
   exported `*Styles` rather than blocking — e.g. `LinkButton` for `variant="link"`. Flag true
   upstream gaps in the playbook's register. Do not invent props.

4. **Branch on the stack:**
   ```sh
   gt create -m "<unit>: migrate to OUI/Tailwind"
   ```
   This branches off the current top of stack so the unit lands on top of prior units.

5. **Edit every usage.** Replace the import, props, children, and event handlers per the map.
   Leave unrelated components/primitives on Chakra (that is the whole point of progressive).
   For B1, prefer semantic tags + Tailwind utilities over `<div>` soup (`<p>` for Text, `<ul>`
   for lists, `<hr>` for Divider). Keep `className` ordering consistent — formatting runs Oxfmt
   with Tailwind class sorting on save/`pnpm format:fix`.
   - **Compose `className` with `cn` from `@opengovsg/oui-theme`, never string templating.**
     `cn` is a re-exported clsx+tailwind-merge (`(...ClassValue[]) => string`) — it dedupes
     conflicting Tailwind classes and drops falsy values, which template strings don't. So
     write `cn("base classes", isActive && "active-classes", className)`, **not**
     ``className={`base ${isActive ? "active" : ""} ${className ?? ""}`}``. (If a prop's
     `className` type is OUI's render-function form but you only ever pass a string, narrow it
     to `string` so `cn` typechecks.)

6. **Quality gates** (all must pass). **Always `format:fix` and `lint:fix` before committing**
   — agents (and stray edits) leave inconsistent quoting/semicolons/class-ordering that the
   committed code must not carry:
   ```sh
   pnpm format:fix                          # Oxfmt (no semicolons; sorts Tailwind classes)
   pnpm lint:fix                             # Oxlint autofix
   pnpm --filter isomer-studio typecheck
   pnpm lint                                 # confirm no NEW errors vs the baseline count
   pnpm --filter isomer-studio test:unit     # or scope to affected files
   ```
   After `format:fix`/`lint:fix`, re-check `git status` and **review the diff** — these tools
   run repo-wide and may surface (or an over-reaching agent may have made) edits to files
   outside your unit. Revert anything you didn't intend (`git checkout HEAD -- <file>`).

7. **Visual gate** (the regression check — replaces Chromatic for this loop):
   ```sh
   # pervasive primitives (Box/Flex/Text/Button): diff everything
   node tooling/visual-diff/run.mjs
   # narrower components: scope for a faster check
   node tooling/visual-diff/run.mjs --filter "*<unit>*"
   ```
   Read `.context/visual-diff/summary.md`. For each story **over threshold**, open its
   `diff.png` / `head.png`:
   - Unintended drift → fix the migration until within threshold.
   - Intended, approved change → document it in the PR body and the playbook's gaps register;
     re-run with a justified `--threshold` or note it explicitly. Do not silently accept.
   The tool exits non-zero on any over-threshold story — treat that as a hard block.

8. **Submit to the stack:**
   ```sh
   gt submit --no-interactive
   ```
   Use a clear PR title/body (subject ≤ 70 chars, no ticket number in the subject). Note the
   visual-diff result and any flagged gaps/shims in the body.

9. **Report** to the user: the unit migrated, files touched, the visual-diff outcome, and any
   gaps/shims flagged for follow-up. **Then stop** — one unit per invocation.

## Final cleanup (last unit, only after every other unit is done)

```sh
grep -rn "@chakra-ui/react\|@opengovsg/design-system-react" apps/studio/src   # must be empty
```

As its own top-of-stack PR: remove `@opengovsg/design-system-react` and `@chakra-ui/react`
(and Emotion, if unused) from `apps/studio/package.json`; drop `ThemeProvider`, the Chakra
theme in `apps/studio/src/theme/`, the `build:theme` script, and the Chakra Storybook
decorator; delete `tooling/visual-diff/baselines/` and optionally the visual-diff tool. Run
the full quality + visual gates one last time, then `gt submit`.

## Guardrails

- One unit, one PR, per invocation. Never batch unrelated units.
- Never delete or weaken the visual gate to make a PR pass.
- Both providers stay mounted until the final cleanup — do not remove `ThemeProvider` early.
- Keep the OUI Tailwind v4 stylesheet separate from the existing v3 `build:preview-tw`
  pipeline (see `reference/coexistence-setup.md`); never merge the two.
- Do not touch `packages/components` or the Chromatic CI workflow.
