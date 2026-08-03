/**
 * Normalizes collection item titles/descriptions and user search input so that
 * visually equivalent text matches during substring search.
 */
export const normalizeCollectionSearchText = (text: string): string => {
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

export const matchesCollectionSearch = (
  text: string,
  searchValue: string,
): boolean => {
  return normalizeCollectionSearchText(text).includes(
    normalizeCollectionSearchText(searchValue),
  )
}
