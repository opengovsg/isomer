# rss

Generates RSS 2.0 feeds for every collection during the static site build.

Run after `build:template` (so `out/` exists), from `tooling/template`:

```sh
SITEMAP_JSON=<abs path to sitemap.json> \
CONFIG_JSON=<abs path to data/config.json> \
OUT_DIR=<abs path to out> \
NEXT_PUBLIC_ASSETS_BASE_URL=<cdn base url> \
pnpm run start
```

For each Collection Index it writes `out/<permalink>/rss.xml`. The item set is
sourced from `getCollectionItems` in `@opengovsg/isomer-components` (via the
React-free `build-utils` entrypoint) so the feed never drifts from the rendered
collection page — see
`docs/adr/0004-rss-feeds-via-standalone-script-reusing-components.md`.
