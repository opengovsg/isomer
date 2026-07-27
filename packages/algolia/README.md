# @isomer/algolia

Shared Algolia search-index client for Isomer. Deliberately pinned to algoliasearch **v4** — the legacy egazette integration uses the v4 client API (`algoliasearch(appId, key).initIndex(name)`, `index.saveObjects`, `index.deleteBy`). Do not upgrade to v5 without reviewing egazette compatibility.

This package does **not** import application env modules — callers pass validated configuration.

## API

- **`createAlgoliaClient({ appId, apiKey, indexName })`** — returns a client bound to a single index:
  - `saveObjectsToSearchIndex(objects)` — upsert records; each record must carry an `objectID`. Re-saving the same `objectID` overwrites the existing record cleanly.
  - `deleteObjectsFromSearchIndexByFilter(filters)` — delete all records matching an Algolia filter expression. Any attribute used in the filter (e.g. `objectGroup`) must be registered as `filterOnly(...)` in `attributesForFaceting` in the Algolia dashboard, otherwise `deleteBy` silently matches nothing.

## Usage in Studio (Next.js)

Keep a thin adapter in the app: read validated env and instantiate the client once. See `apps/studio/src/lib/algolia.ts`.
