# Generate collection RSS feeds from a standalone tooling script that reuses the components package

Collection RSS feeds are produced by a standalone `tsx` script under `tooling/build/scripts/rss/` (mirroring the `publishing/` redirects script) that depends on `@opengovsg/isomer-components` (`workspace:*`) and reuses `getCollectionItems` / `getReferenceLinkHref`, writing one `rss.xml` per Collection Index into `out/` after `build:template`. We chose reuse-via-dependency because the feed's item set and item links must never drift from what the collection page renders, and the only way to guarantee that is to call the same code.

## Considered Options

- **Next route / metadata file (like `app/sitemap.ts` and `app/robots.ts`)** — idiomatic and drift-free by construction, but per-collection feeds collide with the site's `app/[[...permalink]]` catch-all route and hit `output: "export"` route-handler constraints. Rejected: too much routing friction for the shape we need.
- **Self-contained script that duplicates the collection walk** (the pure `publishing/`-style pattern) — no dependency on the render library, own tests, matches the redirects precedent exactly. Rejected: reimplementing the item filter, sort, and especially `getReferenceLinkHref`'s `[resource:…]` / asset-URL resolution reintroduces drift between the feed and the rendered page, which we explicitly ruled out.
- **Builder in the package + thin copied script** (put `getRssXml` next to `getSitemapXml`/`getRobotsTxt`, call it from a `generate-sitemap.js`-style script) — drift-free, conceptually consistent. Viable runner-up; rejected only because we preferred the isolated, independently-tested `tsx` package shape of `publishing/`.
- **Standalone script reusing the package (chosen)** — redirects-style isolated package with its own tests, but reuses `getCollectionItems` via a `workspace:*` dependency instead of copying it.

## Consequences

- **Unusual dependency edge:** a `tooling/build` script now depends on the render component library. Precedent exists (`publishing/` depends on `@isomer/db: workspace:*`), but this is the first tooling dependency on `@opengovsg/isomer-components`.
- **Barrel-import hazard:** importing from the package root pulls React client components, which can break under `tsx`/Node. The script must deep-import the pure utilities (or the package must expose a Node-safe subpath), verified at build time.
- **Build sequencing:** the script must run after `pnpm run build:template` (so `out/` exists) and relies on the components workspace package having been built earlier in `publisher.sh`.
- **Anti-drift is load-bearing:** a test asserts the feed's item set equals `getCollectionItems` output. If that reuse is ever replaced by duplication, this guarantee is lost.
