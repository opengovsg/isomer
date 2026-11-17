# RFC: Render published Isomer sites with Astro + a custom islands runtime

|         |                                                                                                            |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| Status  | Experiment complete. Recommendation pending decision                                                       |
| Branch  | `experiment/astro-template`                                                                                |
| Code    | `apps/template-astro/` (the migration: sibling of `apps/template`, which is unchanged)                     |
| Harness | `tooling/astro-migration-experiment/` (this RFC, fixtures, parity tests, measurement scripts, raw results) |
| Date    | 2026-11-17                                                                                                 |

## TL;DR

Replace the Next.js static export in `apps/template` with an **Astro build that server-renders the existing `@opengovsg/isomer-components` React tree and hydrates only `"use client"` components as islands, using Preact in the browser**.

On a synthetic 60-page coverage site, compared with today's Next build:

- **Initial JS on content/article pages drops 77%**, from 279 KB to 64 KB (gzip).
- **Total first-load bytes drop 45–61%** across page types.
- **The HTML document halves**, because Next's ~40 KB RSC payload is no longer inlined in every page.
- **Builds are faster and lighter at every site size.** At 10k pages: 156 s / 6.0 GB → 83 s / 1.5 GB, or 34.5 s / 3.8 GB with `parallelPrerender`.
- **Visual and interaction parity holds.** All 19 Playwright checks pass: pixel comparison of 6 page types × 2 viewports against the Next build, plus interaction tests for every interactive island.
- **Studio is untouched.** It keeps rendering the same React components in its preview. Only one line changed in `packages/components`: a `data-` attribute.

The costs are about 390 lines of islands runtime that we'd own, a few new rules component authors must follow, and porting work still to do for the publisher, dev preview and e2e tests.

## Problem

`apps/template` is a Next 16 App Router static export. Every page ships the same ~279 KB (gzip) of JS, whatever it contains:

- the Next runtime and router
- React and react-dom
- every client component in the package

Next also inlines an RSC flight payload (`self.__next_f.push(...)`) into every HTML file. That payload duplicates the page content, adding about 40 KB gzip per page. Published sites are static content pages, so almost none of this JS does any work.

## Proposal

```
schema/*.json ──► Astro (static) ──► renderToString(<RenderEngine/>)   React SSR, unchanged components
                                        │
                     "use client" boundary (Vite plugin)
                                        ▼
                 <isomer-island data-k data-p>…SSR HTML…</isomer-island>
                                        │
          islands/hydrate-islands.ts: per page, lazily import only the islands present,
                    hydrate each one (load / visible / idle) with Preact
```

1. **Astro is the static-site shell only.** It provides routing via `getStaticPaths` from `sitemap.json`, Vite, CSS handling and static output. We **don't use `@astrojs/react`**. Pages call `react-dom/server` `renderToString` on `RenderEngine` directly.
2. **The islands Vite plugin** (`src/islands/vite-plugin.ts`; `src/islands/README.md` has the end-to-end walkthrough) recreates Next's `"use client"` boundary:
   - **Server side:** when a server module imports a `"use client"` module from `isomer-components`, the plugin wraps each exported component. The wrapper SSRs the component inside an `<isomer-island>` marker with its serialized props.
   - **Client side:** a registry of lazy loaders means each page downloads only the island chunks it contains.
3. **SSR'd React nodes passed as props** (for example `children`) become static `<isomer-slot>` HTML, the same model as Astro's own slots.
4. **Each island is SSR'd as its own React root** with a unique `identifierPrefix`. Without this, `useId` values (react-aria depends on them) would mismatch on hydration.
5. **Hydration timing per island.** Below-the-fold and widget islands (gallery, carousels, video, chat widgets) hydrate when `visible` or `idle`. Everything else hydrates on `load`.
6. **Static tier: client components that don't need a framework once there's no client router.** They render as plain HTML, and 20 lines of inline JS (`static-behaviours.js`) replace their handlers. The list is `NO_HYDRATION` in `vite-plugin.ts`:
   - `Link`
   - `ScrollToTop`
   - `ClientCopyright`
   - `ImageClient` (`onError` placeholder swap)
   - `BackToTopLink` (scroll to top)
7. **A PostCSS rewrite** (`postcss-island-selectors.ts`) changes `:first-child`, `:last-child` and `:only-child` so that an island's root matches when its _wrapper_ does. Specificity is unchanged. Without it, Tailwind classes like `[&:not(:first-child)]:mt-6` break inside islands.
8. **Preact in the browser** (the default). The build aliases `react`/`react-dom` to `preact/compat` **for the client bundle only**; `ISLANDS_RUNTIME=react` switches back to React. Server rendering stays on React, so the HTML is identical either way.

### Why not `@astrojs/react`?

`@astrojs/react` is Astro's official way to use React components. We render with `react-dom/server` directly and use our own islands runtime instead, for four reasons:

1. **It only hydrates components that an `.astro` file mounts with a `client:*` directive.** Our page is one React tree (`RenderEngine` → layouts → blocks), and the interactive parts (Navbar, filters, carousels…) are nested deep inside it. Astro doesn't understand `"use client"`. If an `.astro` page renders `<RenderEngine />`, every nested client component becomes static HTML with no interactivity. That leaves two options, both bad:
   - **`<RenderEngine client:load />`.** Hydrates the whole tree. This is what PR #1751 did. Measured: **+15% JS vs Next** (see Alternatives).
   - **Rewrite layouts as `.astro` files** so interactive leaves can get `client:*` directives. That forks rendering away from Studio's preview, which renders the same React tree live in the browser. Every layout would exist twice and have to look identical. It also ships no less JS than our approach, because the same leaves hydrate either way.
2. **Island boundaries must fall where `"use client"` already is.** The components package already marks every interactive boundary, and its props are already serializable because RSC requires it. Our Vite plugin reuses those boundaries as-is. With `@astrojs/react` we'd have to restate them in `.astro` files.
3. **Island props in our tree carry React nodes that Astro slots can't express.** Server-rendered React elements are passed as props (`children` and others) to client components. Astro slots only carry children passed from `.astro` markup. Our runtime turns any React-node prop into a static `<isomer-slot>`.
4. **Hydration details we needed control over:**
   - **Each island is SSR'd as its own root with an `identifierPrefix`**, so react-aria's `useId` values match on hydration.
   - **Per-island timing** (`load` / `visible` / `idle`) is keyed by component name.
   - **A static tier** ships no framework at all for components like `Link` and `ImageClient`.
   - **The client runtime can be swapped** (Preact / React) without touching server rendering.

What we actually use from Astro is static routing, the Vite pipeline, CSS handling and output. `react-dom/server`'s `renderToString` is the only React rendering API the build needs, and the integration would add a renderer layer we'd then have to work around.

## Results

### First-party bytes on first load (gzip, KB). Next → Astro + Preact islands

| Page                                           | Total                | Initial JS           | HTML    | Embedded payload |
| ---------------------------------------------- | -------------------- | -------------------- | ------- | ---------------- |
| Homepage (hero carousel + all homepage blocks) | 424 → 192 (**−55%**) | 279 → 89 (**−68%**)  | 79 → 37 | 43 → 0.7         |
| Content (every content block)                  | 429 → 169 (**−61%**) | 279 → 64 (**−77%**)  | 83 → 38 | 46 → 0.8         |
| Collection (56 items, filters)                 | 422 → 233 (**−45%**) | 279 → 128 (**−54%**) | 76 → 38 | 42 → 2.6         |
| Article                                        | 419 → 165 (**−61%**) | 279 → 64 (**−77%**)  | 74 → 34 | 41 → 0.5         |
| Database (searchable table)                    | 419 → 189 (**−55%**) | 279 → 88 (**−68%**)  | 73 → 34 | 40 → 0.6         |

How these were measured:

- "Total" counts HTML + JS + CSS + fonts loaded before the `load` event.
- "Embedded payload" is the RSC payload for Next and the serialized island props for Astro.
- CSS (~19 KB) and fonts (~47 KB) are unchanged.
- Third-party scripts are excluded and identical in both builds.
- Lazy JS (`visible`/`idle` islands) is about 3.5 KB on the content page and 0 elsewhere.

### Build time and peak memory

Cold builds on an Apple Silicon laptop with default cores. Peak RSS is summed across the whole process tree, so Next's worker processes count. Medians of 3 runs, except 10k pages, which is a single run.

|  Pages | Next            | Astro (default: single process, `parallelPrerender` off) | Astro + `experimental.parallelPrerender` |
| -----: | --------------- | -------------------------------------------------------- | ---------------------------------------- |
|    100 | 20.8 s / 3.9 GB | **4.1 s / 1.4 GB**                                       | 4.6 s / 2.4 GB                           |
|  1,000 | 27.2 s / 4.9 GB | 9.5 s / 1.6 GB                                           | **7.4 s / 2.8 GB**                       |
| 10,000 | 156 s / 6.0 GB  | 83 s / 1.5 GB                                            | **34.5 s / 3.8 GB**                      |

Astro renders pages in a single process by default. `parallelPrerender` (Astro 7.4+, experimental) spreads rendering across worker threads: it's 2.4× faster at 10k pages and uses 2.5× the memory. It's still well under Next's memory either way. **This hasn't been checked on CodeBuild yet.** CPU-count scaling should be confirmed there; see Open questions.

## What got better

- **Client JS:** 54–77% less, depending on page type. Each page pays only for its own islands. Next ships the same bundle everywhere.
- **HTML:** about 50% smaller, because the RSC payload is gone. Island props add 0.5–2.6 KB, since they're already-processed props at the boundary.
- **Builds:** 2–5× faster and 2.5–4× less memory at default settings. The build-memory ceiling that blocked page-level work in the past (PR #1738) is much further away.
- **Less framework surface.** No Next workarounds such as `NoPrefetchLink`, `ScrollToTop`, the `webpack` `NormalModuleReplacementPlugin` for Algolia, or the not-found duplicate-render hack. Island lazy-loading already keeps Algolia out of pages that don't use it, with no special case.
- **No agent-targeted upgrade gate.** Next 16.4.2's CLI now aborts builds with `SecurityFatalError` until it's upgraded, which interrupted this experiment repeatedly.
- **Studio is unaffected.** Components stay React and the Components ↔ Studio contract is unchanged.

## What got harder

- **We own an islands runtime.** About 400 lines across `vite-plugin.ts`, `render-island.ts`, `hydrate-islands.ts`, `static-behaviours.js` and `postcss-island-selectors.ts` (documented in `src/islands/README.md`). Next did this for us.
- **Wrapper-element side effects:**
  - `<isomer-island>` is `display: contents`, so it doesn't affect layout.
  - The PostCSS rewrite covers the structural pseudo-classes.
  - **Not covered:** a parent's child-combinator rules (`parent > *`, `space-y-*`, `divide-*`) skip island roots. No visual failure turned up in the coverage site, but it's a latent risk. The parity suite is the safety net.
- **Prop and context rules are now enforced by our runtime instead of Next:**
  - Props passed into `"use client"` components must be JSON-serializable. This is the same rule as RSC, so nothing changes for authors, and the serializer throws at build time on violations.
  - React context **doesn't cross into islands**. Today only `LinkComponentContext` (defaults to `"a"`, which is fine) and Studio's `HeroCarouselPreviewContext` are affected.
- **Static-tier list drift.** `NO_HYDRATION` encodes knowledge about specific components. If someone adds real interactivity to one of them, it silently stops working on published sites. This needs a lint rule or test.
- **Preact compatibility is ours to verify:**
  - react-aria and headlessui run on `preact/compat`. They pass our interaction tests, but React upstream doesn't support this setup.
  - Preact doesn't report hydration mismatches in production, so only the visual and interaction tests catch them.
  - Fallback: build with `ISLANDS_RUNTIME=react` to ship React (still −64%).
- **More, smaller JS requests:** 26–50 files per page versus Next's 10, with dynamic-import chains. HTTP/2 handles the request count. Adding `modulepreload` hints for each page's islands would flatten the chain.
- **Next features re-implemented or dropped:**
  - `next/font`'s size-matched fallback font (possible CLS while Inter loads; the Inter preload is kept)
  - `next/script` loading strategies (scripts now run inline)
  - the `Metadata` API (replaced by `head.ts`)
  - `ClientCopyright`'s client-side year (now set at build time; differs only if a site isn't rebuilt across New Year)
- **Dev mode differs slightly from the build.** `astro dev` works (islands hydrate), but it hydrates with React rather than Preact, because Vite's dev pre-bundler bypasses the alias. It also needs `resolve.dedupe` for React, since `isomer-components` is a linked workspace package. Studio's local publish (`.local-publish`) isn't wired up yet.
- **Astro 7 build quirks we had to work around:**
  - Prerendering runs in its own Vite environment, so `ssr.noExternal` doesn't reach it. Fixed with a `configEnvironment` plugin.
  - The bundled prerender entry imports `cookie` from the app root, which made `cookie` a direct dependency.
  - `resolve.alias` can't be set per environment, so the Preact swap uses `resolveId`.

## Alternatives tried and not recommended

Every variant below was built from the same 60-page coverage fixture, checked with the same 19-test parity suite, and measured against the same Next build (`pnpm variants`; raw output is in `results/variants/*.md`). The Redact and whole-tree switches were removed from `apps/template-astro` after the experiment; `git apply tooling/astro-migration-experiment/variants.patch` (plus the `@tanstack/redact` dependency) restores them. All four pass 19/19.

### Initial JS (KB gzip, Δ vs Next)

| Page       |  Next | **Preact islands (recommended)** | Redact islands | React islands | Whole-tree hydration (PR #1751) |
| ---------- | ----: | -------------------------------: | -------------: | ------------: | ------------------------------: |
| Homepage   | 278.9 |                  **88.8 (−68%)** |   106.6 (−62%) |  124.0 (−56%) |                    321.3 (+15%) |
| Content    | 278.9 |                  **64.0 (−77%)** |    81.8 (−71%) |   99.1 (−64%) |                    321.3 (+15%) |
| Collection | 278.9 |                 **127.7 (−54%)** |   145.6 (−48%) |  163.3 (−41%) |                    321.3 (+15%) |
| Article    | 278.9 |                  **64.0 (−77%)** |    81.8 (−71%) |   99.1 (−64%) |                    321.3 (+15%) |
| Database   | 278.9 |                  **87.9 (−68%)** |   105.7 (−62%) |  123.2 (−56%) |                    321.3 (+15%) |

### Total first-load bytes (HTML + JS + CSS + fonts; KB gzip, Δ vs Next)

| Page       |  Next | **Preact islands** | Redact islands | React islands | Whole-tree hydration |
| ---------- | ----: | -----------------: | -------------: | ------------: | -------------------: |
| Homepage   | 424.3 |   **192.4 (−55%)** |   210.2 (−50%) |  227.5 (−46%) |          427.5 (+1%) |
| Content    | 428.9 |   **169.0 (−61%)** |   186.8 (−56%) |  204.1 (−52%) |           429.4 (0%) |
| Collection | 421.7 |   **232.6 (−45%)** |   250.5 (−41%) |  268.3 (−36%) |          425.4 (+1%) |
| Article    | 419.1 |   **164.7 (−61%)** |   182.5 (−56%) |  199.7 (−52%) |          424.7 (+1%) |
| Database   | 418.9 |   **189.1 (−55%)** |   206.9 (−51%) |  224.4 (−46%) |          424.7 (+1%) |

### Why each one isn't recommended

| Alternative                                                                                                 | Headline numbers                                                                                                             | Why not                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Whole-tree hydration** (`<RenderEngine client:load />`, the PR #1751 approach; `ISLANDS_MODE=whole-tree`) | JS **+15%** (321 KB on every page); total **0% to +1%**; HTML −50%                                                           | Ships and hydrates the whole component library, including Algolia, which Next stubs out. The HTML saving from dropping the RSC payload is cancelled out by the extra JS. A dead end.                                                                                                    |
| **React islands** (no client runtime swap)                                                                  | JS **−41% to −64%**; total **−36% to −52%**                                                                                  | Works, and it's the safe fallback. It leaves ~35 KB per page (React + react-dom vs `preact/compat`) that Preact removes. Keep it as the fallback switch (`ISLANDS_RUNTIME=react`).                                                                                                      |
| **TanStack Redact islands** (`ISLANDS_RUNTIME=redact`, `@tanstack/redact@0.3.1`)                            | JS **−48% to −71%**; total **−41% to −56%**                                                                                  | Smaller than React (−17.3 KB/page) but **17.8 KB/page larger than Preact** on every page. It's v0 (first published 2026-04), and it declares a peer dependency on `next`. Revisit if it matures or ships a smaller preset that works here.                                              |
| **Astro single-process prerender** (default, `parallelPrerender` off)                                       | 100: **4.1 s / 1.4 GB**; 1k: 9.5 s / 1.6 GB; 10k: **83 s / 1.5 GB** (Next: 20.8 s / 3.9 GB, 27.2 s / 4.9 GB, 156 s / 6.0 GB) | Not rejected, just a trade-off. It's the fastest and smallest at 100 pages and uses the least memory at every size. `parallelPrerender` is 1.3× faster at 1k and 2.4× faster at 10k, but needs 1.7–2.5× the memory (2.4 / 2.8 / 3.8 GB). Pick per site size, based on CodeBuild memory. |
| **Per-component CSS fixes for the island wrapper**                                                          | Before the fix: article page 64 px short, content page 24 px short (2 of 12 screenshot checks failed)                        | The first parity failures (`BackToTopLink`, `ImageGallery` margins) came from `first:` variants. Patching each component doesn't scale; the 24-line PostCSS rewrite fixes the whole class of bugs.                                                                                      |

**Considered but not built:**

- **Rewriting layouts as `.astro` with `client:*` directives.** It would fork rendering from Studio's live in-browser preview. It also wouldn't ship less JS than the islands plugin, since the same leaves hydrate either way.
- **Staying on Next and stripping the runtime after export.** Fragile across Next upgrades, and it can't remove the RSC model.
- **Staying on Next and cutting client boundaries.** Helps, but Next's runtime floor (~180 KB of framework, router and React) stays.

## Next levers (not done)

On an article page, the remaining 64 KB is almost all the **Navbar island**, which is on every page:

| Part                                                               | KB gzip |
| ------------------------------------------------------------------ | ------: |
| `tailwind-variants` + `tailwind-merge` (runtime class computation) |     ~19 |
| react-aria (focus ring, `FocusScope`)                              |   ~12.5 |
| Preact                                                             |     ~10 |
| Navbar code and icons                                              |     ~10 |

1. **Rewrite the Navbar as a static-tier component** (server HTML + a small vanilla script), the way `BackToTopLink` already works. Estimate: article pages drop to about 10–15 KB of JS, and pages without other islands ship **no framework at all**. This is the biggest single win left, and it's the "make `packages/components` Astro-friendly" direction. Studio can keep a React version, as long as both render identical HTML for the same schema (parity tests can enforce this).
2. **Compute `tv()`/`twMerge` class names at build time** for islands whose variants are known statically.
3. **Slim props at the island boundary** (for example `CollectionClient` items). This helps Next equally.
4. **Add `modulepreload` hints** for each page's island chunks.

## Not yet covered by the experiment

- **Publisher integration:** `tooling/build/scripts/publisher.sh`, the CodeBuild image, sitemap/search-index generation, and RSS.
- **Studio's local publish** (`.local-publish`) in dev mode.
- **Porting the e2e suite**, plus running the parity suite against real exported sites. Synthetic fixtures make the _relative_ numbers valid; absolute sizes on real sites will differ.
- **Islands not exercised by the fixture:** search page / SearchSG, egazette Algolia, DGS live data, Polyglot, notifications, and third-party widgets (Vica, Askgov, Zendesk, GTM, Clarity). They hydrate through the same path but haven't been seen working.
- **`sitemap.xml` and `robots.txt`** are ported. The RSS feed is not.

## Open questions

1. **CodeBuild sizing.** Does `parallelPrerender` scale with vCPUs on CodeBuild, and does 3.8 GB at 10k pages fit the medium instance? Run `pnpm bench` there.
2. **Preact risk.** Accept `preact/compat` for react-aria/headlessui islands, given the parity and interaction suite as the guard? Or start with React islands and switch later?
3. **Replace or run alongside?** Should Astro replace `apps/template` or ship alongside it behind a per-site flag during rollout?
4. **Navbar rewrite.** Take it on now (lever 1) as part of the migration, or as a follow-up?

## Reproducing

Run from `tooling/astro-migration-experiment/`:

```bash
pnpm fixture:make fixtures/coverage 60 && pnpm fixture apply fixtures/coverage
(cd ../../apps/template && pnpm build:template)          # Next baseline
(cd ../../apps/template-astro && pnpm build:template)    # Astro (Preact islands)
pnpm test:parity                                         # 19 visual + interaction checks, Next as reference
pnpm measure --files / /content/                         # first-load bytes + per-file JS breakdown
pnpm variants react-islands preact-islands               # -> results/variants/*.md
pnpm bench 100,1000,10000 3                              # -> results/bench-results.json
pnpm fixture restore                                     # put apps/template's sample site back
```

`variants` and `bench` apply and restore the fixture themselves.
