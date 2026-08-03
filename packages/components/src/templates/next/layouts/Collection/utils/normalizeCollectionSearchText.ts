// Unicode whitespace and invisible characters that can appear in titles pasted from
// PDFs or Word — they look identical on screen but break String.includes().
const UNICODE_WHITESPACE_AND_INVISIBLE =
  /[\u00a0\u2000-\u200b\u202f\u205f\u3000\ufeff]/g

/**
 * Normalizes collection item titles/descriptions and user search input so that
 * visually equivalent text matches during substring search.
 */
export const normalizeCollectionSearchText = (text: string): string => {
  return (
    text
      .normalize("NFKC")
      .replace(/\u00ad/g, "")
      .replace(UNICODE_WHITESPACE_AND_INVISIBLE, " ")
      .replace(/\s+/g, " ")
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
