export const normalizeCollectionSearchText = (text: string): string => {
  return (
    text
      // NFKC: map compatibility forms to their usual ASCII equivalents (e.g. fullwidth （FM） → (FM)).
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
