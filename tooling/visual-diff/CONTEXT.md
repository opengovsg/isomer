# CONTEXT — visual-diff (for agents)

Orientation for an agent or engineer working **on** this tool or **using** it during the
`apps/studio` Chakra → OUI migration. Pair with `README.md` (user-facing flags) and the
`/migrate-to-oui` skill (which calls this tool as its visual gate).

## What this is and why it exists

A local, Chromatic-free visual-regression gate. The migration swaps component
implementations (Chakra → OUI/Tailwind) that are supposed to look **identical**. This tool
freezes a PNG snapshot of every studio Storybook story from the pre-migration (all-Chakra)
UI, then on each migration PR re-screenshots and pixel-diffs against that frozen baseline.
A per-story changed-pixel ratio over `--threshold` fails the run (non-zero exit), so an
agent / pre-push hook / CI can block the PR.

We deliberately do **not** use Chromatic for this loop: its baseline drifts as `main`
moves, whereas here the baseline must stay pinned to the original "Chakra look" for the
whole migration.

## Mental model

```
baselines/<viewport>/<storyId>.png   = frozen "before" (captured once, pre-migration)
current Storybook build               = "after" (this PR)
gate: for every story×viewport, changed-pixel ratio must be <= threshold
```

The baseline is captured **once** on the Foundation branch and reused by every PR in the
Graphite stack. It is gitignored — it lives only on the machine running the gate.

## Architecture (`run.mjs`, single file, no framework)

1. **Build** — runs the same prerequisites as `.github/workflows/chromatic.yml`'s studio
   job: build `@opengovsg/isomer-components` → `prisma generate` → `build:preview-tw` →
   `build-storybook`. `--skip-build` reuses an existing `apps/studio/storybook-static`.
2. **Serve** — a tiny static `http` server over `storybook-static` on an ephemeral port.
3. **Index** — reads the build's `index.json` for the story list (Storybook 7+).
4. **Screenshot** — Playwright Chromium, one context per worker (`--concurrency`), one
   context per viewport. `captureStory` → `captureStable` (see Determinism).
5. **Diff** — `pixelmatch` at per-pixel `threshold: 0.1`; images padded to the larger box
   if sizes differ (`padToMatch`). Story fails when changed/total ratio > `--threshold`.
6. **Report + gate** — writes `summary.md` + per-story `base.png`/`head.png`/`diff.png`,
   exits non-zero on any over-threshold story (unless `--report-only`).

Two modes share all of the above: `--capture-baseline` writes baselines; default mode
diffs against them. The output dir (`.context/visual-diff/`) and, in capture mode, the
baseline dir are **wiped at the start of each run** so results never mix across runs.

## Determinism (important)

Screenshots must be reproducible or the gate produces false positives. `captureStory`:
- injects CSS to zero out animations/transitions, hide the text caret, disable smooth
  scroll;
- awaits `document.fonts.ready`;
- `waitForStable` waits for the story root's geometry/DOM to stop changing;
- `captureStable` re-screenshots until two consecutive frames are pixel-stable (settled),
  so entrance animations, spinners, and async (MSW) content finish before the frame is
  recorded.

### KNOWN residual non-determinism (read before tightening the gate)

A handful of stories still differ run-to-run even against the *same* build — confirmed by
running a no-op diff (capture baseline, then immediately diff with no code change). As of
the last run these were mainly:

- `pages-edit-page-database-page--database-modal-*` (~1.7–2.7%) — async data preview that
  does not settle within the `captureStable` window (or genuinely varies).
- Various `*resource-menu` / `*expanded-menu` (~0.04–0.18%) — popover sub-pixel positioning.

**Do not "fix" this by raising the global `--threshold` to swallow it** — that would also
mask real ~1–2% regressions elsewhere. Preferred handling, in order:
1. Exclude the specific flaky stories from the gate (an `--ignore <glob>` / ignore-list is
   the natural next feature — not yet implemented).
2. Better: measure each story's **intrinsic noise** during baseline capture (screenshot
   twice, record the self-diff) and gate against a per-story floor. This auto-handles
   flaky stories without a hand-maintained list.
3. Increase `captureStable` `tries`/`settleMs` if the content just needs longer to settle.

When you change determinism logic, re-validate with a **no-op diff** and aim for 0
over-threshold; investigate any remainder rather than assuming it's noise.

## Environment notes (this repo / sandbox)

- `pnpm` is provided via corepack (`corepack enable pnpm`), not always on PATH. `run.mjs`
  spawns bare `pnpm`, so a `pnpm` shim must be on PATH.
- Storybook build validates env via `src/env.mjs`; run with `SKIP_ENV_VALIDATION=true` to
  build without real secrets (stories are MSW-mocked, no DB needed).
- This package is **excluded from the pnpm workspace** (`pnpm-workspace.yaml`) and uses
  npm for its own deps, keeping Playwright out of the root lockfile. Install with
  `npm install` + `npx playwright install chromium`.
- Studio is Tailwind **v3**; OUI is Tailwind **v4**. They are kept as separate CSS
  pipelines — irrelevant to this tool, but relevant when a story's styling looks off.

## Output layout

```
.context/visual-diff/
  summary.md                                  # over-threshold first, with image paths
  stories/<storyId>/<viewport>/{base,head,diff}.png
```

## Lifecycle

Throwaway. Scoped to the Chakra → OUI migration. When the migration completes, delete
`baselines/` and this whole directory (the final-cleanup PR does this).
