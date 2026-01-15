const diacriticsRegex = /[\u0300-\u036f]/g
const regexŁ = /ł/g
const regexÑ = /ñ/g

/**
 * Normalizes text so that it's suitable to comparisons, sorting, search, etc. by:
 * - turning into lowercase
 * - removing diacritics
 * - removing extra whitespace
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(diacriticsRegex, "")
    .replace(regexŁ, "l")
    .replace(regexÑ, "n")
    .trim()
}
