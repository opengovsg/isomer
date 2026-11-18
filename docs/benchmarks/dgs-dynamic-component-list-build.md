# Benchmark: `DynamicComponentList` build-time fix

## Problem

A site using DGS-driven `DynamicComponentList` heavily took ~8 min to build
8.7k pages, while a site without it took ~4 min for 11k pages. Adding CPU/RAM
barely helped.

`DynamicComponentList` was a `"use client"` component receiving the full
`site` prop from `renderComponent`. `site` contains the whole sitemap twice
(`siteMap` and `siteMapArray`), and Next serializes every client component
prop into the RSC payload of each page. So each page grew with the size of
the site, making total build output O(pages²).

It also logged `Failed to parse JSON: [dgs:...]` twice per page, because the
loading-state placeholder rendered `DgsTransformedContactInformation` with an
`undefined` record.

## Fix

- `DynamicComponentList` is now a server wrapper that forwards only
  `dataSource`, `component`, `layout` and `headingLevel` to the new
  `DynamicComponentListClient` (same pattern as `DynamicDataBanner`).
- Loading placeholder rows use `{}` as the record instead of `undefined`.

## Method

- `next build --webpack` of `apps/template` on an Apple Silicon Mac, single run
  per data point.
- Synthetic site: N content pages in folders of 100, each page with one
  `dynamiccomponentlist` and one DGS `contactinformation` block.
- Per-page HTML is `out/folder-0/page-1/index.html`; total HTML is the sum of
  all `*.html` in `out/`.

## Results

Before → after (delta).

| Pages | Build time              | Per-page HTML                    | Total HTML                     |
| ----- | ----------------------- | -------------------------------- | ------------------------------ |
| 100   | 23s → 32s (+9s, +39%)   | 420KB → 384KB (−36KB, −9%)       | 42.9MB → 39.3MB (−3.6MB, −8%)  |
| 1,000 | 42s → 31s (−11s, −26%)  | 718KB → 384KB (−334KB, −47%)     | 710MB → 381MB (−329MB, −46%)   |
| 3,000 | 129s → 63s (−66s, −51%) | 1,396KB → 384KB (−1,012KB, −72%) | 4.1GB → 1.1GB (−2.9GB, −72%)   |
| 5,000 | not run → 81s           | ~2.1MB → 384KB (~−1.7MB, ~−82%)  | ~10GB → 1.9GB (~−8.1GB, ~−81%) |

- Before the fix, each page grew by ~0.33KB per page in the site. After the
  fix, per-page size is constant and build time scales linearly.
- The 5,000-page "before" values are extrapolated: that build needed ~35–40GB
  of disk, more than was available.
- At 100 pages the time difference is noise; each build spends a fixed
  ~20–25s compiling.
- `Failed to parse JSON` warnings went from 2 per page to 0.
