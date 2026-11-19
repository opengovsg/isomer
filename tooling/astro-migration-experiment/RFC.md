# RFC: Render published Isomer sites with Astro + islands

|             |                                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| Status      | Experiment complete. Recommendation pending decision                                                       |
| Branch / PR | `poc/astro-template` / #3828 (draft, not for merge)                                                        |
| Code        | `apps/template-astro/` (the migration), plus changes in `packages/components`                              |
| Harness     | `tooling/astro-migration-experiment/` (this RFC, fixtures, parity tests, measurement scripts, raw results) |
| Date        | 2026-11-17                                                                                                 |

## TL;DR

Replace the Next.js static export in `apps/template` with a build that **renders the existing `@opengovsg/isomer-components` tree with Preact (on the server and in the browser) and hydrates only its interactive components as islands**. Components stay written in React, and Studio keeps rendering them with React. Astro runs the build.

Three things deliver the results below, and none of them is Astro itself:

1. **Islands**: only interactive components ship JS, instead of Next's runtime, router and whole-page hydration. This is our own code (about 550 lines), because Astro's islands only work in `.astro` files and our whole tree is React.
2. **Preact instead of React**, on the server and in the browser: 62 KB instead of about 97 KB on content pages. It's also the main risk (see [What got harder](#what-got-harder)).
3. **Parallel prerendering** (`experimental.parallelPrerender`): it takes 10k-page builds from 83 s to 34.5 s.

Astro is the build runner: routing from `sitemap.json`, bundling and hashing the browser JS, parallel prerendering and the dev server. We don't use Astro components, its islands, content collections or its image pipeline.

On a synthetic 60-page coverage site, compared with today's Next build:

- **Initial JS on content/article pages drops 78%**, from 279 KB to 62 KB (gzip).
- **Total first-load bytes drop 46–62%** across page types.
- **The HTML document halves**, because Next's ~40 KB RSC payload is no longer inlined in every page.
- **Builds are faster and lighter at every site size.** At 10k pages Next takes 156 s / 6.0 GB. Astro takes **83 s / 1.5 GB in a single process, the result we can count on**, and 34.5 s / 3.8 GB with parallel prerendering, which the build uses. Parallel prerendering is an experimental Astro flag, so 34.5 s is the expected result, not a guaranteed one. It also ran on a real ~5k-page site on CodeBuild (8 vCPUs, 16 GiB).
- **Visual and interaction parity holds.** All 20 Playwright checks pass: pixel comparison of 6 page types × 2 viewports against the Next build, plus interaction tests for every interactive island.
- **Studio renders the same DOM as published sites.** Island boundaries are declared in `packages/components` with `island()`, so Studio's preview renders the same `<isomer-island>` markup. There's no build-time rewriting that only the published site sees.

The costs are about 550 lines of islands code that we'd own (205 in components, of which ~60 is the island registry; about 330 in the Astro app, including `react.ts` and the dev-only hydration check), the risk of running our React components and libraries on `preact/compat` (which differs from Studio's React), a few rules for component authors, and porting work still to do for CodeBuild, Studio's local publish and the e2e test.

## Problem

`apps/template` is a Next 16 App Router static export. Every page ships the same ~279 KB (gzip) of JS, whatever it contains:

- the Next runtime and router
- React and react-dom
- every client component in the package

Next also inlines an RSC flight payload (`self.__next_f.push(...)`) into every HTML file. That payload duplicates the page content, adding about 40 KB gzip per page. Published sites are static content pages, so almost none of this JS does any work.

## Proposal

```
packages/components                          apps/template-astro
───────────────────────────────────────      ─────────────────────────────────────────────────────
island("NavbarClient", NavbarClientImpl)     build:   renderToString(<IslandServerProvider>
  renders <isomer-island> everywhere                    <RenderEngine/>)
  (Studio, Storybook, published site)                 → <isomer-island data-component data-hydrate
islands registry: name → import()                         data-island-id data-props>…SSR HTML…
markup protocol constants                     browser: hydrateIslands() lazy-loads only the
                                                       islands on the page, hydrates each with Preact
```

1. **Astro is the static-site shell only.** It provides routing via `getStaticPaths` from `sitemap.json`, Vite, CSS handling and static output. Pages call `renderToString` (`preact/compat/server`, through the alias below) on `RenderEngine` directly. We don't use `@astrojs/react` or `@astrojs/preact`; see below for why. One small Vite plugin points every `"react"` import at `src/islands/react.ts`, and `react-dom` at `preact/compat`.
2. **Islands are declared in `packages/components`** (`src/islands/`, with a README):
   - **`island(name, Component, { hydrate })`** (`hydrate` is required) wraps each of the 29 boundary components (the interactive components that server-rendered code renders). It always renders `<isomer-island data-component="…">` (`display: contents`) around the component, in every host. Studio's preview and the published site therefore have the same DOM.
   - **The `islands` registry** maps each island name to a lazy `import()` of its module. `island()` only accepts registered names (a missing entry doesn't typecheck), and a unit test checks each module exports the island under its name.
   - **The markup protocol** (`protocol.ts`): the tags, plus helpers that write and read the attributes and the slot marker, so the host doesn't repeat any strings.
3. **The host renders and hydrates them** (`apps/template-astro/src/islands/`):
   - **`server.tsx`**: `IslandServerProvider` plugs into `IslandHost`, so every island additionally carries its props as JSON, its hydration timing and an id. Server-rendered `children` (e.g. `NotificationClient`'s body) become static `<isomer-slot>` HTML that the browser reuses as-is, like Astro's default slot.
   - **`client.ts`**: `hydrateIslands()` lazy-loads only the islands on the page and hydrates each at its timing (`load`, `visible` or `idle`).
4. **Each island is SSR'd as its own root, and ids are counted from a prefix on both sides.** Every `"react"` import goes through `src/islands/react.ts`, on top of `preact/compat`. It overrides `useId` with a counter per render (each island, each slot, each page-level render: `b-1`, `b-1-0`, `b-1-slot-0`…), and makes `useSyncExternalStore` return the server snapshot while server-rendering and hydrating, as React does and `preact/compat` doesn't. Preact keeps server attributes as they are on hydration and never re-applies them. Without this, ids repeat across islands (Preact restarts at `P0-0` in every root) and react-aria picks a random id prefix, so `aria-*` references break. It costs +0.3 KB of JS per page.
5. **Preact on the server and in the browser.** The build aliases `react`, `react-dom` and `react-dom/server` to `preact/compat` in both environments, and bundles the libraries that import React (react-aria, react-stately, headlessui, react-icons, react-instantsearch, interweave, usehooks-ts) into the server build so they get Preact too. The server HTML and the hydration therefore come from the same library, so a React/Preact difference can't cause a silent hydration bug on the published site. It shows up as a difference between Studio (React) and the published site instead, which is visible in preview. Development builds still compare each island's first browser render with the server HTML (see [What got harder](#what-got-harder)). An earlier version rendered the server HTML with React; switching to Preact didn't change build time beyond measurement noise (1k pages: 9.7/10.4 s → 9.1/7.6 s; 10k: 39.7/31.6 s → 36.8/36.6 s, alternated on a loaded machine) and used about 0.5 GB more peak memory at 10k (about 3.4 GB).

### Component changes (`packages/components`)

These declare island boundaries explicitly, and remove workarounds that existed only for Next or that Next silently papered over. They are **not** backward-compatible with `apps/template`, which no longer builds from this branch (see Reproducing).

| Change                                                                                                                                                 | Why                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `island()` + the `islands` registry on the 29 boundary components (`src/islands/`, new `./islands` package export)                                     | Explicit boundaries, rendered identically in every host. This replaced a Vite plugin that rewrote `"use client"` imports at build time (see Alternatives).                                                        |
| Removed every `"use client"` directive, `LinkComponentProvider` and its context                                                                        | Only meaningful to Next (RSC boundaries, swapping in `next/link`). `island()` now marks boundaries; Studio's preview stops link navigation with one capture-phase click handler instead of a fake link component. |
| Deleted `ScrollToTop`                                                                                                                                  | Workaround for `next/link` scroll restoration                                                                                                                                                                     |
| Spacing for `ImageGallery` and `BackToTopLink` set from their parents, not with `first:` variants on the island root                                   | Inside `<isomer-island>`, the root is always `:first-child`                                                                                                                                                       |
| Session-storage dismiss hooks (notification, central notification, unsupported-browser banner) read storage after mount (`initializeWithValue: false`) | Reading during the first render mismatches the server HTML. Next silently recovers by re-rendering its single tree; a standalone island root keeps the stale banner.                                              |
| New `RenderPageHead` component                                                                                                                         | Next consumes `getMetadata()`'s `Metadata` object; other hosts need tags                                                                                                                                          |
| `RenderApplicationScripts`' `ScriptComponent` defaults to `"script"`; dropped `strategy`; GTM init script id `_next-gtm-init-…` → `isomer-gtm-init-…`  | `next/script`                                                                                                                                                                                                     |

Studio's typecheck passes, and all 81 components test files (815 tests, including browser tests) pass.

### Why not `@astrojs/react` or `@astrojs/preact`?

These are Astro's official integrations for React and Preact components. We call `renderToString` directly (Preact's, through the alias) and hydrate with our own runtime instead:

1. **They only hydrate components that an `.astro` file mounts with a `client:*` directive.** Our page is one React tree (`RenderEngine` → layouts → blocks), and the interactive parts (Navbar, filters, carousels…) are nested deep inside it. If an `.astro` page renders `<RenderEngine />`, every nested interactive component becomes static HTML. That leaves two options:
   - **`<RenderEngine client:load />`.** Hydrates the whole tree. We measured this both ways. With React (the PR #1751 approach) it's **+15% JS vs Next**. With `@astrojs/preact` (`compat: true`) it's **−2% JS**, and builds were **2.7× slower** (see Alternatives). That slowdown came from the integration: our build also server-renders with Preact, at the same speed as React.
   - **Rewrite layouts as `.astro` files** so interactive leaves can get `client:*` directives. That forks rendering away from Studio's preview, which renders the same React tree live in the browser. Every layout would exist twice and have to look identical. It also ships no less JS, because the same leaves hydrate either way.
2. **Boundaries belong with the components.** `island()` declares them once in `packages/components`, where Studio sees them too. The integrations would need them restated in `.astro` files that Studio never renders.
3. **Island props in our tree carry React nodes.** Server-rendered elements are passed as props to interactive components. Astro slots only carry children passed from `.astro` markup.
4. **We needed control over hydration:**
   - **Each island SSR'd as its own root, with `useId` counted from the island's id** (`src/islands/react.ts`), so ids match between server and browser.
   - **Per-island timing** (`load` / `visible` / `idle`) declared next to the component.
   - **A client runtime swap** (Preact / React) that doesn't touch server rendering.

What we actually use from Astro is static routing, the Vite pipeline, CSS handling and output.

## Results

### First-party bytes on first load (gzip, KB). Next → Astro + Preact islands

| Page                                           | Total                | Initial JS           | HTML    | Embedded payload |
| ---------------------------------------------- | -------------------- | -------------------- | ------- | ---------------- |
| Homepage (hero carousel + all homepage blocks) | 424 → 189 (**−56%**) | 279 → 86 (**−69%**)  | 79 → 37 | 43 → 0.7         |
| Content (every content block)                  | 429 → 166 (**−61%**) | 279 → 62 (**−78%**)  | 83 → 38 | 46 → 0.8         |
| Collection (56 items, filters)                 | 422 → 226 (**−46%**) | 279 → 123 (**−56%**) | 76 → 38 | 42 → 2.6         |
| Article                                        | 419 → 161 (**−62%**) | 279 → 62 (**−78%**)  | 74 → 34 | 41 → 0.5         |
| Database (searchable table)                    | 419 → 184 (**−56%**) | 279 → 85 (**−70%**)  | 73 → 34 | 40 → 0.6         |

How these were measured:

- "Total" counts HTML + JS + CSS + fonts loaded before the `load` event.
- "Embedded payload" is the RSC payload for Next and the serialized island props for Astro.
- CSS (~19 KB) and fonts (~47 KB) are unchanged.
- Third-party scripts are excluded and identical in both builds.
- Lazy JS (`visible`/`idle` islands) is about 3.5 KB on the content page and 0 elsewhere.

### Build time and peak memory

Cold builds on an Apple Silicon laptop with default cores. Peak RSS is summed across the whole process tree, so Next's worker processes count. Medians of 3 runs, except 10k pages, which is a single run. Measured with the earlier plugin-based islands; the islands change doesn't affect server rendering cost.

|  Pages | Next            | Astro, single process | Astro, parallel prerender (used) |
| -----: | --------------- | --------------------- | -------------------------------- |
|    100 | 20.8 s / 3.9 GB | **4.1 s / 1.4 GB**    | 4.6 s / 2.4 GB                   |
|  1,000 | 27.2 s / 4.9 GB | 9.5 s / 1.6 GB        | **7.4 s / 2.8 GB**               |
| 10,000 | 156 s / 6.0 GB  | 83 s / 1.5 GB         | **34.5 s / 3.8 GB**              |

**The build uses parallel prerendering** (`experimental.parallelPrerender`, Astro 7.4+), spreading rendering across `availableParallelism() − 1` worker threads. It's 2.4× faster at 10k pages and uses 2.5× the memory, still well under Next's. It ran successfully on a real ~5k-page site on CodeBuild (8 vCPUs, 16 GiB).

## What got better

- **Client JS:** 56–78% less, depending on page type. Each page pays only for its own islands. Next ships the same bundle everywhere.
- **HTML:** about 50% smaller, because the RSC payload is gone. Island props add 0.5–2.6 KB, since they're already-processed props at the boundary.
- **Builds:** 2–5× faster and 2.5–4× less memory at default settings. The build-memory ceiling that blocked page-level work in the past (PR #1738) is much further away.
- **Less framework surface.** No Next workarounds such as `NoPrefetchLink`, `ScrollToTop`, the `webpack` `NormalModuleReplacementPlugin` for Algolia, or the not-found duplicate-render hack. Island lazy-loading already keeps Algolia out of pages that don't use it, with no special case.
- **Studio matches published output.** Island markup comes from the components, not from a build step, so wrapper-related quirks show up in Studio's preview too.

## What got harder

- **We own an islands runtime.** About 550 lines: `island.tsx`, `protocol.ts` and the `registry.ts` table (205) in components; `server.tsx` and `client.ts` (about 180), `react.ts` (about 60) and the dev-only `hydration-check.ts` (about 90) in the Astro app. Each file reads on its own, and both ends of the markup come from `protocol.ts`. Next did this for us.
- **Rules for component authors** (in `packages/components/src/islands/README.md`):
  - Wrap a component in `island(name, Component, { hydrate })` and register it in `islands` only if it needs React state or effects and server-rendered code renders it. An unregistered name doesn't typecheck, and the registry test fails if a module doesn't export the island under its name.
  - Island props must be plain JSON data (`Date`s become ISO strings). Server-rendered content can only be passed as `children`, which becomes a slot. Anything else, e.g. functions or React elements in other props, fails the build with the prop name.
  - React context doesn't cross into an island.
  - Read browser-only state (storage, user agent) after mount. Each island is its own React root, which doesn't repair a first render that differs from the server HTML.
  - No `first:` / `last:` / `only:` variants on an island's root element; set spacing from the parent.
- **Mistakes that fail silently, and how they're covered today:**
  - **An interactive component that isn't wrapped in `island()`** renders as static HTML: clicks do nothing, and nothing errors. Covered by code review and the islands README today; custom lint rules can be added if this turns out to bite (e.g. flag components using state/effect hooks that aren't islands or only rendered inside one).
  - **Browser-only state read during the first render** (sessionStorage, user agent) leaves stale UI after hydration. This happened with the notification banner and was fixed by reading after mount. `pnpm test:hydration` builds the site with `astro build --devOutput` and loads every page fresh and with the "dismissed" flags pre-set. It fails on hydration mismatches and on the dismissed banner being visible.
  - **`useId` under Preact.** `preact/compat` ignores `identifierPrefix`, restarts its ids at `P0-0` in every island, and its `useSyncExternalStore` ignores the server snapshot, so react-aria prefixed client ids with a random number. Since Preact keeps the server's attributes on hydration, elements mounted later pointed (`aria-*`) at ids that didn't exist. `src/islands/react.ts` fixes it by owning `useId` on both sides. It relies on the server and the browser calling `useId` in the same order, which the hydration check verifies (removing the override makes it fail on `id`).
  - **React-only props.** Props React 18 treats as attributes can mean something else to Preact, which sets DOM properties. With Preact on both sides these no longer cause hydration mismatches, but they still make the published site differ from Studio. HeroCarousel's `inert: ""` (React 18's workaround) became `inert = false` in Preact, so hidden slides became reachable after the first rotation; it's now `"true"`, with a rotation test. `suppressHydrationWarning` was written into the page as an attribute; it's gone.
- **Wrapper-element side effects.** `<isomer-island>` is `display: contents`, so layout ignores it. A parent's child-combinator rules (`parent > *`, `space-y-*`, `divide-*`) still skip island roots. No failures turned up in the coverage site, and Studio now shows the same behaviour as published sites.
- **Preact compatibility is ours to verify:**
  - react-aria and headlessui run on `preact/compat`, including their server rendering. They pass our hydration, parity and interaction tests on the coverage site, but React upstream doesn't support this setup.
  - Preact keeps the server HTML on hydration and only reports mismatched element types (in `preact/debug`), never text or attributes. So development builds run our own check (`src/islands/hydration-check.ts`): each island is rendered once more off-page and compared node by node with the server HTML. Planted element, text and attribute mismatches all fail `pnpm test:hydration`. React's development build, which this used to rely on, missed islands that render less than the server HTML.
  - Going back to React means removing the `preact/compat` aliases in `astro.config.ts` (measured with React islands: still −65%).
  - The server-build bundling list has to include every library that imports React; one left out would load real React in Node.
- **More, smaller JS requests:** about 20–50 files per page versus Next's 10, with dynamic-import chains. HTTP/2 handles the request count. Adding `modulepreload` hints for each page's islands would flatten the chain.
- **Next features re-implemented or dropped:**
  - `next/font`'s size-matched fallback font (possible CLS while Inter loads; the Inter preload is kept)
  - `next/script` loading strategies (scripts now run inline)
  - `ClientCopyright`'s client-side year (now set at build time; differs only if a site isn't rebuilt across New Year)
- **Dev mode differs slightly from the build.** `astro dev` worked (islands hydrate) with React in the browser, because Vite's dev pre-bundler bypassed the alias; it hasn't been re-checked since the server moved to Preact. It also needs `resolve.dedupe` for React, since `isomer-components` is a linked workspace package.
- **One Astro quirk to work around:** `resolve.alias` can't be set per Vite environment, so the Preact swap uses a small `resolveId` plugin, which also points `react` at `src/islands/react.ts`.

## Alternatives tried and not recommended

Every variant below was built from the same 60-page coverage fixture, checked with the same 19-test parity suite, and measured against the same Next build (`pnpm variants`; raw output is in `results/variants/*.md`). All variants pass 19/19.

- The Redact and whole-tree variants were measured on the earlier plugin-based islands. `git apply tooling/astro-migration-experiment/variants.patch` (plus the `@tanstack/redact` dependency) restores them on the current code.
- The `@astrojs/preact`, static-behaviours and import-rewriting-plugin variants were built on scratch branches or earlier commits of this branch.

### Initial JS (KB gzip, Δ vs Next)

| Page       |  Next | **Preact islands (recommended)** | Redact islands† | React islands | `@astrojs/preact` whole tree | Whole tree, React (PR #1751)† |
| ---------- | ----: | -------------------------------: | --------------: | ------------: | ---------------------------: | ----------------------------: |
| Homepage   | 278.9 |                  **86.3 (−69%)** |    106.6 (−62%) |  121.2 (−57%) |                  272.8 (−2%) |                  321.3 (+15%) |
| Content    | 278.9 |                  **62.0 (−78%)** |     81.8 (−71%) |   96.9 (−65%) |                  272.8 (−2%) |                  321.3 (+15%) |
| Collection | 278.9 |                 **122.6 (−56%)** |    145.6 (−48%) |  157.7 (−43%) |                  272.8 (−2%) |                  321.3 (+15%) |
| Article    | 278.9 |                  **62.0 (−78%)** |     81.8 (−71%) |   96.9 (−65%) |                  272.8 (−2%) |                  321.3 (+15%) |
| Database   | 278.9 |                  **84.5 (−70%)** |    105.7 (−62%) |  119.4 (−57%) |                  272.8 (−2%) |                  321.3 (+15%) |

† Measured on the earlier plugin-based islands, which were ~2.5 KB heavier per page (see below).

### Total first-load bytes (HTML + JS + CSS + fonts; KB gzip, Δ vs Next)

| Page       |  Next | **Preact islands** | Redact islands† | React islands | `@astrojs/preact` whole tree | Whole tree, React† |
| ---------- | ----: | -----------------: | --------------: | ------------: | ---------------------------: | -----------------: |
| Homepage   | 424.3 |   **188.6 (−56%)** |    210.2 (−50%) |  223.5 (−47%) |                 381.2 (−10%) |        427.5 (+1%) |
| Content    | 428.9 |   **165.8 (−61%)** |    186.8 (−56%) |  200.7 (−53%) |                 383.1 (−11%) |         429.4 (0%) |
| Collection | 421.7 |   **226.2 (−46%)** |    250.5 (−41%) |  261.3 (−38%) |                 379.2 (−10%) |        425.4 (+1%) |
| Article    | 419.1 |   **161.3 (−62%)** |    182.5 (−56%) |  196.2 (−53%) |                 378.5 (−10%) |        424.7 (+1%) |
| Database   | 418.9 |   **184.3 (−56%)** |    206.9 (−51%) |  219.2 (−48%) |                 378.5 (−10%) |        424.7 (+1%) |

### Why each one isn't recommended

| Alternative                                                                                                                                                             | Headline numbers                                                                                                                                                                                                                                             | Why not                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Build-time import rewriting** (a Vite plugin that wrapped every `"use client"` module imported by server code; tried, then replaced by `island()`)                    | JS **2.6 KB larger** per page than explicit islands (content/article 64.6 vs 62.0 KB; collection 128.2 vs 122.6 KB), 26 vs 20 JS files on an article page                                                                                                    | It made published output differ from what Studio renders (the markers only existed after the build) and needed metaprogramming: import rewriting, regex-parsing exports, scanning `dist` for directives, a virtual module. It also registered every client module as its own lazy chunk, splitting nested pieces (`MobileNavbarMenu`, `NavItem`, react-aria internals) into separate, worse-compressing files. |
| **`@astrojs/preact` with `compat: true`** (`<RenderEngine client:load />`, Preact SSR)                                                                                  | JS **−2%** (273 KB on every page); total **−10% to −11%**. Build at 1k pages: **48.4 s vs 17.8 s** for our islands build in the same session (2.7× slower). At 10k it was stopped after ~3,000 pages, running at ~195 ms/page (~30 min estimated, vs 110 s). | The official integration can only hydrate what an `.astro` file mounts, so for our single React tree it means whole-tree hydration. Preact makes that tree smaller than React's, but it still ships every component, and server rendering through the integration is much slower (our own Preact server rendering isn't).                                                                                      |
| **Whole-tree hydration with React** (`<RenderEngine client:load />`, the PR #1751 approach; `ISLANDS_MODE=whole-tree`)                                                  | JS **+15%** (321 KB on every page); total **0% to +1%**; HTML −50%                                                                                                                                                                                           | Ships and hydrates the whole component library, including Algolia, which Next stubs out. The HTML saving from dropping the RSC payload is cancelled out by the extra JS.                                                                                                                                                                                                                                       |
| **React islands** (no client runtime swap; `ISLANDS_RUNTIME=react` with `variants.patch`)                                                                               | JS **−43% to −65%**; total **−38% to −53%**                                                                                                                                                                                                                  | Works, and it's the safe fallback. It leaves ~35 KB per page (React + react-dom vs `preact/compat`) that Preact removes. The safe fallback if `preact/compat` causes problems.                                                                                                                                                                                                                                 |
| **TanStack Redact islands** (`ISLANDS_RUNTIME=redact` with `variants.patch`, `@tanstack/redact@0.3.1`)                                                                  | JS **−48% to −71%**; total **−41% to −56%**                                                                                                                                                                                                                  | Smaller than React (~−18 KB/page) but **~18 KB/page larger than Preact** on every page. It's v0 (first published 2026-04), and it declares a peer dependency on `next`. Revisit if it matures or ships a smaller preset that works here.                                                                                                                                                                       |
| **Static behaviours** (`BackToTopLink`, `Notification` and `ImageClient` as static HTML plus a ~45-line inline script using `data-isomer-*` hooks; tried, then removed) | Versus islands: JS **0.2–0.6 KB smaller** per page; total **0–0.7 KB larger** (the inline script is on every page)                                                                                                                                           | No measurable size win. It needed a second interaction model next to React, component rewrites (notification banner, dismiss button) and data-attribute conventions. Keeping these as islands keeps `packages/components` closer to `main`.                                                                                                                                                                    |
| **Astro single-process prerender** (Astro's default; `ASTRO_PARALLEL_PRERENDER=0` with `variants.patch`)                                                                | 100: **4.1 s / 1.4 GB**; 1k: 9.5 s / 1.6 GB; 10k: 83 s / **1.5 GB** (Next: 20.8 s / 3.9 GB, 27.2 s / 4.9 GB, 156 s / 6.0 GB)                                                                                                                                 | The memory-lean option. It uses the least memory at every size and is marginally faster at 100 pages, but parallel prerendering is 1.3× faster at 1k and 2.4× faster at 10k for 1.7–2.5× the memory (2.4 / 2.8 / 3.8 GB), which CodeBuild (8 vCPUs, 16 GiB) handles comfortably.                                                                                                                               |
| **A PostCSS selector rewrite for the island wrapper** (tried, then removed)                                                                                             | Fixed the failing screenshot checks (article page 64 px short, content page 24 px short, collection page 64 px tall)                                                                                                                                         | It fixed `first:` variants on island roots generically. Setting the spacing from the parent in the three affected places made it unnecessary, and a component-author rule replaces it.                                                                                                                                                                                                                         |

**Considered but not built:**

- **Rewriting layouts as `.astro` with `client:*` directives.** It would fork rendering from Studio's live in-browser preview. It also wouldn't ship less JS, since the same leaves hydrate either way.
- **Staying on Next and stripping the runtime after export.** Fragile across Next upgrades, and it can't remove the RSC model.
- **Staying on Next and cutting client boundaries.** Helps, but Next's runtime floor (~180 KB of framework, router and React) stays.

## Next levers (not done)

On an article page, the remaining ~62 KB is almost all the **Navbar island**, which is on every page:

| Part                                                               | KB gzip |
| ------------------------------------------------------------------ | ------: |
| Preact + islands runtime (entry chunk)                             |     ~13 |
| `tailwind-variants` + `tailwind-merge` (runtime class computation) |     ~19 |
| react-aria (focus ring, `FocusScope`, buttons)                     |    ~9.5 |
| Navbar code and icons                                              |     ~11 |

1. **Slim down the Navbar island.** It's the only island on most pages, so making it lighter (no runtime `tv()`/`twMerge`, CSS `:focus-visible` instead of react-aria's focus ring) cuts JS on every page. Estimate: article pages drop to about 25–35 KB.
2. **Compute `tv()`/`twMerge` class names at build time** for islands whose variants are known statically.
3. **Slim props at the island boundary** (for example `CollectionClient` items).
4. **Add `modulepreload` hints** for each page's island chunks.

## Not yet covered by the experiment

- **Publisher integration, partly done.** `tooling/build/scripts/publisher.sh` now builds `apps/template-astro`:
  - it installs `isomer-astro-template...` instead of `isomer-base-template...`
  - it moves the fetched site into the Astro app
  - it drops the `not-found.json` copy
  - it caches `_isomer/` (Astro's hashed assets) for a year instead of `_next/`

  The changed part was run locally from prebuild to RSS against the coverage fixture: 61 pages built and the collection RSS feed generated. It hasn't run on CodeBuild. `build.sh` (local builds) and the `bundle-size.yml` workflow still build the Next template. The environment variable names (`NEXT_PUBLIC_ISOMER_*`) were kept so the publisher's settings carry over.

- **Studio's local publish** (`.local-publish`) in dev mode.
- **Porting `apps/template`'s e2e test** (bundle pruning), plus running the parity suite against real exported sites. Synthetic fixtures make the _relative_ numbers valid; absolute sizes on real sites will differ.
- **Islands not exercised by the fixture:** search page / SearchSG, egazette Algolia, DGS live data, Polyglot, central notifications, and third-party widgets (Vica, Askgov, Zendesk, GTM, Clarity). They hydrate through the same path, and the loader test imports every one, but they haven't been seen working in a browser. The site notification (an island with a slot) was checked separately on both runtimes: shown, dismissed, and still hidden on the next page.
- **`sitemap.xml`, `robots.txt` and RSS** work. RSS feeds are generated by the publisher after the build, as before.

## Open questions

1. **CodeBuild sizing.** Parallel prerendering worked on a ~5k-page site with 8 vCPUs / 16 GiB. Still worth recording that build's time and peak memory against Next on the same site, and checking the largest sites.
2. **Preact risk.** Accept `preact/compat` for react-aria/headlessui islands, given the parity and interaction suite as the guard? Or start with React islands and switch later?
3. **Replace or run alongside?** The component changes break `apps/template`. A rollout would either switch all sites at once, or keep the Next-only workarounds until `apps/template` is retired.
4. **Navbar.** Slim it down (lever 1) as part of the migration, or as a follow-up?

## Reproducing

Run from `tooling/astro-migration-experiment/`. `apps/template` (Next) no longer builds from this branch, because the component changes drop Next-only directives. Build the Next reference from `main` (or commit `0df990a56`) on the same fixture first, then:

```bash
pnpm fixture:make fixtures/coverage 60 && pnpm fixture apply fixtures/coverage
(cd ../../apps/template-astro && pnpm build:template)    # Astro (Preact islands)
pnpm exec playwright test --project=astro                # 19 visual + interaction checks vs the Next screenshots
pnpm measure --files / /content/                         # first-load bytes + per-file JS breakdown
pnpm variants --reuse-next preact-islands                # -> results/variants/*.md (other variants need variants.patch)
pnpm test:hydration                                      # dev build: islands' hydration check + dismissed-banner checks
pnpm bench 100,1000,10000 3 next,astro         # -> results/bench-results.json
pnpm fixture restore                                     # put both apps' sample sites back
```

`variants` and `bench` apply and restore the fixture themselves.
