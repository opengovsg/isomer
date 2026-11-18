import type { IsomerPageSchemaType } from "~/types"
import type { IsomerSitemap } from "~/types"
import DOMPurify from "isomorphic-dompurify"
import { readFileSync } from "node:fs"
import path from "node:path"
import { performance } from "node:perf_hooks"
import { fileURLToPath } from "node:url"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { RenderEngine } from "~/engine/render"
import { generateSiteConfig } from "~/stories/helpers/generateSiteConfig"

import { resetBuildCachesForTests } from "../buildCacheReset"
import { getReferenceLinkHref } from "../getReferenceLinkHref"
import { getSitemapAsArray } from "../getSitemapAsArray"

const runBenchmarks = process.env.BENCHMARK_BUILD_CACHES === "1"

describe.skipIf(!runBenchmarks)(
  "build cache benchmarks (BENCHMARK_BUILD_CACHES=1)",
  () => {
    it("logs sanitize + sitemap micro-benchmarks", () => {
      const root = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../../..",
      )
      const contentSchema = JSON.parse(
        readFileSync(
          path.join(
            root,
            "apps/studio/src/features/editing-experience/data/contentLayoutPreview.json",
          ),
          "utf8",
        ),
      ) as Omit<IsomerPageSchemaType, "site">

      let sanitizeCalls = 0
      const originalSanitize = DOMPurify.sanitize.bind(DOMPurify)
      DOMPurify.sanitize = (...args: Parameters<typeof originalSanitize>) => {
        sanitizeCalls++
        return originalSanitize(...args)
      }

      resetBuildCachesForTests()
      sanitizeCalls = 0
      const renderStarted = performance.now()
      const site = generateSiteConfig()
      renderToStaticMarkup(
        RenderEngine({
          ...contentSchema,
          site,
        }),
      )

      const sitemap: IsomerSitemap = {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: Array.from({ length: 200 }, (_, i) => ({
          id: String(i + 2),
          title: `Page ${i}`,
          permalink: `/page-${i}`,
          lastModified: "",
          layout: "content",
          summary: "",
        })),
      }

      const flattenUncached = (root: IsomerSitemap) => {
        const result: IsomerSitemap[] = []
        const traverse = (node: IsomerSitemap) => {
          if (node.permalink) {
            const { children: _children, ...rest } = node
            result.push(rest)
          }
          if (node.children && node.children.length > 0) {
            node.children.forEach((child) => traverse(child))
          }
        }
        traverse(root)
        return result
      }

      const uncachedStarted = performance.now()
      for (let i = 0; i < 200; i++) {
        flattenUncached(sitemap)
      }
      const uncachedFlattenMs = performance.now() - uncachedStarted

      resetBuildCachesForTests()
      let flattenPasses = 0
      const flattenStarted = performance.now()
      for (let i = 0; i < 200; i++) {
        getSitemapAsArray(sitemap)
        flattenPasses++
      }

      resetBuildCachesForTests()
      if (global.gc) global.gc()
      const heapBase = process.memoryUsage().heapUsed
      for (let i = 0; i < 1000; i++) {
        getReferenceLinkHref("https://www.gov.sg", [], undefined)
      }
      if (global.gc) global.gc()
      const heapAfter = process.memoryUsage().heapUsed

      const report = {
        contentPreview: {
          sanitizeCalls,
          renderMs: performance.now() - renderStarted,
        },
        flattenSameTree200x: {
          uncachedMs: uncachedFlattenMs,
          cachedMs: performance.now() - flattenStarted,
          flattenPasses,
          cachedArrayReused:
            getSitemapAsArray(sitemap) === getSitemapAsArray(sitemap),
        },
        hrefSanitizeHeapMb: (heapAfter - heapBase) / 1024 / 1024,
      }

      // eslint-disable-next-line no-console
      console.log(JSON.stringify(report, null, 2))

      expect(report.flattenSameTree200x.cachedArrayReused).toBe(true)
    })
  },
)
