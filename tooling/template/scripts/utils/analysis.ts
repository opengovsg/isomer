/**
 * Site-wide union of layout and component types used across all pages (from
 * `analyze-sitemap.ts` output).
 */
export type SiteSitemapAnalysis = {
  layouts: string[]
  components: string[]
}

/**
 * Build used sets for AST pruning. Always includes `childrenpages` in components.
 */
export function collectSiteUsedItems(
  siteAnalysis: SiteSitemapAnalysis,
): { usedLayouts: Set<string>; usedComponents: Set<string> } {
  const usedLayouts = new Set(siteAnalysis.layouts)
  const usedComponents = new Set(siteAnalysis.components)
  usedComponents.add("childrenpages")
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
