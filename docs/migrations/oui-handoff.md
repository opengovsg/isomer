# OUI migration — agent handoff

Pick up the progressive Chakra → OUI migration of `apps/studio` from here. This is a
**status snapshot + operating instructions** for a fresh agent. The durable references are:

- **Skill:** `/migrate-to-oui` (`.claude/skills/migrate-to-oui/SKILL.md`) — the loop. **Run it.**
- **Playbook:** `docs/migrations/chakra-to-oui.md` — full mapping tables + gaps register.
- **Coexistence setup:** `.claude/skills/migrate-to-oui/reference/coexistence-setup.md`.
- **Authoritative OUI docs:** https://oui.open.gov.sg/llms.txt (+ per-component `llm/*.md`).

## TL;DR for the next agent

1. You are on the Graphite stack below. **One invocation = one unit = one `gt` PR.** Do not batch.
2. **Next unit: `Menu`** (largest remaining trigger group). After that, `Modal*`, `Tooltip`,
   then form fields, then the long tail, then B3 hooks, then final cleanup.
3. Always finish a unit with: `format:fix` → `lint:fix` → `typecheck` → `lint` → scoped
   `test:unit` → **visual gate** → review `git status` → `gt submit`.
4. The visual gate is a **hard gate**. Never weaken it to pass.

## Graphite stack (bottom → top)

```
main
└ karrui/dakar-v1
  └ karrui/oui-migration-workflow      # the skill + visual-diff tool + playbook
    └ karrui/oui-stories-deterministic # MSW/story fixes so diffs are stable
      └ karrui/oui-foundation          # OUI installed alongside Chakra; baseline frozen
        └ karrui/oui-button            # ← HEAD. Standalone Button + IconButton DONE
```

Branch onto the top with `gt create -m "<unit>: migrate to OUI/Tailwind"`. Check with `gt log short`.

## What's done

- **Foundation** (`oui-foundation`): OUI v4 Tailwind stylesheet coexists with studio's v3
  `build:preview-tw`. Compiled separately to `public/assets/css/oui.css`, loaded by `<link>`
  (never through PostCSS). Utilities emitted **unlayered** to beat Chakra's resets; preflight
  omitted. `RouterProvider` wired in `_app.tsx` + Storybook. Baseline PNGs frozen.
- **Button unit** (`oui-button`): **standalone Button/IconButton complete.** All standalone
  usages (DS + raw Chakra) migrated to OUI `Button` / the three bridges, across ~95 files.
  The multi-line inventory scan now returns **only overlay-trigger-coupled** usages (Menu /
  Popover / Tooltip), which migrate with their overlay unit (see the trigger table below).
  ⚠️ The first pass undercounted the unit ~3x because a line-oriented `grep` can't see
  multi-line imports — see the gotcha below; always inventory with the multi-line scan.

### Bridges (built; reuse, don't reinvent) — `apps/studio/src/components/oui-bridge/`

OUI's `Button` is **not polymorphic**, so these fill the gap with `react-aria-components` +
OUI `*Styles` from `@opengovsg/oui-theme`:

| Bridge | Replaces | Built on |
|---|---|---|
| `LinkButton` | DS `LinkButton` (a link styled as text/link) | react-aria `Button` + `linkStyles` |
| `ButtonLink` | `Button as={NextLink}` (a link styled as a button) | react-aria `Link` + `buttonStyles` |
| `IconButton` | DS/Chakra `IconButton` (`icon=` + `aria-label`) | OUI `Button isIconOnly` |

If a future unit needs another "link styled as button / button styled as link" combo, extend
these rather than inlining `*Styles`.

## What's left (the remaining scope)

`grep -rln 'from "@opengovsg/design-system-react"' apps/studio/src` → **140 files**
`grep -rln 'from "@chakra-ui/react"' apps/studio/src` → **278 files**

Most-used remaining DS imports (rough unit-size signal): `FormLabel` 13, `Menu` 10,
`IconButton` 10, `Infobox` 9, `ModalCloseButton` 7, `Link` 5, `Badge` 5, `Tabs` 4,
`SingleSelect` 4, `Radio` 3, `Breadcrumb` 3, `Switch` 2, `Spinner` 2, `Searchbar` 2,
`RestrictedGovtMasthead` 2 (→ OUI `GovtBanner`).

### Suggested next order

`Menu` → `Modal*` → `Tooltip`/`Popover*` → `Input`/`Textarea`/form `Field`s → `SingleSelect`
→ `Tabs`/`Accordion`/`Table*` → `Badge`/`Link`/`Breadcrumb`/`Switch`/`Radio`/`Searchbar`/
`Spinner`/`GovtBanner` → **B1 layout/typography** (`Box`/`Flex`/`Stack`/`Text`/… → Tailwind)
→ **B3 hooks** (`useDisclosure`/`Icon`/`Portal`/…) → **final cleanup**.

(B1 can also be done earlier/in parallel since it's mechanical; do it as its own unit(s),
optionally split by feature folder if a single PR is too big to review.)

## ⚠️ Overlay-coupled triggers — start the next units WITH these

These `Button`/`IconButton` usages are **still on Chakra on purpose**. They are *trigger
children* of a Chakra overlay (`Menu`/`Popover`/`Tooltip`) that injects `onClick`/`ref`/
`aria-expanded` via `cloneElement`. Migrating the trigger alone breaks that wiring — so each
moves **with its overlay's unit**. In OUI they resolve naturally (e.g.
`<MenuTrigger><Button/><Menu/></MenuTrigger>`), turning the trigger into a plain OUI
`Button`/`isIconOnly` at that point.

| When you do this unit | Migrate these triggers too |
|---|---|
| **Menu** | `features/dashboard/components/CollectionTable/CollectionTableMenu.tsx`, `.../ResourceTable/ResourceTableMenu.tsx`, `.../form-builder/renderers/controls/DraggableLinkButton.tsx`, `.../JsonFormsSocialMediaControl/SocialMediaLink.tsx`, `.../JsonFormsNavbarControl/NavbarItemBox.tsx` (all `MenuButton as={IconButton}`); `components/PageEditor/MenuBar/MenubarItem/VerticalList.tsx`, `pages/sites/[siteId]/index.tsx`, `pages/sites/[siteId]/folders/[folderId]/index.tsx` (`as={Button}`) |
| **Popover** | `components/PageEditor/MenuBar/MenubarItem/DetailedList.tsx`, `HorizontalList.tsx` (PopoverTrigger → Button); `.../OverflowList.tsx` (PopoverTrigger → IconButton) |
| **Tooltip** | `features/users/components/AddNewUserButton.tsx` (also re-exports a Chakra `ButtonProps` API — update its public type), `components/SearchableHeader.tsx`, `components/PageEditor/MenuItem.tsx`, `components/CmsSidebar/CmsCollapsibleSidenav.tsx`, `components/CmsSidebar/CmsSidebarItems.tsx` |

## Validated Button prop mappings (reuse for any component)

- `onClick` → `onPress`; `isLoading` → `isPending`; `leftIcon`/`rightIcon` →
  `startContent`/`endContent`; `isRound` → `radius="full"`.
- `colorScheme` → `color`: `neutral→neutral`, `critical→critical`, `sub→sub`.
  **OUI `Button` has a native `neutral` color — do NOT remap `neutral`→`sub`.**
- `variant` unchanged; OUI also has `variant="unstyled"` (use with a `className` for fully
  custom styling).
- Chakra style props (`w`/`mt`/`px`/`justifyContent`/`_hover`/`_selected`/…) → `className`
  Tailwind utilities. Selected/active states → `data-[selected]:`/`aria-selected:` variants;
  set the attribute with `dataAttr(...)` from `@chakra-ui/utils` where Chakra used `_selected`.

## The visual gate (your regression check — replaces Chromatic)

```sh
node tooling/visual-diff/run.mjs                      # build + diff ALL studio stories
node tooling/visual-diff/run.mjs --filter "<glob>"    # scope by story id/title (faster)
node tooling/visual-diff/run.mjs --skip-build --filter "<glob>"  # reuse last build
```

- Reads your **local** baseline in `tooling/visual-diff/baselines/` (gitignored — capture it
  first with `--capture-baseline`); writes `.context/visual-diff/summary.md` + per-story
  `head.png`/`base.png`/`diff.png`.
- Exits **non-zero** if any scoped story exceeds `--threshold` (default `0.001`). Treat that
  as a hard block: open the `diff.png`, fix the migration. Only accept an intentional change
  by documenting it in the PR body + the playbook gaps register.
- **No hangs.** Heavy editor stories (live preview iframe) used to stall the run; the settle
  phase is now bounded and a story that never stabilises gets a best-effort shot and is
  flagged **unstable** in the summary (excluded from the gate — fix those stories). Default
  concurrency is fine. The build step also recompiles `oui.css`, so a fresh build picks up new
  `className` utilities.
- **Baselines stay on the all-Chakra `main` — do NOT re-baseline mid-stack.** Nothing in the
  stack is merged/approved, so re-capturing would bake unapproved drift into the reference and
  hide regressions. The gate therefore reports the **cumulative** Chakra→OUI delta, not just your
  unit. Isolate your unit by running the gate twice (changes stashed vs applied) and diffing the
  over-threshold sets — the new/worsened stories are yours. A story may report "no baseline" if it
  was added after the main capture — not a failure.

## Gotchas (learned the hard way)

- **Inventory must be multi-line-aware.** Imports are routinely written multi-line
  (`import {\n  Button,\n  ...\n} from "..."`). A single-line `grep` misses them all, and macOS
  ships **BSD grep** whose `-P`/`-z` multiline flags are broken (they fail *silently*). This
  undercounts a unit by 2–3×. **Always inventory with the Node `matchAll` scan** in the skill's
  step 2 (or `rg -lU`, after verifying `rg` is real ripgrep and not a shell function). Don't
  trust a `grep | wc -l` count.
- **Tailwind `@source`**: studio src is scanned via `@source "../";` (a **directory**, in
  `apps/studio/src/styles/oui.css`). A `..`+glob form scans unreliably and silently drops
  utilities. If a `className` utility "isn't generating", check this first — don't reach for
  `[var(--color-…)]` arbitrary values (the tokens DO resolve as named utilities).
- **Don't grep compiled CSS with `grep -F 'border-[1.5px]'`** — arbitrary-value selectors are
  backslash-escaped in the output → false negatives. Match the escaped form or grep source.
- **Merge classNames with `cn` from `@opengovsg/oui-theme`** (a re-exported tailwind-merge — it
  *is* available; don't hand-roll string concatenation, and don't add `tailwind-merge` directly).
- **OUI `Button` is a flex row with a built-in `gap` and hides its children while `isPending`.**
  When migrating a button: delete any inner `<Flex>`/`<HStack>` wrapper and let the Button lay
  out children (`gap-0` to tighten); migrate inner `<Text>`/`<Box>` to plain tags; render
  conditional children fully (no empty elements → phantom gap); custom-coloured buttons use
  `variant="clear"`/`unstyled` (not `outline`); **test the loading & icon+label states**, not
  just resting. A bridge that composes spinner/icon + label must set its own `flex … gap-…`.
  Full list in `reference/component-map.md` → "Button gotchas".
- Before every commit: `git restore apps/studio/prisma/generated/generatedTypes.ts
  apps/studio/prisma/generated/generatedEnums.ts` — the build's `prisma generate` dirties them.
- Both providers (`ThemeProvider` + `RouterProvider`) stay mounted until the **final cleanup** PR.

## Conventions

- **Always `pnpm format:fix` + `pnpm lint:fix` before committing**, then review `git status`
  (they run repo-wide; revert any file you didn't intend to touch). Oxfmt is no-semicolon and
  sorts Tailwind classes; sub-agents tend to leave semicolons/odd quoting.
- **Editor on-save formatting must be Oxc**, or human-saved files drift from `oxfmt`. Ensure
  `.vscode/settings.json` sets `"[typescriptreact]": { "editor.defaultFormatter": "oxc.oxc-vscode" }`
  (and the `js/ts.*` tsdk keys for current VS Code). `pnpm format:fix` is the source of truth
  regardless, but matching the editor avoids churn.
- Commit subject **≤ 70 chars, no ticket number** in the subject; detail in the body.
  End commit messages with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Comments: only essential "why" comments — no play-by-play narration.
- Never touch `packages/components` or the Chromatic CI workflow.
- If OUI has **no 1-1 mapping** for something, **flag it** (the user maintains OUI and will fix
  upstream) — or build a documented bridge from react-aria + OUI `*Styles`. Never invent props.

## How to spawn an agent for the next unit

Give it this prompt (swap the unit):

> Continue the Chakra → OUI migration of `apps/studio`. Read `docs/migrations/oui-handoff.md`,
> then run the `/migrate-to-oui` skill for the **Menu** unit (include the overlay-coupled
> trigger files listed for Menu in the handoff). One unit, one Graphite PR. Finish with the
> full quality + visual gate, then `gt submit`, then report and stop.
