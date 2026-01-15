import type {
  FuzzyMatches,
  FuzzyResult,
  FuzzySearcher,
  FuzzySearchOptions,
  HighlightRanges,
  Range,
} from "./index"
import { normalizeText } from "./normalizeText"

const { MAX_SAFE_INTEGER } = Number

const sortByScore = <T>(a: FuzzyResult<T>, b: FuzzyResult<T>): number =>
  a.score - b.score
const sortRangeTuple = (a: Range, b: Range): number => a[0] - b[0]

const validWordBoundaries = new Set("  []()-–—'\"“”".split(""))

function isValidWordBoundary(character: string): boolean {
  return validWordBoundaries.has(character)
}

function matchesFuzzily(
  item: string,
  normalizedItem: string,
  itemWords: Set<string>,
  query: string,
  normalizedQuery: string,
  queryWords: string[],
): [number, HighlightRanges] | null {
  // quick matches
  if (item === query) {
    return [0, [[0, item.length - 1]]]
  }

  const queryLen = query.length
  const normalizedItemLen = normalizedItem.length
  const normalizedQueryLen = normalizedQuery.length

  if (normalizedItem === normalizedQuery) {
    return [0.1, [[0, normalizedItemLen - 1]]]
  } else if (normalizedItem.startsWith(normalizedQuery)) {
    return [0.5, [[0, normalizedQueryLen - 1]]]
  }

  // contains query (starting at word boundary)
  // NOTE: It would be more correct to do a regex search, than to check previous character, since
  // it could be that the item found does _not_ start at a word boundary, but there is another match
  // that does. However, this is faster and should rarely be a problem, while fuzzy search will still
  // find other matches (just ranked lower)
  const exactContainsIdx = item.indexOf(query)
  if (
    exactContainsIdx > -1 &&
    isValidWordBoundary(item[exactContainsIdx - 1] ?? "")
  ) {
    return [0.9, [[exactContainsIdx, exactContainsIdx + queryLen - 1]]]
  }

  const containsIdx = normalizedItem.indexOf(normalizedQuery)
  if (
    containsIdx > -1 &&
    isValidWordBoundary(normalizedItem[containsIdx - 1] ?? "")
  ) {
    return [1, [[containsIdx, containsIdx + queryLen - 1]]]
  }

  // Match by words included
  // Score: 1.5 + 0.2*words (so that it's better than two non-word chunks)
  const queryWordCount = queryWords.length
  if (queryWordCount > 1) {
    if (queryWords.every((word) => itemWords.has(word))) {
      const score = 1.5 + queryWordCount * 0.2
      return [
        score,
        queryWords
          .map((word) => {
            const wordIndex = normalizedItem.indexOf(word)
            return [wordIndex, wordIndex + word.length - 1] as Range
          })
          .sort(sortRangeTuple),
      ]
    }
  }

  // Contains query (at any position)
  if (containsIdx > -1) {
    return [2, [[containsIdx, containsIdx + queryLen - 1]]]
  }

  return aggressiveFuzzyMatch(normalizedItem, normalizedQuery)
}

export function aggressiveFuzzyMatch(
  normalizedItem: string,
  normalizedQuery: string,
): [number, HighlightRanges] | null {
  const normalizedItemLen = normalizedItem.length
  const normalizedQueryLen = normalizedQuery.length

  let queryIdx = 0
  let queryChar = normalizedQuery[queryIdx]
  const indices: HighlightRanges = []
  let chunkFirstIdx = -1
  let chunkLastIdx = -2
  // TODO: May improve performance by early exits (less to go than remaining query)
  // and by using .indexOf(x, fromIndex)
  for (let itemIdx = 0; itemIdx < normalizedItemLen; itemIdx += 1) {
    // DEBUG:
    // console.log(`${itemIdx} (${normalizedItem[itemIdx]}), ${queryIdx} (${queryChar}), ${chunkLastIdx}, score: ${consecutiveChunks}`)
    if (normalizedItem[itemIdx] === queryChar) {
      if (itemIdx !== chunkLastIdx + 1) {
        if (chunkFirstIdx >= 0) {
          indices.push([chunkFirstIdx, chunkLastIdx])
        }
        chunkFirstIdx = itemIdx
      }
      chunkLastIdx = itemIdx
      queryIdx += 1
      if (queryIdx === normalizedQueryLen) {
        indices.push([chunkFirstIdx, chunkLastIdx])
        return scoreConsecutiveLetters(indices, normalizedItem)
      }
      queryChar = normalizedQuery[queryIdx]
    }
  }

  return null
}

function scoreConsecutiveLetters(
  indices: HighlightRanges,
  normalizedItem: string,
): [number, HighlightRanges] | null {
  // Score: 2 + sum of chunk scores
  // Chunk scores:
  // - 0.2 for a full word
  // - 0.4 for chunk starting at beginning of word
  // - 0.8 for chunk in the middle of the word (if >=3 characters)
  // - 1.6 for chunk in the middle of the word (if 1 or 2 characters)
  let score = 2

  indices.forEach(([firstIdx, lastIdx]) => {
    const chunkLength = lastIdx - firstIdx + 1
    const isStartOfWord =
      firstIdx === 0 ||
      normalizedItem[firstIdx] === " " ||
      normalizedItem[firstIdx - 1] === " "
    const isEndOfWord =
      lastIdx === normalizedItem.length - 1 ||
      normalizedItem[lastIdx] === " " ||
      normalizedItem[lastIdx + 1] === " "
    const isFullWord = isStartOfWord && isEndOfWord
    // DEBUG:
    // console.log({
    //   firstIdx,
    //   lastIdx,
    //   chunkLength,
    //   isStartOfWord,
    //   isEndOfWord,
    //   isFullWord,
    //   before: normalizedItem[firstIdx - 1],
    //   after: normalizedItem[lastIdx + 1],
    // })
    if (isFullWord) {
      score += 0.2
    } else if (isStartOfWord) {
      score += 0.4
    } else if (chunkLength >= 3) {
      score += 0.8
    } else {
      score += 1.6
    }
  })

  return [score, indices]
}

export function createFuzzySearchImpl<Element>(
  collection: Element[],
  options: FuzzySearchOptions<Element> = {},
): FuzzySearcher<Element> {
  const { getText } = options

  const preprocessedCollection: [Element, [string, string, Set<string>][]][] =
    collection.map((element: Element) => {
      let texts: (string | null | undefined)[]
      if (getText) {
        texts = getText(element)
      } else {
        const text: string = options.key
          ? ((element as Record<string, unknown>)[options.key] as string)
          : (element as unknown as string)
        texts = [text]
      }

      const preprocessedTexts: [string, string, Set<string>][] = texts
        .filter((text): text is string => text != null)
        .map((text) => {
          const item = text || ""
          const normalizedItem = normalizeText(item)
          const itemWords = new Set<string>(normalizedItem.split(" "))

          return [item, normalizedItem, itemWords] as [
            string,
            string,
            Set<string>,
          ]
        })

      return [element, preprocessedTexts]
    })

  return (query: string) => {
    // DEBUG
    // const b4 = Date.now()
    const results: FuzzyResult<Element>[] = []
    const normalizedQuery = normalizeText(query)
    const queryWords = normalizedQuery.split(" ")

    if (!normalizedQuery.length) {
      return []
    }

    preprocessedCollection.forEach(([element, texts]) => {
      let bestScore = MAX_SAFE_INTEGER
      const matches: FuzzyMatches = []
      for (let i = 0, len = texts.length; i < len; i += 1) {
        const textTuple = texts[i]
        if (!textTuple) {
          matches.push(null)
          continue
        }
        const [item, normalizedItem, itemWords] = textTuple
        const result = matchesFuzzily(
          item,
          normalizedItem,
          itemWords,
          query,
          normalizedQuery,
          queryWords,
        )
        if (result) {
          bestScore = Math.min(bestScore, result[0]) // take the lowest score of any match
          matches.push(result[1])
        } else {
          matches.push(null)
        }
      }
      if (bestScore < MAX_SAFE_INTEGER) {
        results.push({ item: element, score: bestScore, matches })
      }
    })

    results.sort(sortByScore)

    // DEBUG
    // console.log(`fuzzy search complete in ${Date.now() - b4} ms`)

    return results
  }
}
