# Generate collection RSS feeds from publishing tooling that reuses the components package

Collection RSS feeds are produced by `tooling/build/scripts/publishing/rss.ts`, which reuses `getCollectionItems` / `getReferenceLinkHref` from `@opengovsg/isomer-components` and writes one `rss.xml` per Collection Index into `out/` after `build:template`. Reusing the rendering utilities prevents the feed's item set and links from drifting from the collection page.

## Considered Options

- **Next route / metadata file (like `app/sitemap.ts` and `app/robots.ts`)** — idiomatic and drift-free by construction, but per-collection feeds collide with the site's `app/[[...permalink]]` catch-all route and hit `output: "export"` route-handler constraints. Rejected: too much routing friction for the shape we need.
- **Self-contained script that duplicates the collection walk** (the pure `publishing/`-style pattern) — no dependency on the render library, own tests, matches the redirects precedent exactly. Rejected: reimplementing the item filter, sort, and especially `getReferenceLinkHref`'s `[resource:…]` / asset-URL resolution reintroduces drift between the feed and the rendered page, which we explicitly ruled out.
- **Builder in the package + thin copied script** (put `getRssXml` next to `getSitemapXml`/`getRobotsTxt`, call it from a `generate-sitemap.js`-style script) — drift-free, but makes the rendering package own filesystem orchestration.
- **Publishing script reusing the package (chosen)** — uses the existing build-time workspace and reuses `getCollectionItems` via a `workspace:*` dependency instead of copying it.

## Consequences

- **Unusual dependency edge:** a `tooling/build` script now depends on the render component library. Precedent exists (`publishing/` depends on `@isomer/db: workspace:*`), but this is the first tooling dependency on `@opengovsg/isomer-components`.
- **Barrel-import hazard:** importing from the package root pulls React client components, which can break under `tsx`/Node. The script must deep-import the pure utilities (or the package must expose a Node-safe subpath), verified at build time.
- **Build sequencing:** the script runs after `pnpm run build:template` (so `out/` exists) and uses the components package built earlier in `publisher.sh`.
- **Anti-drift is load-bearing:** a test asserts the feed's item set equals `getCollectionItems` output. If that reuse is ever replaced by duplication, this guarantee is lost.
