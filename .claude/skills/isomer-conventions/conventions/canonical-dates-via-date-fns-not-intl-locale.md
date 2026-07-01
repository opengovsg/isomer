---
title: Build canonical date/month strings with date-fns-tz, not an Intl locale trick
category: Dates & time
type: best-practice
---

## Pattern

When you need a **canonical** date/month string — one you will compare, sort,
store, or regex-match (e.g. `yyyy-MM` for "which month") — produce it with
`date-fns-tz`'s explicit format token in an explicit timezone:
`formatInTimeZone(date, "Asia/Singapore", "yyyy-MM")`.

Do **not** reach for an `Intl.DateTimeFormat` locale that happens to emit the
order you want (the `"en-CA"` → `"2026-06"` trick, `"en-GB"` for `"MMMM yyyy"`,
etc.). Locale-based formatting (`toLocaleDateString`, `Intl.DateTimeFormat`)
is for **human display only**, where adapting to the reader's locale is the
point — not for values the code itself parses or compares.

## Why

`Intl` output is driven by ICU/CLDR locale data, which is not guaranteed to be
present or stable:

- On a **minimal-ICU** runtime (`small-icu` Node, which bundles only `en-US`),
  `new Intl.DateTimeFormat("en-CA", …)` silently falls back to `en-US` and emits
  `"06/2026"` instead of `"2026-06"`. Every downstream `MONTH_REGEX` match and
  `month <= currentMonth` comparison then breaks — silently, with no type error.
- The intent is opaque: "Canadian English" is a non-obvious stand-in for "ISO
  month order". A reader can't tell the locale was chosen for its *format*.

`formatInTimeZone` with an explicit token is deterministic across every runtime
(server in any zone, or the browser), self-documents the exact shape, and keeps
the zero-padded result sorting lexicographically === chronologically.

## Bad

```ts
// Locale chosen purely because it emits yyyy-MM order — breaks on small-ICU.
const currentMonth = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Singapore",
  year: "numeric",
  month: "2-digit",
}).format(new Date()) // "2026-06"  …or "06/2026" if ICU data is missing

if (requestedMonth > currentMonth) throwFutureError()
```

## Good

```ts
import { formatInTimeZone } from "date-fns-tz"

const SINGAPORE_TIME_ZONE = "Asia/Singapore"

const currentMonth = formatInTimeZone(new Date(), SINGAPORE_TIME_ZONE, "yyyy-MM")

if (requestedMonth > currentMonth) throwFutureError()
```

`toLocaleDateString`/`Intl` are still fine for **display** — e.g.
`apps/studio/src/utils/formatDate.ts` and the gazette publish-date label
(`apps/studio/src/server/modules/gazette/gazette.service.ts:400`) format dates
for humans, not for comparison, so they are not violations.

## How to detect

Grep for an `Intl.DateTimeFormat(...)`/`toLocaleDateString(...)` result that is
then compared, stored, regex-matched, or used as a map key (rather than rendered
to the user):

```bash
grep -rn 'Intl.DateTimeFormat\|toLocaleDateString' apps/studio/src
```

A locale string picked for its *separator/order* (`"en-CA"`, `"sv-SE"`, …)
rather than for the reader's locale is the tell. The blessed pattern is used in
the audit log export feature (`apps/studio/src/schemas/audit.ts`
`getCurrentSingaporeMonth`). Related: [Document every regex, and keep the
comment correct](document-regex-with-verified-comments.md).
