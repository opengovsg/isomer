---
title: Prefer Kysely's expression builder over raw sql for supported functions
category: Database
type: best-practice
---

## Pattern

When Kysely's expression builder has a typed equivalent for a SQL function,
use it instead of a raw `` sql`...` `` template. The common case is
`COALESCE` over columns:

```ts
.select([
  (eb) =>
    eb.fn.coalesce("DraftBlob.content", "PublishedBlob.content").as("content"),
])
```

Raw `` sql`...` `` remains fine where the builder has no equivalent — e.g.
JSON path extraction (`content->'page'->>'description'`) or `regexp_replace`,
as in `apps/studio/src/server/modules/gazette/gazette.router.ts:135,147`.

## Why

The builder validates column references against the query's joined tables at
compile time and infers the result type — a renamed column or alias breaks the
build instead of failing (or silently misbehaving) at runtime. Raw strings
also dodge Kysely's identifier quoting, so they're easier to get subtly wrong.

## Bad

```ts
.select([
  sql<unknown>`COALESCE("PublishedBlob"."content", "DraftBlob"."content")`.as(
    "content",
  ),
])
```

## Good

See `apps/studio/src/server/modules/gazette/gazette.router.ts:158-161`:

```ts
.select([
  (eb) =>
    eb.fn.coalesce("DraftBlob.content", "PublishedBlob.content").as("content"),
])
```

## How to detect

Flag `` sql` `` templates whose contents are a single function call over plain
column references (`COALESCE`, `MAX`, `COUNT`, `SUM`, ...) with no JSON
operators or Postgres-only functions — each has an `eb.fn` equivalent.
