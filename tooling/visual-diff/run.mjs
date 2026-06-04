#!/usr/bin/env node
// Visual diff for the Chakra → OUI migration of apps/studio.
//
// Unlike a Chromatic baseline (which drifts as main updates), this compares the
// CURRENT studio Storybook against a set of FROZEN PNG baselines captured once,
// before the migration, from the all-Chakra UI. Every migration PR must render
// pixel-identical to that frozen "Chakra look".
//
// Two modes:
//   --capture-baseline   build studio Storybook, screenshot ALL stories at every
//                        viewport, write them to baselines/. Run once on the
//                        Foundation branch (pre-migration).
//   (default)            build studio Storybook, screenshot scoped stories, diff
//                        each against its frozen baseline, write summary.md, and
//                        exit non-zero if any story exceeds --threshold.
//
// Adapted from camp-design-system/semarang/tooling/visual-diff. See README.md.

import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat, rm, copyFile } from 'node:fs/promises';
import { existsSync, createReadStream, readFileSync } from 'node:fs';
import { extname, join, dirname, resolve, relative } from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';

// ---- constants ----

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..');
const STORYBOOK_BASE_DIR = 'apps/studio'; // matches chromatic.yml's studio job
const LOCAL_STORYBOOK = join(REPO_ROOT, STORYBOOK_BASE_DIR, 'storybook-static');
const DEFAULT_VIEWPORTS = [
  { name: 'desktop', w: 1280, h: 900 },
  { name: 'mobile', w: 375, h: 812 },
];
// Steps required before `build-storybook`, mirroring .github/workflows/chromatic.yml.
const BUILD_STEPS = [
  ['pnpm', ['--filter', '@opengovsg/isomer-components', 'build']],
  ['pnpm', ['--filter', 'isomer-studio', 'exec', 'prisma', 'generate']],
  ['pnpm', ['--filter', 'isomer-studio', 'build:preview-tw']],
  ['pnpm', ['--filter', 'isomer-studio', 'build-storybook']],
];
const STATIC_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

// ---- args ----

function parseArgs(argv) {
  const args = {
    captureBaseline: false,
    localStorybook: LOCAL_STORYBOOK,
    baselineDir: join(SCRIPT_DIR, 'baselines'),
    skipBuild: false,
    out: join(REPO_ROOT, '.context', 'visual-diff'),
    viewports: DEFAULT_VIEWPORTS,
    all: false,
    filter: null,
    concurrency: 4,
    threshold: 0.001, // fail a story when > 0.1% of its pixels change
    reportOnly: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--capture-baseline': args.captureBaseline = true; break;
      case '--local-storybook': args.localStorybook = resolve(next()); break;
      case '--baseline-dir': args.baselineDir = resolve(next()); break;
      case '--skip-build': args.skipBuild = true; break;
      case '--out': args.out = resolve(next()); break;
      case '--viewports': args.viewports = parseViewports(next()); break;
      case '--all': args.all = true; break;
      case '--filter': args.filter = next(); break;
      case '--concurrency': args.concurrency = Number(next()) || 4; break;
      case '--threshold': args.threshold = Number(next()); break;
      case '--report-only': args.reportOnly = true; break;
      case '-h': case '--help':
        console.log(readFileSyncSafe(join(SCRIPT_DIR, 'README.md')) || 'See README.md');
        process.exit(0);
      default:
        die(`Unknown arg: ${a}`);
    }
  }
  return args;
}

function parseViewports(spec) {
  // "desktop:1280x900,mobile:375x812"
  const out = spec.split(',').map((part) => {
    const [name, dims] = part.split(':');
    const [w, h] = (dims ?? '').split('x').map(Number);
    if (!name || !w || !h) die(`--viewports expects name:WxH,... (got "${part}")`);
    return { name, w, h };
  });
  if (!out.length) die('--viewports parsed to empty list');
  return out;
}

function readFileSyncSafe(p) {
  try { return readFileSync(p, 'utf8'); } catch { return null; }
}

// ---- logging ----

const log = {
  info: (m) => console.log(m),
  step: (m) => console.log(`\n→ ${m}`),
  ok: (m) => console.log(`  ✓ ${m}`),
  warn: (m) => console.warn(`  ! ${m}`),
};
function die(msg, code = 1) {
  console.error(`\nError: ${msg}\n`);
  process.exit(code);
}

// ---- step 1: build storybook (or skip) ----

function buildStorybook(args) {
  if (args.skipBuild) {
    log.step('Skipping Storybook build (--skip-build)');
    if (!existsSync(join(args.localStorybook, 'index.json'))) {
      die(`--skip-build set but ${args.localStorybook}/index.json is missing. Run once without --skip-build.`);
    }
    return;
  }
  log.step(`Building studio Storybook (${STORYBOOK_BASE_DIR})`);
  for (const [cmd, cmdArgs] of BUILD_STEPS) {
    log.info(`  $ ${cmd} ${cmdArgs.join(' ')}`);
    const r = spawnSync(cmd, cmdArgs, { cwd: REPO_ROOT, stdio: 'inherit' });
    if (r.status !== 0) die(`"${cmd} ${cmdArgs.join(' ')}" failed (exit ${r.status}). See output above.`);
  }
  if (!existsSync(join(args.localStorybook, 'index.json'))) {
    die(`Storybook built but ${args.localStorybook}/index.json is missing. Storybook 7+ expected.`);
  }
  log.ok(`Built to ${relative(REPO_ROOT, args.localStorybook)}`);
}

// ---- step 2: serve local storybook ----

async function serveLocal(rootDir) {
  const server = createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (urlPath.endsWith('/')) urlPath += 'index.html';
      const filePath = resolve(rootDir, '.' + urlPath);
      if (!filePath.startsWith(rootDir)) { res.writeHead(403).end(); return; }
      const s = await stat(filePath).catch(() => null);
      if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': STATIC_MIME[extname(filePath)] || 'application/octet-stream', 'Content-Length': s.size });
      createReadStream(filePath).pipe(res);
    } catch (e) {
      res.writeHead(500).end(String(e));
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}`;
  log.ok(`Local Storybook served at ${url}`);
  return { url, close: () => new Promise((r) => server.close(() => r())) };
}

// ---- step 3: story index ----

async function fetchIndex(url) {
  let res;
  try {
    res = await fetch(`${url}/index.json`);
  } catch (e) {
    die(`Failed to reach local Storybook at ${url}: ${e.message}`);
  }
  if (!res.ok) die(`Local Storybook returned HTTP ${res.status} for /index.json`);
  const json = await res.json();
  if (!json.entries || typeof json.entries !== 'object') {
    die(`/index.json has unexpected shape (no .entries). Storybook 7+ expected.`);
  }
  const stories = Object.values(json.entries).filter((e) => e.type === 'story');
  log.ok(`${stories.length} stories in index.json`);
  return stories;
}

function applyFilter(stories, filterGlob) {
  if (!filterGlob) return stories;
  const re = globToRegex(filterGlob);
  return stories.filter((s) => re.test(s.id) || re.test(s.title));
}

function globToRegex(glob) {
  const pattern = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${pattern}$`, 'i');
}

// ---- screenshot helpers (shared by both modes) ----

// CSS injected before screenshotting to remove the main sources of frame-to-frame
// non-determinism: in-flight animations/transitions, the blinking text caret, and
// smooth scrolling. Without this, overlays (menus, modals, popovers) and focused
// inputs produce false-positive diffs even when comparing a build against itself.
const STABILIZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
    scroll-behavior: auto !important;
  }
`;

async function captureStory(page, sbUrl, storyId) {
  const url = `${sbUrl}/iframe.html?viewMode=story&id=${encodeURIComponent(storyId)}`;
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#storybook-root', { timeout: 15000 });
  await page.addStyleTag({ content: STABILIZE_CSS }).catch(() => {});
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
  await waitForStable(page);
  return await captureStable(page);
}

// Re-screenshot until two consecutive frames are pixel-stable (settled), so async
// content (spinners, MSW fetches resolving) and entrance animations have finished
// before we record the frame. Both baseline and diff runs use this, so a settled
// frame is compared against a settled frame.
async function captureStable(page, { tries = 5, settleMs = 200, epsilonRatio = 0.0001 } = {}) {
  let prev = await page.screenshot({ fullPage: false, animations: 'disabled' });
  for (let i = 0; i < tries; i++) {
    await page.waitForTimeout(settleMs);
    const next = await page.screenshot({ fullPage: false, animations: 'disabled' });
    try {
      const a = PNG.sync.read(prev);
      const b = PNG.sync.read(next);
      if (a.width === b.width && a.height === b.height) {
        const diff = new PNG({ width: a.width, height: a.height });
        const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
        if (changed / (a.width * a.height) <= epsilonRatio) return next;
      }
    } catch {
      // fall through to next iteration
    }
    prev = next;
  }
  return prev;
}

async function waitForStable(page, { quietMs = 500, maxMs = 5000 } = {}) {
  const start = Date.now();
  let lastSig = null;
  let lastChange = Date.now();
  while (Date.now() - start < maxMs) {
    const sig = await page.evaluate(() => {
      const root = document.querySelector('#storybook-root');
      if (!root) return '';
      const r = root.getBoundingClientRect();
      return `${r.width}x${r.height}:${root.children.length}:${root.innerHTML.length}`;
    });
    if (sig !== lastSig) { lastSig = sig; lastChange = Date.now(); }
    else if (Date.now() - lastChange >= quietMs) return;
    await page.waitForTimeout(50);
  }
}

function sanitizeId(id) {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}

// Wipe a directory so each run starts clean (no stale stories/diffs from a prior run).
async function cleanDir(dir) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

// Run a queue of (story, viewport) jobs across `concurrency` browser contexts.
async function runJobs({ url, stories, viewports, concurrency, handle }) {
  const browser = await chromium.launch();
  try {
    const jobs = [];
    for (const vp of viewports) for (const story of stories) jobs.push({ story, vp });
    const results = [];
    const workers = Array.from({ length: Math.min(concurrency, jobs.length) || 1 }, async () => {
      // One context per viewport switch is costly; instead make a context per worker
      // and resize per job via a fresh context when the viewport changes.
      let ctx = null;
      let ctxVp = null;
      const ensureCtx = async (vp) => {
        if (ctx && ctxVp === vp.name) return;
        if (ctx) await ctx.close();
        ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
        ctxVp = vp.name;
      };
      try {
        while (jobs.length) {
          const job = jobs.shift();
          if (!job) break;
          await ensureCtx(job.vp);
          const page = await ctx.newPage();
          try {
            const r = await handle(page, job.story, job.vp);
            results.push(r);
          } catch (e) {
            log.warn(`${job.story.id} [${job.vp.name}] — failed: ${e.message}`);
            results.push({ story: job.story, vp: job.vp, error: e.message, changedPixels: 0, totalPixels: 0 });
          } finally {
            await page.close();
          }
        }
      } finally {
        if (ctx) await ctx.close();
      }
    });
    await Promise.all(workers);
    return results;
  } finally {
    await browser.close();
  }
}

// ---- mode: capture baseline ----

async function captureBaseline({ url, stories, viewports, concurrency, baselineDir }) {
  log.step(`Capturing baselines (${stories.length} stories × ${viewports.length} viewports) → ${relative(REPO_ROOT, baselineDir)}`);
  await cleanDir(baselineDir); // start fresh so removed stories don't linger
  const results = await runJobs({
    url, stories, viewports, concurrency,
    handle: async (page, story, vp) => {
      const shot = await captureStory(page, url, story.id);
      const dir = join(baselineDir, vp.name);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, `${sanitizeId(story.id)}.png`), shot);
      log.ok(`${story.id} [${vp.name}]`);
      return { story, vp, ok: true };
    },
  });
  const ok = results.filter((r) => r.ok).length;
  log.info(`\nBaseline captured: ${ok} screenshots, ${results.filter((r) => r.error).length} errors.`);
  return results;
}

// ---- mode: diff against frozen baseline ----

async function diffAgainstBaseline({ url, stories, viewports, concurrency, baselineDir, outDir, threshold }) {
  log.step(`Diffing ${stories.length} stories × ${viewports.length} viewports (threshold ${threshold})`);
  await cleanDir(outDir); // start each run from a clean output dir
  const results = await runJobs({
    url, stories, viewports, concurrency,
    handle: async (page, story, vp) => {
      const baselinePath = join(baselineDir, vp.name, `${sanitizeId(story.id)}.png`);
      const headShot = await captureStory(page, url, story.id);
      if (!existsSync(baselinePath)) {
        log.warn(`${story.id} [${vp.name}] — no baseline (new story?)`);
        return { story, vp, missingBaseline: true, changedPixels: 0, totalPixels: 0 };
      }
      const storyDir = join(outDir, 'stories', sanitizeId(story.id), vp.name);
      await mkdir(storyDir, { recursive: true });
      const basePng = PNG.sync.read(await readFile(baselinePath));
      const headPng = PNG.sync.read(headShot);
      // Emit all three (baseline + current snapshot + diff) side-by-side for review.
      await copyFile(baselinePath, join(storyDir, 'base.png'));
      await writeFile(join(storyDir, 'head.png'), headShot);
      const { a: padBase, b: padHead, width, height, sizeMismatch } = padToMatch(basePng, headPng);
      const diff = new PNG({ width, height });
      const changedPixels = pixelmatch(padBase.data, padHead.data, diff.data, width, height, { threshold: 0.1 });
      const totalPixels = width * height;
      const ratio = totalPixels ? changedPixels / totalPixels : 0;
      const failed = ratio > threshold;
      let diffPath = null;
      if (changedPixels > 0) {
        diffPath = join(storyDir, 'diff.png');
        await writeFile(diffPath, PNG.sync.write(diff));
      }
      log.ok(`${story.id} [${vp.name}] — ${changedPixels === 0 ? 'no diff' : `${changedPixels}px (${(ratio * 100).toFixed(3)}%)${failed ? ' ✗ OVER' : ''}`}`);
      return { story, vp, changedPixels, totalPixels, ratio, failed, sizeMismatch, basePath: join(storyDir, 'base.png'), headPath: join(storyDir, 'head.png'), diffPath };
    },
  });
  return results;
}

function padToMatch(a, b) {
  if (a.width === b.width && a.height === b.height) return { a, b, width: a.width, height: a.height, sizeMismatch: false };
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  return { a: padPng(a, width, height), b: padPng(b, width, height), width, height, sizeMismatch: true };
}

function padPng(src, width, height) {
  if (src.width === width && src.height === height) return src;
  const out = new PNG({ width, height });
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = 255; out.data[i + 1] = 255; out.data[i + 2] = 255; out.data[i + 3] = 0;
  }
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const si = (src.width * y + x) * 4;
      const di = (width * y + x) * 4;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3];
    }
  }
  return out;
}

// ---- summary.md ----

async function writeSummary({ outDir, args, results, totalStories, scopedCount, gitInfo }) {
  await mkdir(outDir, { recursive: true });
  const lines = [];
  lines.push(`# Visual diff summary`);
  lines.push('');
  lines.push(`- Baseline: \`${relative(REPO_ROOT, args.baselineDir)}\` (frozen)`);
  lines.push(`- Local: ${relative(REPO_ROOT, args.localStorybook)}`);
  lines.push(`- Viewports: ${args.viewports.map((v) => `${v.name} ${v.w}×${v.h}`).join(', ')}`);
  lines.push(`- Branch: \`${gitInfo.branch}\` @ ${gitInfo.sha}${gitInfo.dirty ? ' (dirty)' : ''}`);
  lines.push(`- Threshold: ${args.threshold} (fail when changed-pixel ratio exceeds it)${args.reportOnly ? ' — _report-only, gate disabled_' : ''}`);
  lines.push(`- Total stories in build: ${totalStories} · scoped: ${scopedCount}${args.filter ? ` (filter \`${args.filter}\`)` : ''}`);
  lines.push('');

  const failed = results.filter((r) => r.failed).sort((a, b) => b.ratio - a.ratio);
  const changedUnderThreshold = results.filter((r) => !r.failed && r.changedPixels > 0).sort((a, b) => b.ratio - a.ratio);
  const errored = results.filter((r) => r.error);
  const missing = results.filter((r) => r.missingBaseline);

  lines.push(`## Results`);
  lines.push('');
  lines.push(`- Compared: ${results.length} (story × viewport)`);
  lines.push(`- **Over threshold: ${failed.length}**`);
  lines.push(`- Changed but under threshold: ${changedUnderThreshold.length}`);
  lines.push(`- Missing baseline (new): ${missing.length}`);
  lines.push(`- Errored: ${errored.length}`);
  lines.push('');

  const section = (title, list) => {
    if (!list.length) return;
    lines.push(`## ${title}`);
    lines.push('');
    for (const r of list) {
      const pct = ((r.ratio ?? 0) * 100).toFixed(3);
      lines.push(`### ${r.story.title} — ${r.story.name} [${r.vp.name}]`);
      lines.push('');
      lines.push(`- ID: \`${r.story.id}\``);
      lines.push(`- Changed: **${r.changedPixels}px** (${pct}% of ${r.totalPixels})${r.sizeMismatch ? ' — _size mismatch, padded_' : ''}`);
      lines.push(`- base: \`${relative(REPO_ROOT, r.basePath)}\``);
      lines.push(`- head: \`${relative(REPO_ROOT, r.headPath)}\``);
      if (r.diffPath) lines.push(`- diff: \`${relative(REPO_ROOT, r.diffPath)}\``);
      lines.push('');
    }
  };
  section('❌ Over threshold (regressions to review)', failed);
  section('⚠️ Changed but under threshold', changedUnderThreshold);

  if (missing.length) {
    lines.push(`## Missing baseline`);
    lines.push('');
    for (const r of missing) lines.push(`- \`${r.story.id}\` [${r.vp.name}] — re-run \`--capture-baseline\` if this story should exist pre-migration`);
    lines.push('');
  }
  if (errored.length) {
    lines.push(`## Errors`);
    lines.push('');
    for (const r of errored) lines.push(`- \`${r.story.id}\` [${r.vp?.name}] — ${r.error}`);
    lines.push('');
  }

  const summaryPath = join(outDir, 'summary.md');
  await writeFile(summaryPath, lines.join('\n'));
  return { summaryPath, failed, errored };
}

function gitOutput(a) {
  const r = spawnSync('git', a, { cwd: REPO_ROOT, encoding: 'utf8' });
  return r.status === 0 ? r.stdout : '';
}
function getGitInfo() {
  return {
    branch: gitOutput(['rev-parse', '--abbrev-ref', 'HEAD']).trim() || '?',
    sha: gitOutput(['rev-parse', '--short', 'HEAD']).trim() || '?',
    dirty: gitOutput(['status', '--porcelain']).trim().length > 0,
  };
}

// ---- main ----

async function main() {
  const args = parseArgs(process.argv.slice(2));
  log.info(args.captureBaseline ? 'Visual diff: capturing frozen baseline' : 'Visual diff: comparing against frozen baseline');

  buildStorybook(args);

  log.step('Starting local static server');
  const server = await serveLocal(args.localStorybook);

  try {
    log.step('Reading story index');
    const allStories = await fetchIndex(server.url);

    if (args.captureBaseline) {
      const stories = applyFilter(allStories, args.filter);
      await captureBaseline({
        url: server.url, stories, viewports: args.viewports,
        concurrency: args.concurrency, baselineDir: args.baselineDir,
      });
      return; // exit 0
    }

    // diff mode: default to all stories unless --filter narrows
    const scoped = applyFilter(allStories, args.filter);
    log.ok(`Scoped to ${scoped.length} stories${args.all ? ' (--all)' : ''}`);

    const results = await diffAgainstBaseline({
      url: server.url, stories: scoped, viewports: args.viewports,
      concurrency: args.concurrency, baselineDir: args.baselineDir,
      outDir: args.out, threshold: args.threshold,
    });

    log.step('Writing summary');
    const { summaryPath, failed, errored } = await writeSummary({
      outDir: args.out, args, results,
      totalStories: allStories.length, scopedCount: scoped.length,
      gitInfo: getGitInfo(),
    });
    log.ok(`Summary written to ${relative(REPO_ROOT, summaryPath)}`);

    log.info(`\nDone: ${failed.length} over threshold, ${errored.length} errors.`);
    if (!args.reportOnly && (failed.length > 0 || errored.length > 0)) {
      die(`Visual regression gate failed: ${failed.length} stories over threshold, ${errored.length} errors. See ${relative(REPO_ROOT, summaryPath)}.`, 1);
    }
  } finally {
    await server.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
