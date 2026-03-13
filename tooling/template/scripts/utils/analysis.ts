export type SitemapAnalysisEntry = {
  layout: string
  components: string[]
}

export type SitemapAnalysis = Record<string, SitemapAnalysisEntry>

/**
 * Collect used layout and component types for a route from sitemap analysis.
 */
export function collectUsedItems(
  sitemapAnalysis: SitemapAnalysis,
  routePath: string,
): { usedLayouts: Set<string>; usedComponents: Set<string> } {
  const usedLayouts = new Set<string>()
  const usedComponents = new Set<string>()

  const pageData = sitemapAnalysis[routePath]
  if (pageData) {
    usedLayouts.add(pageData.layout)
    pageData.components.forEach((comp) => usedComponents.add(comp))
  }

  return { usedLayouts, usedComponents }
}

/**
 * Extract unique component types from schema content array.
 */
export function extractComponents(content: unknown): string[] {
  if (!Array.isArray(content)) {
    return []
  }

  const components = content
    .filter(
      (item): item is { type: string } =>
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        typeof (item as { type?: unknown }).type === "string",
    )
    .map((item) => item.type)

  return [...new Set(components)]
}
