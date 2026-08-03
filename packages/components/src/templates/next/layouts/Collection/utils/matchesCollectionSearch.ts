const normalizeCollectionSearchText = (text: string): string => {
  return (
    text
      .normalize("NFKC")
      // Format characters (ZWSP, soft hyphens, BOM, etc.) pasted from PDFs/Word.
      .replace(/\p{Cf}/gu, "")
      // All Unicode whitespace (NBSP, ideographic space, etc.) → regular spaces.
      .replace(/\p{White_Space}+/gu, " ")
      .trim()
      .toLowerCase()
      // Treat optional whitespace around parentheses as equivalent, e.g.
      // "MANAGEMENT (FM)" vs "MANAGEMENT(FM)".
      .replace(/\s*([()])\s*/g, "$1")
  )
}

/** Normalizes a user search query once per filter pass; reuse via `matchesCollectionSearch`. */
export const prepareCollectionSearchQuery = (searchValue: string): string => {
  return normalizeCollectionSearchText(searchValue)
}

export const matchesCollectionSearch = (
  text: string,
  searchValue: string,
  preparedSearchQuery?: string,
): boolean => {
  const normalizedSearch =
    preparedSearchQuery ?? normalizeCollectionSearchText(searchValue)
  if (normalizedSearch === "") {
    return true
  }
  return normalizeCollectionSearchText(text).includes(normalizedSearch)
}
