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

interface MatchesCollectionSearchOptions {
  text: string
  searchValue?: string
  normalizedSearchValue?: string
}

export const matchesCollectionSearch = ({
  text,
  searchValue,
  normalizedSearchValue,
}: MatchesCollectionSearchOptions): boolean => {
  const normalizedSearch =
    normalizedSearchValue ??
    (searchValue !== undefined
      ? normalizeCollectionSearchText(searchValue)
      : "")
  if (normalizedSearch === "") {
    return true
  }
  return normalizeCollectionSearchText(text).includes(normalizedSearch)
}
