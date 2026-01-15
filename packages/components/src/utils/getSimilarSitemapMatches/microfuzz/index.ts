import { createFuzzySearchImpl } from "./impl"

/**
 * Range of indices in a string, [index of first character, index of last character]
 */
export type Range = [number, number]

/**
 * List of character ranges in a string that should be highlighted
 */
export type HighlightRanges = Range[]

/**
 * List of fuzzy search matches (ranges of matching characters) for an item. This usually has one item, but can have more if `getText`
 * was used to return multiple strings for an item.
 */
export type FuzzyMatches = (HighlightRanges | null)[]

/**
 * Result of fuzzy matching `queryText` against an item.
 *
 * `score` - lower = better match (think "error level")
 */
export interface FuzzyResult<T> {
  item: T
  score: number
  matches: FuzzyMatches
}

export interface FuzzySearchOptions<T = unknown> {
  key?: string
  getText?: (item: T) => (string | null | undefined)[]
}

export type FuzzySearcher<T> = (query: string) => FuzzyResult<T>[]

/**
 * Creates a fuzzy search function that can be used to search `list` by passing `queryText` to it:
 *
 * ```js
 * const fuzzySearch = createFuzzySearch(list)
 * const results = fuzzySearch(queryText)
 * ```
 *
 * Only matching items will be returned, and they will be sorted by how well they match `queryText`.
 *
 * If `list` is an array of strings, it can be searched as-is. Otherwise pass to `options`:
 *
 * ```js
 * // search by `text` property
 * { key: 'text' }
 * // OR:
 * { getText: (item) => [item.text] }
 * // search by multiple properties:
 * { getText: (item) => [item.text, item.otherText] }
 * ```
 *
 * If you use React, use `useFuzzySearchList` hook for convenience.
 */
export const createFuzzySearch = <Element>(
  list: Element[],
  options?: FuzzySearchOptions<Element>,
): FuzzySearcher<Element> => createFuzzySearchImpl(list, options ?? {})
