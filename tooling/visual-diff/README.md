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

Builds the studio Storybook (running the same prerequisite steps as
`.github/workflows/chromatic.yml`: build components → `prisma generate` →
`build:preview-tw` → `build-storybook`), then screenshots **every** story at every
viewport into `tooling/visual-diff/baselines/<viewport>/<storyId>.png`.

The `baselines/` directory is gitignored — capture it locally before you start the
stack, and keep it for the duration of the migration.

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

## Flags

| Flag | Default | Purpose |
|---|---|---|
| `--capture-baseline` | off | Capture frozen baselines instead of diffing |
| `--filter <glob>` | none | Narrow to stories whose id/title matches (e.g. `*modal*`) |
| `--all` | off | Explicit "every story" (diff mode already defaults to all) |
| `--threshold <ratio>` | `0.001` | Fail a story when changed-pixel ratio exceeds this (0.1%) |
| `--report-only` | off | Always exit 0; just write `summary.md` |
| `--viewports <list>` | `desktop:1280x900,mobile:375x812` | Comma list of `name:WxH` |
| `--skip-build` | off | Reuse the existing `apps/studio/storybook-static` build |
| `--local-storybook <dir>` | `apps/studio/storybook-static` | Built Storybook dir |
| `--baseline-dir <dir>` | `tooling/visual-diff/baselines` | Frozen baseline location |
| `--out <dir>` | `.context/visual-diff` | Output dir |
| `--concurrency <n>` | `4` | Parallel pages |

## How scoping works

Migration PRs edit **consumer** files (not story/component directories), so there is no
reliable file→story mapping. Diff mode therefore defaults to **all** stories (the
studio Storybook is small enough). Use `--filter` to narrow to the component under
migration when you want a faster check, but run the full set before submitting a PR
that touches a pervasive primitive (Box, Flex, Text, Button).

## Troubleshooting

- **Missing baseline for a story** — the story is newer than your baseline. Re-run
  `--capture-baseline` from the Foundation branch, or ignore if expected.
- **Antialiasing noise** — pixelmatch runs at `threshold: 0.1` per pixel; the
  story-level `--threshold` (ratio of changed pixels) absorbs subpixel jitter. Tune
  `--threshold` up slightly if a faithful migration trips on rendering noise.
- **Size mismatch** — images are padded to the larger box and flagged in the summary;
  a size change is itself usually a real regression worth inspecting.

## Lifecycle

Scoped to the Chakra → OUI migration. Once complete, delete `baselines/` and this
directory.
