# visual-diff

Per-PR visual-regression gate for the **`apps/studio` Chakra → OUI migration**.

It compares the **current** studio Storybook against a set of **frozen PNG baselines**
captured once, before the migration, from the all-Chakra UI. Every migration PR must
render pixel-identical to that frozen "Chakra look". If a story drifts beyond the
threshold, the tool exits non-zero so an agent, pre-push hook, or CI can block it.

This intentionally does **not** use Chromatic (whose baseline drifts as `main`
updates) for the per-PR loop. It is local, fast, and deterministic — ideal for a
Graphite stack where each PR is checked against the same frozen reference.

## Setup

This tool is intentionally **excluded from the pnpm workspace** (see `pnpm-workspace.yaml`)
and manages its own deps with npm, so Playwright never lands in the root lockfile.

```sh
cd tooling/visual-diff
npm install
npx playwright install chromium
```

## Usage

### 1. Capture the baseline (once, on the Foundation branch, pre-migration)

```sh
node tooling/visual-diff/run.mjs --capture-baseline
```

Builds the studio Storybook (build components → `pnpm --filter isomer-studio generate`
for the Prisma client → `build:preview-tw` → `build:oui-css` → `build-storybook`), then
screenshots **every** story at every viewport into
`tooling/visual-diff/baselines/<viewport>/<storyId>.png`.

The `baselines/` directory **is gitignored** — capture it locally before you start the
stack. Re-capture at a checkpoint (e.g. after a batch of units lands and has been reviewed)
so the gate then flags only *new* drift — see "Re-baselining" below. (`.context/` per-run
output is gitignored too.)

### 2. Diff a migration PR (default mode)

```sh
node tooling/visual-diff/run.mjs                    # all stories
node tooling/visual-diff/run.mjs --filter "*button*"  # narrow to one component
```

Builds the current Storybook, screenshots the scoped stories, pixel-diffs each
against its frozen baseline, and writes results to `.context/visual-diff/`. The
output directory is **wiped at the start of every run**, so it only ever contains the
current run's results. For each compared story it writes all three images side by side:

```
.context/visual-diff/
  summary.md
  stories/<story-id>/<viewport>/
    base.png   # the frozen baseline (pre-migration)
    head.png   # the current snapshot
    diff.png   # highlighted differences (only when pixels changed)
```

Read `.context/visual-diff/summary.md` — it lists stories **over threshold** first,
with the `base`/`head`/`diff` paths. **Exits non-zero if any story is over threshold.**

### Determinism

Each screenshot is taken from a *settled* frame: animations/transitions and the text
caret are forced off, web fonts are awaited, and the page is re-screenshotted until two
consecutive frames are pixel-stable. This removes false positives from entrance
animations, spinners, and async (MSW) content that would otherwise differ between two
runs of the same build.

If a page **never settles** (e.g. a live site-preview iframe that repaints forever), the
tool does **not** hang or wait it out — it takes a best-effort shot, marks the story
**unstable**, excludes it from the gate (its pixels are non-deterministic so a diff is
meaningless), and lists it under **"Unstable stories"** in `summary.md`. That's a signal to
fix the story (mock the moving content / freeze the preview) — see the summary's call-out.

## Flags

| Flag | Default | Purpose |
|---|---|---|
| `--capture-baseline` | off | Capture frozen baselines instead of diffing |
| `--filter <glob>` | none | Narrow to stories whose id/title matches (e.g. `*modal*`) |
| `--ignore <glob>` | none | Skip matching stories (repeatable/comma); add `::<viewport>` to scope. Merged with `ignore.txt` |
| `--all` | off | Explicit "every story" (diff mode already defaults to all) |
| `--threshold <ratio>` | `0.001` | Fail a story when changed-pixel ratio exceeds this (0.1%) |
| `--report-only` | off | Always exit 0; just write `summary.md` |
| `--viewports <list>` | `desktop:1280x900,mobile:375x812` | Comma list of `name:WxH` |
| `--skip-build` | off | Reuse the existing `apps/studio/storybook-static` build |
| `--local-storybook <dir>` | `apps/studio/storybook-static` | Built Storybook dir |
| `--baseline-dir <dir>` | `tooling/visual-diff/baselines` | Frozen baseline location |
| `--out <dir>` | `.context/visual-diff` | Output dir |
| `--concurrency <n>` | `4` | Parallel pages |
| `--verbose` / `-v` | off | Per-job start + per-phase trace (goto/settle/capture) to localise a hang |
| `--job-timeout <ms>` | `120000` | Hard per-(story×viewport) deadline; a stuck job is recorded as an error instead of hanging the run |

## Debugging a hang

Every log line is timestamped (`[12.3s]`), and even without `--verbose` a **heartbeat**
prints the in-flight `story [viewport]` jobs (and how long each has run) every 15s — so a
stall points straight at the culprit story. For finer detail add `--verbose` (traces each
phase: `goto` → `waitForStable` → `settle` → `captureStable`).

- **Hang during the build?** The last `$ pnpm …` line shows which build step is running
  (build output streams inline). A storybook resolve error (e.g. `Can't resolve
  '@opengovsg/isomer-components'`) means the `@opengovsg/isomer-components build` step
  didn't produce `packages/components/dist` — run that build first, or don't `--skip-build`.
- **Hang during capture?** A single wedged page (a heavy story that OOM-crashes chromium)
  no longer stalls the run — it trips `--job-timeout` and is reported as an error. Lower
  `--concurrency` (e.g. `1`) for heavy stories, or `--filter` to the ones you changed.

```sh
pnpm diff -- --verbose --filter "*button*"      # via the package script (note the `--`)
node tooling/visual-diff/run.mjs --verbose       # or call directly
```

## Ignoring known-flaky stories

`tooling/visual-diff/ignore.txt` lists stories excluded from the gate (one glob per
line; `::<viewport>` scopes to one viewport). It's auto-loaded every run; `--ignore`
adds more. Use it only for stories with confirmed intrinsic non-determinism (e.g.
floating-ui popover sub-pixel positioning) — never to silence a real diff. Prefer
fixing the source of the flakiness (e.g. mocking network) over ignoring.

## Re-baselining (checkpoints)

Your local baseline is a *moving* reference, not the original all-Chakra snapshot. When a
batch of migration units has landed and been reviewed, re-capture so the gate measures drift
from the new, known-good state instead of accumulating the whole Chakra→OUI delta:

```sh
node tooling/visual-diff/run.mjs --capture-baseline
```

Do this on a settled tree (only intended, reviewed changes present) — whatever is on screen
becomes the new "correct". Don't re-baseline mid-unit (it would bake an unreviewed change in).

## How scoping works

Migration PRs edit **consumer** files (not story/component directories), so there is no
reliable file→story mapping. Diff mode therefore defaults to **all** stories (the
studio Storybook is small enough). Use `--filter` to narrow to the component under
migration when you want a faster check, but run the full set before submitting a PR
that touches a pervasive primitive (Box, Flex, Text, Button).

## Troubleshooting

- **Missing baseline for a story** — the story is newer than your local baseline. Re-capture
  (see "Re-baselining"), or ignore if expected.
- **Antialiasing noise** — pixelmatch runs at `threshold: 0.1` per pixel; the
  story-level `--threshold` (ratio of changed pixels) absorbs subpixel jitter. Tune
  `--threshold` up slightly if a faithful migration trips on rendering noise.
- **Size mismatch** — images are padded to the larger box and flagged in the summary;
  a size change is itself usually a real regression worth inspecting.

## Lifecycle

Scoped to the Chakra → OUI migration. Once complete, delete `baselines/` and this
directory.
