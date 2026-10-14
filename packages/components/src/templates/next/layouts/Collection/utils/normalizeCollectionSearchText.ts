// Explicit code-point ranges instead of \p{Cf} / \p{White_Space} — Unicode property
// escapes in regex require Firefox 78+, but browserslist targets Firefox >= 67.
const FORMAT_CHARS = /[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g
// ECMAScript \s matches the Unicode White_Space set used in practice (NBSP,
// ideographic space, etc.) except U+0085 NEL, which we include explicitly.
const WHITESPACE = /[\s\u0085]+/g

export const normalizeCollectionSearchText = (text: string): string => {
  return (
    text
      // NFKC: map compatibility forms to their usual ASCII equivalents (e.g. fullwidth （FM） → (FM)).
      .normalize("NFKC")
      // Format characters (ZWSP, soft hyphens, BOM, bidi controls, etc.) pasted from PDFs/Word.
      .replace(FORMAT_CHARS, "")
      .replace(WHITESPACE, " ")
      .trim()
      .toLowerCase()
      // Treat optional whitespace around parentheses as equivalent, e.g.
      // "MANAGEMENT (FM)" vs "MANAGEMENT(FM)".
      .replace(/\s*([()])\s*/g, "$1")
  )
}
