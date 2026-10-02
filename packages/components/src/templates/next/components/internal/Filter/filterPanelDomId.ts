/** DOM id for filter disclosure panels. `filter.id` may be a category label with spaces. */
export const getFilterPanelDomId = (
  filterId: string,
  variant: "sidebar" | "drawer",
): string => {
  const prefix =
    variant === "sidebar" ? "filter-panel" : "drawer-filter-panel"
  const suffix = filterId.trim().replace(/\s+/g, "-")
  return `${prefix}-${suffix}`
}
