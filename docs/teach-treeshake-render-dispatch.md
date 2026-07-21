# Treeshake render dispatch

Published Isomer sites used to ship every layout and component in the template bundle, even when a site never used them. This PR shrinks that bundle in two ways: it stubs out unused component and layout modules at build time, and it splits "heavy" layouts into their own Next.js routes so they do not ride along on every page.

---

## Before this PR

Every published page went through one catch-all route. That route imported one big render engine. The engine imported every layout dispatcher, and each dispatcher pulled in its full layout tree.

```
  sitemap.json
       |
       v
  app/[[...permalink]]/page.tsx   (one route for all pages)
       |
       v
  RenderEngine
       |
       +-- Article layout
       +-- Collection layout  -----> SearchableTable, filters, client state
       +-- Search layout    -----> Algolia / search UI
       +-- Database layout  -----> table rendering
       +-- Homepage, Content, Index, ...
```

A simple homepage still downloaded Collection, Search, and Database code because they lived in the same import graph.

---

## After this PR: two mechanisms

The fix is not one trick. It is two independent mechanisms that run at publish time.

```
  publish site
       |
       +--[1] schema scan --------------> stub unused components/layouts (webpack)
       |
       +--[2] sitemap scan -------------> codegen heavy layout routes (Next.js)
```

Mechanism 1 answers: "this site never uses Video, so do not ship Video."
Mechanism 2 answers: "Collection is heavy, so give it its own route instead of bundling it with Article pages."

---

## Mechanism 1: schema-driven stubbing

### What happens

Before `next build`, the publisher writes the site's page schemas into `tooling/template/schema/`. `next.config.mjs` walks every `*.json` file and records which layout types and component types appear.

```
  schema/about.json          layout: "content"
  schema/news.json           layout: "collection"
  schema/news/post-a.json    layout: "article", content: [{ type: "prose" }]
       |
       v
  scanSchemaUsage()
       |
       v
  layouts:   { content, collection, article }
  components: { prose, childrenpages }   <-- childrenpages auto-added for index pages
```

For every component and layout type in the target tables that does **not** appear in that scan, webpack gets a `NormalModuleReplacementPlugin` rule. The rule swaps the real module for `stubs/renderTargets.js`, which exports no-op components.

```
  renderComponent switch
       |
       case "video":
       |
       v
  import Video from ".../Video/index.js"
       |
       +-- site uses video?  --> real Video component
       |
       +-- site never uses video?  --> stubs/renderTargets.js (() => null)
```

The stub runs before webpack parses the real module. The real module's imports never enter the bundle.

### What can be stubbed

`treeshake.mjs` maintains two tables:

- `COMPONENT_TARGETS`: accordion, hero, map, video, etc.
- `LAYOUT_TARGETS`: article, collection, content, homepage, index, search, database

### What cannot be stubbed

Some modules are excluded because other code imports them directly, not only through the render dispatchers. `NormalModuleReplacementPlugin` matches by resolved file path. Stubbing one path would break unrelated importers.

Permanently excluded:

| Module | Reason |
|--------|--------|
| Infobar | NotFound layout imports it for styles |
| InfoCards | ChildrenPages imports it |
| ContactInformation | DynamicComponentList imports it |
| Prose | Callout, Accordion, Contentpic import it |
| NotFound layout | Every site can hit 404 even if no schema declares it |

Collection used to be on this list too. Its shared utils moved to `packages/components/src/utils/collection/`, so Collection can now be pruned like any other layout when unused.

### Egazette Algolia stub (related, same webpack hook)

Even before per-type stubbing, Search layout always imported `EgazetteAlgoliaSearch`, which pulled in `algoliasearch` and `react-instantsearch`. For sites that do not use egazette search, `next.config.mjs` replaces that one module with `stubs/EgazetteAlgoliaSearch.js` when `site.search.type !== "egazette-algolia"`.

---

## Mechanism 2: light/heavy route split

### The problem stubbing alone does not solve

Stubbing removes unused types, but a site that **does** have a Collection page still needs Collection code. Before this PR, that Collection code lived in the shared catch-all graph. Every Article page under `/news/post-a` still imported Collection's client bundle.

### The fix: separate routes per heavy landing

Three layouts are classified as "heavy": `collection`, `search`, `database`. They are listed in `tooling/template/lib/heavy-layout-types.json`.

At build time, `scripts/generate-layout-routes.mjs` reads `sitemap.json` and writes one Next.js page per heavy landing under `app/(heavy)/`:

```
  sitemap entry:  /news       layout: collection
                         |
                         v
  app/(heavy)/news/page.tsx   (generated, do not edit)
       |
       v
  makeCollectionPage("news")
       |
       v
  CollectionRenderEngine  -->  CollectionLayout only
```

```
  sitemap entry:  /search   layout: search
                         |
                         v
  app/(heavy)/search/page.tsx
       |
       v
  SearchRenderEngine  -->  SearchLayout only
```

Each heavy layout gets its own render engine file. Collection does not import Search. Search does not import Database. They are separate module graphs.

### The light catch-all keeps everything else

`app/[[...permalink]]/page.tsx` now uses `LightRenderEngine`, which only handles:

- article
- content
- homepage
- index
- notfound

It deliberately does **not** import Collection, Search, or Database.

```
  /about          -->  catch-all  -->  LightRenderEngine  -->  ContentLayoutSkeleton
  /news/post-a    -->  catch-all  -->  LightRenderEngine  -->  ArticleLayoutSkeleton
  /news           -->  (heavy)    -->  CollectionRenderEngine
  /search         -->  (heavy)    -->  SearchRenderEngine
```

### Avoiding duplicate HTML

Both the catch-all and the heavy routes read from the same sitemap. Without coordination, `output: "export"` would emit `/news/index.html` twice.

`excludeHeavyFromCatchAllUrls()` removes heavy landing permalinks from the catch-all's `generateStaticParams`. Article children like `/news/post-a` stay on the catch-all.

```
  generateStaticParams for catch-all:

  sitemap URLs:     /, /about, /news, /news/post-a, /search
                           |
                           v
  exclude heavy:    /, /about, /news/post-a
                    (drops /news and /search -- they have dedicated routes)
```

The test suite locks this: `getHeavyNormalizedPermalinks()` must match `getHeavyLayoutRoutes()` so exclusion and codegen cannot drift apart.

### Build command order

```
  pnpm run build:template
       |
       +-- generate:layout-routes   (writes app/(heavy)/*, manifest)
       |
       +-- next build --webpack     (runs stubbing + compiles all routes)
```

`publisher.sh` already calls `build:template`. The full-build test was updated to do the same instead of calling `next build` directly.

---

## The skeleton pattern (packages/components)

Heavy route splitting required a way to share layout structure without sharing layout imports. The answer is layout skeletons with an injected `renderPageContent` callback.

### Before

```tsx
// Article.tsx
export const ArticleLayout = (props) => (
  <ArticleLayoutSkeleton {...props} renderPageContent={renderPageContent} />
)
```

`renderPageContent` was hard-wired to the package's own `renderComponent` dispatcher, which imports every component.

### After

Skeletons live in their own folders (`ArticleSkeleton`, `ContentSkeleton`, etc.). They accept `renderPageContent` as a prop. The template supplies its own dispatcher.

```
  packages/components                tooling/template
  -------------------                ----------------
  ArticleLayoutSkeleton              lightComponents.tsx
       |                                  |
       |  renderPageContent prop          |  renderComponent (light set)
       |<---------------------------------|
       |
       v
  maps content blocks to components
```

`renderPageContentSkeleton` holds the shared logic: filter hidden childrenpages, lazy-load images after the first one, alternate infopic text direction. Both the package and the template call it. They just pass different `renderComponent` implementations.

The light catch-all uses skeleton layouts + `lightComponents.tsx`.
Database heavy routes use `DatabaseLayoutSkeleton` + `lightComponents.tsx` (table UI is in the skeleton, blocks are light).
Collection and Search heavy routes use the full layout components because they need their own client bundles.

---

## End-to-end publish flow

```
  Studio publish
       |
       v
  publisher.sh copies schema/, data/, sitemap.json into tooling/template/
       |
       v
  generate:layout-routes
       |-- reads sitemap
       |-- writes app/(heavy)/<permalink>/page.tsx per collection/search/database landing
       |-- writes .generated-heavy-routes.json (for cleanup on next run)
       |
       v
  next build
       |-- scanSchemaUsage() -> stub unused types via webpack
       |-- egazette stub if site.search.type !== "egazette-algolia"
       |-- compile catch-all (light graph) + heavy routes (per-layout graphs)
       |
       v
  out/  (static HTML per route)
```

---

## What to expect in bundle size

Measured on the template's default fixture (homepage + about page):

| Change | Gzip client JS |
|--------|----------------|
| Egazette Algolia stub alone | ~-16.6% |
| Per-type stubbing on top | ~-1.9% additional |

Build time was unchanged (~65s). The team treats this as a targeted hotfix, not the full optimization spec. Filter, Askgov, Vica, and Zendesk stubs remain out of scope.

---

## Key files

| File | Role |
|------|------|
| `tooling/template/treeshake.mjs` | Target tables, schema scan, stub regex builder |
| `tooling/template/next.config.mjs` | Wires webpack stubs at build time |
| `tooling/template/stubs/renderTargets.js` | No-op replacements for unused types |
| `tooling/template/lib/heavy-layout-types.json` | Single source of truth for heavy layouts |
| `tooling/template/scripts/generate-layout-routes.mjs` | Publish-time route codegen |
| `tooling/template/lib/heavyLayouts.ts` | Catch-all exclusion helpers |
| `tooling/template/render/lightLayout.tsx` | Light catch-all dispatcher |
| `tooling/template/render/lightComponents.tsx` | Light component dispatcher |
| `tooling/template/render/collectionLayout.tsx` | Collection-only engine |
| `tooling/template/render/searchLayout.tsx` | Search-only engine |
| `tooling/template/render/databaseLayout.tsx` | Database-only engine |
| `tooling/template/render/makeLayoutPage.tsx` | Shared factory for codegen'd pages |
| `packages/components/.../layouts/*Skeleton/` | Injectable layout shells |
| `packages/components/.../render/renderPageContentSkeleton.ts` | Shared content-block rendering logic |

---

## Tests that guard the design

| Test file | What it locks |
|-----------|---------------|
| `tooling/template/treeshake.test.ts` | Schema scan, unused dir detection, childrenpages on index pages, stub regex |
| `tooling/template/lib/heavyLayouts.test.ts` | Heavy route codegen, catch-all exclusion parity, permalink normalization |
| `packages/components/.../renderPageContentSkeleton.test.tsx` | Injectable `renderComponent` contract |
| `tooling/build/.../full-build.test.ts` | End-to-end publish uses `build:template` and emits heavy route HTML |

---

## Mental model for reviewers

Ask two questions about any page:

1. **Which route serves it?** Heavy landings (`/news`, `/search`) go through `app/(heavy)/`. Everything else goes through the catch-all.

2. **Which module graph compiles it?** The catch-all compiles the light graph. Each heavy route compiles only its own layout's graph. On top of that, webpack stubs remove individual component and layout modules the site's schemas never reference.

A homepage with no Collection page should not ship Collection, Search, or Database code. A site with a Collection should ship Collection only on `/news`, not on every article underneath it.
