# RFC: Render published Isomer sites with Astro + a custom islands runtime

|             |                                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| Status      | Experiment complete. Recommendation pending decision                                                       |
| Branch / PR | `poc/astro-template` / #3828 (draft, not for merge)                                                        |
| Code        | `apps/template-astro/` (the migration), plus simplifications in `packages/components`                      |
| Harness     | `tooling/astro-migration-experiment/` (this RFC, fixtures, parity tests, measurement scripts, raw results) |
| Date        | 2026-11-17                                                                                                 |

## TL;DR

Replace the Next.js static export in `apps/template` with an **Astro build that server-renders the existing `@opengovsg/isomer-components` React tree and hydrates only `"use client"` components as islands, using Preact in the browser**.

On a synthetic 60-page coverage site, compared with today's Next build:

- **Initial JS on content/article pages drops 77%**, from 279 KB to 64 KB (gzip).
- **Total first-load bytes drop 45–61%** across page types.
- **The HTML document halves**, because Next's ~40 KB RSC payload is no longer inlined in every page.
- **Builds are faster and lighter at every site size.** At 10k pages: 156 s / 6.0 GB → 83 s / 1.5 GB, or 34.5 s / 3.8 GB with `parallelPrerender`.
- **Visual and interaction parity holds.** All 19 Playwright checks pass: pixel comparison of 6 page types × 2 viewports against the Next build, plus interaction tests for every interactive island.
- **Studio keeps working.** It renders the same React components in its preview. Component changes were limited to removing Next-only workarounds; see Component changes below.

The costs are about 340 lines of islands runtime that we'd own, a few rules for component authors, and porting work still to do for the publisher, Studio's local publish and the e2e test.

## Problem

`apps/template` is a Next 16 App Router static export. Every page ships the same ~279 KB (gzip) of JS, whatever it contains:

- the Next runtime and router
- React and react-dom
- every client component in the package

Next also inlines an RSC flight payload (`self.__next_f.push(...)`) into every HTML file. That payload duplicates the page content, adding about 40 KB gzip per page. Published sites are static content pages, so almost none of this JS does any work.

## Proposal

```
schema/*.json ──► Astro (static) ──► renderToString(<RenderEngine/>)   React SSR
                                        │
                     "use client" boundary (Vite plugin)
                                        ▼
        <isomer-island data-component data-props>…SSR HTML…</isomer-island>
                                        │
          islands/hydrate-islands.ts: per page, lazily import only the islands present,
                    hydrate each one (load / visible / idle) with Preact
```

1. **Astro is the static-site shell only.** It provides routing via `getStaticPaths` from `sitemap.json`, Vite, CSS handling and static output. Pages call `react-dom/server`'s `renderToString` on `RenderEngine` directly. We don't use `@astrojs/react` or `@astrojs/preact`; see below for why.
2. **The islands Vite plugin** (`src/islands/vite-plugin.ts`; `src/islands/README.md` has the end-to-end walkthrough) recreates Next's `"use client"` boundary:
   - **Server side:** when a server module imports a `"use client"` module from `isomer-components`, the plugin wraps each exported component. The wrapper SSRs the component inside an `<isomer-island>` marker with its props as JSON.
   - **Client side:** a registry of lazy loaders means each page downloads only the island chunks it contains.
3. **Each island is SSR'd as its own React root** with a unique `identifierPrefix`. Without this, `useId` values (react-aria depends on them) would mismatch on hydration.
4. **Hydration timing per island.** Below-the-fold and widget islands (gallery, carousels, video, chat widgets) hydrate when `visible` or `idle`. Everything else hydrates on `load`.
5. **Components that only need a click or error handler aren't islands.** They render as static HTML with a `data-isomer-*` hook, and `static-behaviours.js` (about 45 lines, inlined in `<head>`) provides the behaviour: back-to-top, notification dismiss and the broken-image fallback. A dismissed notification is hidden before first paint, so it never flashes.
6. **Preact in the browser** (the default). The build aliases `react`/`react-dom` to `preact/compat` **for the client bundle only**; `ISLANDS_RUNTIME=react` switches back to React. Server rendering stays on React, so the HTML is identical either way.

### Component changes (`packages/components`)

These remove workarounds that existed only for Next or for RSC. Each one makes the Astro app simpler. They are **not** backward-compatible with `apps/template`, which no longer builds from this branch (see Reproducing).

| Change                                                                                                                                                               | Why it existed                                         | What it removed from `apps/template-astro`                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Dropped `"use client"` from `Link`, `LinkComponentContext`, `ClientCopyright`, `ImageClient`, `BackToTopLink`                                                        | RSC needs the directive for context, hooks or handlers | A hand-maintained "don't hydrate these" list in the Vite plugin                                          |
| Deleted `ScrollToTop`                                                                                                                                                | Workaround for `next/link` scroll restoration          | Its no-op special case                                                                                   |
| `Notification` renders `NotificationBanner` directly (static dismiss via `data-isomer-notification*`); deleted `NotificationClient` and `useIsNotificationDismissed` | Dismiss state needed a client component                | Slots: the machinery that passed server-rendered React nodes into islands                                |
| `ImageGallery`'s spacing moved from the island root to its server wrapper                                                                                            | —                                                      | A PostCSS plugin that rewrote `:first-child` / `:last-child` selectors to see through the island wrapper |
| New `RenderPageHead` component in components                                                                                                                         | Next consumes `getMetadata()`'s `Metadata` object      | `head.ts`, an adapter from Next's `Metadata` object to tags                                              |
| `RenderApplicationScripts`' `ScriptComponent` defaults to `"script"`; dropped `strategy`                                                                             | `next/script`                                          | A `next/script` stand-in                                                                                 |

Studio's preview still works the same: React renders everything there, so `onClick` handlers (e.g. `BackToTopLink`) and the link-component context keep working. The static notification dismiss button doesn't hide the banner inside Studio's preview, which doesn't matter for editing.

### Why not `@astrojs/react` or `@astrojs/preact`?

These are Astro's official integrations for React and Preact components. We render with `react-dom/server` directly and use our own islands runtime instead:

1. **They only hydrate components that an `.astro` file mounts with a `client:*` directive.** Our page is one React tree (`RenderEngine` → layouts → blocks), and the interactive parts (Navbar, filters, carousels…) are nested deep inside it. Astro doesn't understand `"use client"`. If an `.astro` page renders `<RenderEngine />`, every nested client component becomes static HTML with no interactivity. That leaves two options:
   - **`<RenderEngine client:load />`.** Hydrates the whole tree. We measured this both ways. With React (the PR #1751 approach) it's **+15% JS vs Next**. With `@astrojs/preact` (`compat: true`) it's **−2% JS**, and its Preact SSR made builds **2.7× slower** (see Alternatives).
   - **Rewrite layouts as `.astro` files** so interactive leaves can get `client:*` directives. That forks rendering away from Studio's preview, which renders the same React tree live in the browser. Every layout would exist twice and have to look identical. It also ships no less JS than our approach, because the same leaves hydrate either way.
2. **Island boundaries should fall where `"use client"` already is.** The components package already marks every interactive boundary. Our Vite plugin reuses those boundaries as they are, while the integrations would need them restated in `.astro` files.
3. **We needed control over hydration:**
   - **Each island SSR'd as its own root with an `identifierPrefix`**, so react-aria's `useId` values match.
   - **Per-island timing** (`load` / `visible` / `idle`) keyed by component name.
   - **A client runtime swap** (Preact / React) that doesn't touch server rendering, which stays on React for the speed and fidelity.

What we actually use from Astro is static routing, the Vite pipeline, CSS handling and output.

## Results

### First-party bytes on first load (gzip, KB). Next → Astro + Preact islands

| Page                                           | Total                | Initial JS           | HTML    | Embedded payload |
| ---------------------------------------------- | -------------------- | -------------------- | ------- | ---------------- |
| Homepage (hero carousel + all homepage blocks) | 424 → 192 (**−55%**) | 279 → 89 (**−68%**)  | 79 → 37 | 43 → 0.7         |
| Content (every content block)                  | 429 → 169 (**−61%**) | 279 → 64 (**−77%**)  | 83 → 38 | 46 → 0.8         |
| Collection (56 items, filters)                 | 422 → 233 (**−45%**) | 279 → 128 (**−54%**) | 76 → 38 | 42 → 2.6         |
| Article                                        | 419 → 165 (**−61%**) | 279 → 64 (**−77%**)  | 74 → 34 | 41 → 0.5         |
| Database (searchable table)                    | 419 → 189 (**−55%**) | 279 → 88 (**−69%**)  | 73 → 34 | 40 → 0.6         |

How these were measured:

- "Total" counts HTML + JS + CSS + fonts loaded before the `load` event.
- "Embedded payload" is the RSC payload for Next and the serialized island props for Astro.
- CSS (~19 KB) and fonts (~47 KB) are unchanged.
- Third-party scripts are excluded and identical in both builds.
- Lazy JS (`visible`/`idle` islands) is about 3.5 KB on the content page and 0 elsewhere.
- Numbers were unchanged after the component simplifications. Those removed Next-isms rather than client JS.

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
- **Notification banner no longer flashes.** A dismissed banner is hidden before first paint. Under Next it rendered, then disappeared on hydration.

## What got harder

- **We own an islands runtime.** About 340 lines across `vite-plugin.ts`, `render-island.ts`, `hydrate-islands.ts` and `static-behaviours.js` (documented in `src/islands/README.md`). Next did this for us.
- **Rules for component authors** (in `src/islands/README.md`):
  - Only mark a component `"use client"` if it needs React state or effects. For simple handlers, use a `data-isomer-*` hook plus `static-behaviours.js`.
  - Props into `"use client"` components must be plain data. No functions and no React elements; the build fails with the prop name.
  - React context doesn't cross into an island.
  - No `first:` / `last:` / `only:` variants on an island's root element, because it sits in an `<isomer-island>` wrapper.
- **Wrapper-element side effects.** `<isomer-island>` is `display: contents`, so layout ignores it. A parent's child-combinator rules (`parent > *`, `space-y-*`, `divide-*`) still skip island roots. No failures turned up in the coverage site, but the parity suite is the safety net.
- **Preact compatibility is ours to verify:**
  - react-aria and headlessui run on `preact/compat`. They pass our interaction tests, but React upstream doesn't support this setup.
  - Preact doesn't report hydration mismatches in production, so only the visual and interaction tests catch them.
  - Fallback: build with `ISLANDS_RUNTIME=react` to ship React (still −64%, also 19/19).
- **More, smaller JS requests:** 26–50 files per page versus Next's 10, with dynamic-import chains. HTTP/2 handles the request count. Adding `modulepreload` hints for each page's islands would flatten the chain.
- **Next features re-implemented or dropped:**
  - `next/font`'s size-matched fallback font (possible CLS while Inter loads; the Inter preload is kept)
  - `next/script` loading strategies (scripts now run inline)
  - `ClientCopyright`'s client-side year (now set at build time; differs only if a site isn't rebuilt across New Year)
- **Dev mode differs slightly from the build.** `astro dev` works (islands hydrate), but it hydrates with React rather than Preact, because Vite's dev pre-bundler bypasses the alias. It also needs `resolve.dedupe` for React, since `isomer-components` is a linked workspace package.
- **Astro 7 build quirks we had to work around:**
  - Prerendering runs in its own Vite environment, so `ssr.noExternal` doesn't reach it. Fixed with a `configEnvironment` plugin that bundles server deps.
  - `resolve.alias` can't be set per environment, so the Preact swap uses `resolveId`.

## Alternatives tried and not recommended

Every variant below was built from the same 60-page coverage fixture, checked with the same 19-test parity suite, and measured against the same Next build (`pnpm variants`; raw output is in `results/variants/*.md`). The Redact and whole-tree switches were removed from `apps/template-astro` after the experiment; `git apply tooling/astro-migration-experiment/variants.patch` (plus the `@tanstack/redact` dependency) restores them. The `@astrojs/preact` variant was built on a scratch branch. All variants pass 19/19.

### Initial JS (KB gzip, Δ vs Next)

| Page       |  Next | **Preact islands (recommended)** | Redact islands | React islands | `@astrojs/preact` whole tree | Whole tree, React (PR #1751) |
| ---------- | ----: | -------------------------------: | -------------: | ------------: | ---------------------------: | ---------------------------: |
| Homepage   | 278.9 |                  **88.8 (−68%)** |   106.6 (−62%) |  124.0 (−56%) |                  272.8 (−2%) |                 321.3 (+15%) |
| Content    | 278.9 |                  **64.0 (−77%)** |    81.8 (−71%) |   99.0 (−64%) |                  272.8 (−2%) |                 321.3 (+15%) |
| Collection | 278.9 |                 **127.7 (−54%)** |   145.6 (−48%) |  163.4 (−41%) |                  272.8 (−2%) |                 321.3 (+15%) |
| Article    | 278.9 |                  **64.0 (−77%)** |    81.8 (−71%) |   99.0 (−64%) |                  272.8 (−2%) |                 321.3 (+15%) |
| Database   | 278.9 |                  **87.9 (−69%)** |   105.7 (−62%) |  123.2 (−56%) |                  272.8 (−2%) |                 321.3 (+15%) |

### Total first-load bytes (HTML + JS + CSS + fonts; KB gzip, Δ vs Next)

| Page       |  Next | **Preact islands** | Redact islands | React islands | `@astrojs/preact` whole tree | Whole tree, React |
| ---------- | ----: | -----------------: | -------------: | ------------: | ---------------------------: | ----------------: |
| Homepage   | 424.3 |   **192.4 (−55%)** |   210.2 (−50%) |  227.5 (−46%) |                 381.2 (−10%) |       427.5 (+1%) |
| Content    | 428.9 |   **169.0 (−61%)** |   186.8 (−56%) |  204.1 (−52%) |                 383.1 (−11%) |        429.4 (0%) |
| Collection | 421.7 |   **232.6 (−45%)** |   250.5 (−41%) |  268.3 (−36%) |                 379.2 (−10%) |       425.4 (+1%) |
| Article    | 419.1 |   **164.7 (−61%)** |   182.5 (−56%) |  199.7 (−52%) |                 378.5 (−10%) |       424.7 (+1%) |
| Database   | 418.9 |   **189.1 (−55%)** |   206.9 (−51%) |  224.4 (−46%) |                 378.5 (−10%) |       424.7 (+1%) |

### Why each one isn't recommended

| Alternative                                                                                                            | Headline numbers                                                                                                                                                                                                                                             | Why not                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`@astrojs/preact` with `compat: true`** (`<RenderEngine client:load />`, Preact SSR)                                 | JS **−2%** (273 KB on every page); total **−10% to −11%**. Build at 1k pages: **48.4 s vs 17.8 s** for our islands build in the same session (2.7× slower). At 10k it was stopped after ~3,000 pages, running at ~195 ms/page (~30 min estimated, vs 110 s). | The official integration can only hydrate what an `.astro` file mounts, so for our single React tree it means whole-tree hydration. Preact makes that whole tree smaller than React's, but it still ships every component. Preact SSR through the integration is also much slower than `react-dom/server`. |
| **Whole-tree hydration with React** (`<RenderEngine client:load />`, the PR #1751 approach; `ISLANDS_MODE=whole-tree`) | JS **+15%** (321 KB on every page); total **0% to +1%**; HTML −50%                                                                                                                                                                                           | Ships and hydrates the whole component library, including Algolia, which Next stubs out. The HTML saving from dropping the RSC payload is cancelled out by the extra JS.                                                                                                                                   |
| **React islands** (no client runtime swap)                                                                             | JS **−41% to −64%**; total **−36% to −52%**                                                                                                                                                                                                                  | Works, and it's the safe fallback. It leaves ~35 KB per page (React + react-dom vs `preact/compat`) that Preact removes. Keep it as the fallback switch (`ISLANDS_RUNTIME=react`).                                                                                                                         |
| **TanStack Redact islands** (`ISLANDS_RUNTIME=redact`, `@tanstack/redact@0.3.1`)                                       | JS **−48% to −71%**; total **−41% to −56%**                                                                                                                                                                                                                  | Smaller than React (−17.3 KB/page) but **17.8 KB/page larger than Preact** on every page. It's v0 (first published 2026-04), and it declares a peer dependency on `next`. Revisit if it matures or ships a smaller preset that works here.                                                                 |
| **Astro single-process prerender** (default, `parallelPrerender` off)                                                  | 100: **4.1 s / 1.4 GB**; 1k: 9.5 s / 1.6 GB; 10k: **83 s / 1.5 GB** (Next: 20.8 s / 3.9 GB, 27.2 s / 4.9 GB, 156 s / 6.0 GB)                                                                                                                                 | Not rejected, just a trade-off. It's the fastest and smallest at 100 pages and uses the least memory at every size. `parallelPrerender` is 1.3× faster at 1k and 2.4× faster at 10k, but needs 1.7–2.5× the memory (2.4 / 2.8 / 3.8 GB). Pick per site size, based on CodeBuild memory.                    |
| **A PostCSS selector rewrite for the island wrapper** (tried, then removed)                                            | Fixed the 2 failing screenshot checks (article page 64 px short, content page 24 px short)                                                                                                                                                                   | It fixed `first:` variants on island roots generically. Once `BackToTopLink` stopped being an island and `ImageGallery`'s spacing moved to its server wrapper, nothing needed it. A component-author rule replaces it.                                                                                     |
| **Slots** (server-rendered React nodes as island props; tried, then removed)                                           | —                                                                                                                                                                                                                                                            | Only `NotificationClient` used them. Making the notification static removed the whole mechanism from both halves of the runtime.                                                                                                                                                                           |

**Considered but not built:**

- **Rewriting layouts as `.astro` with `client:*` directives.** It would fork rendering from Studio's live in-browser preview. It also wouldn't ship less JS than the islands plugin, since the same leaves hydrate either way.
- **Marking islands explicitly in components** (e.g. `export const NavbarClient = island(...)` plus a manifest) instead of the plugin's import rewriting. It's more explicit, but it touches every client component and adds a manifest to keep in sync. The plugin derives both from `"use client"`, which is already there.
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

1. **Rewrite the Navbar as a static component** (server HTML + a few `data-isomer-*` behaviours), the way `BackToTopLink` and `Notification` work now. Estimate: article pages drop to about 10–15 KB of JS, and pages without other islands ship **no framework at all**. This is the biggest single win left. Studio can keep using it unchanged, as long as both render identical HTML for the same schema.
2. **Compute `tv()`/`twMerge` class names at build time** for islands whose variants are known statically.
3. **Slim props at the island boundary** (for example `CollectionClient` items).
4. **Add `modulepreload` hints** for each page's island chunks.

## Not yet covered by the experiment

- **Publisher integration:** `tooling/build/scripts/publisher.sh`, the CodeBuild image, sitemap/search-index generation, and RSS. The environment variable names (`NEXT_PUBLIC_ISOMER_*`) were kept so the publisher's settings carry over.
- **Studio's local publish** (`.local-publish`) in dev mode.
- **Porting `apps/template`'s e2e test** (bundle pruning), plus running the parity suite against real exported sites. Synthetic fixtures make the _relative_ numbers valid; absolute sizes on real sites will differ.
- **Islands not exercised by the fixture:** search page / SearchSG, egazette Algolia, DGS live data, Polyglot, central notifications, and third-party widgets (Vica, Askgov, Zendesk, GTM, Clarity). They hydrate through the same path but haven't been seen working. The site notification was checked separately: shown, dismissed, and hidden on the next page from first paint.
- **`sitemap.xml` and `robots.txt`** are ported. The RSS feed is not.

## Open questions

1. **CodeBuild sizing.** Does `parallelPrerender` scale with vCPUs on CodeBuild, and does 3.8 GB at 10k pages fit the medium instance? Run `pnpm bench` there.
2. **Preact risk.** Accept `preact/compat` for react-aria/headlessui islands, given the parity and interaction suite as the guard? Or start with React islands and switch later?
3. **Replace or run alongside?** The component simplifications break `apps/template`. A rollout would either switch all sites at once, or keep the Next-only workarounds until `apps/template` is retired.
4. **Navbar rewrite.** Take it on now (lever 1) as part of the migration, or as a follow-up?

## Reproducing

Run from `tooling/astro-migration-experiment/`. `apps/template` (Next) no longer builds from this branch, because the component simplifications drop Next-only directives. Build the Next reference from `main` (or commit `0df990a56`) on the same fixture first, then:

```bash
pnpm fixture:make fixtures/coverage 60 && pnpm fixture apply fixtures/coverage
(cd ../../apps/template-astro && pnpm build:template)    # Astro (Preact islands)
pnpm exec playwright test --project=astro                # 19 visual + interaction checks vs the Next screenshots
pnpm measure --files / /content/                         # first-load bytes + per-file JS breakdown
pnpm variants --reuse-next preact-islands react-islands  # -> results/variants/*.md
pnpm bench 100,1000,10000 3 astro,astro-parallel         # -> results/bench-results.json
pnpm fixture restore                                     # put both apps' sample sites back
```

`variants` and `bench` apply and restore the fixture themselves.
