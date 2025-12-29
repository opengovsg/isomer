import { describe, it } from "vitest"

import { getSimilarSitemapMatches } from "../getSimilarSitemapMatches"

// Helper to generate realistic sitemap entries
const generateSitemapEntry = (index: number) => {
  const categories = [
    "about",
    "services",
    "contact",
    "news",
    "events",
    "resources",
    "publications",
    "careers",
    "policies",
    "programmes",
  ]
  const subcategories = [
    "overview",
    "details",
    "faq",
    "guidelines",
    "updates",
    "reports",
    "forms",
    "apply",
    "register",
    "feedback",
  ]
  const topics = [
    "health",
    "education",
    "finance",
    "transport",
    "housing",
    "environment",
    "technology",
    "community",
    "business",
    "security",
  ]

  const category = categories[index % categories.length] ?? "about"
  const subcategory =
    subcategories[Math.floor(index / 10) % subcategories.length] ?? "overview"
  const topic = topics[Math.floor(index / 100) % topics.length] ?? "health"
  const pageNum = Math.floor(index / 1000)

  return {
    permalink: `/${category}/${topic}/${subcategory}/page-${index}${pageNum > 0 ? `-part-${pageNum}` : ""}`,
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} - ${topic} ${subcategory} Page ${index}`,
  }
}

const generateSitemap = (size: number) => {
  return Array.from({ length: size }, (_, i) => generateSitemapEntry(i))
}

// Measure execution time with multiple runs for accuracy
const measureTime = (
  fn: () => void,
  runs = 100,
): { avg: number; min: number; max: number } => {
  const times: number[] = []

  // Warmup run
  fn()

  for (let i = 0; i < runs; i++) {
    const start = performance.now()
    fn()
    const end = performance.now()
    times.push(end - start)
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length
  const min = Math.min(...times)
  const max = Math.max(...times)

  return { avg, min, max }
}

const formatTime = (ms: number): string => {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)} µs`
  }
  return `${ms.toFixed(2)} ms`
}

// Pre-generate sitemaps
const sitemaps = {
  100: generateSitemap(100),
  500: generateSitemap(500),
  1000: generateSitemap(1000),
  2000: generateSitemap(2000),
  5000: generateSitemap(5000),
  10000: generateSitemap(10000),
}

const queries = {
  simple: "services",
  complex: "resources/education/guidelines",
  nonexistent: "xyz-nonexistent-page",
  typo: "servics",
}

describe("getSimilarSitemapMatches - Exact Timing", () => {
  it("measures exact execution times for different sitemap sizes", () => {
    console.log("\n" + "=".repeat(80))
    console.log("PERFORMANCE BENCHMARK: getSimilarSitemapMatches")
    console.log("=".repeat(80))

    const sizes = [100, 500, 1000, 2000, 5000, 10000] as const

    for (const [queryName, query] of Object.entries(queries)) {
      console.log(`\n📊 Query type: "${queryName}" (query: "${query}")`)
      console.log("-".repeat(60))
      console.log(
        "Size".padEnd(10) +
          "Avg".padEnd(15) +
          "Min".padEnd(15) +
          "Max".padEnd(15),
      )
      console.log("-".repeat(60))

      for (const size of sizes) {
        const sitemap = sitemaps[size]
        const result = measureTime(() => {
          getSimilarSitemapMatches({
            sitemap,
            query,
            numberOfResults: 3,
          })
        })

        console.log(
          `${size.toLocaleString().padEnd(10)}${formatTime(result.avg).padEnd(15)}${formatTime(result.min).padEnd(15)}${formatTime(result.max).padEnd(15)}`,
        )
      }
    }

    console.log("\n" + "=".repeat(80))
    console.log("END OF BENCHMARK")
    console.log("=".repeat(80) + "\n")
  })

  it("measures timing with different numberOfResults", () => {
    console.log("\n" + "=".repeat(80))
    console.log("PERFORMANCE: Varying numberOfResults (1000 entries)")
    console.log("=".repeat(80))

    const sitemap = sitemaps[1000]
    const resultCounts = [3, 5, 10, 20, 50]

    console.log("-".repeat(50))
    console.log("Results".padEnd(15) + "Avg".padEnd(15) + "Min".padEnd(15))
    console.log("-".repeat(50))

    for (const count of resultCounts) {
      const result = measureTime(() => {
        getSimilarSitemapMatches({
          sitemap,
          query: queries.simple,
          numberOfResults: count,
        })
      })

      console.log(
        `${count.toString().padEnd(15)}${formatTime(result.avg).padEnd(15)}${formatTime(result.min).padEnd(15)}`,
      )
    }

    console.log("\n")
  })
})
