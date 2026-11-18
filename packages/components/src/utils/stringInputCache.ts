const UNDEFINED = Symbol("stringInputCache.undefined")

let inputResultCache = new Map<string, unknown>()

const DEFAULT_MAX_ENTRIES = 50_000

/**
 * Memoize a pure helper keyed by a single input string (e.g. DOMPurify inputs).
 * Bounded so long static builds do not grow without limit.
 */
export const memoizeStringInput = <T>(
  compute: (input: string) => T,
  maxEntries = DEFAULT_MAX_ENTRIES,
): ((input: string) => T) => {
  return (input: string) => {
    if (inputResultCache.has(input)) {
      const cached = inputResultCache.get(input)
      return cached === UNDEFINED ? (undefined as T) : (cached as T)
    }

    const result = compute(input)

    if (inputResultCache.size >= maxEntries) {
      const oldest = inputResultCache.keys().next().value
      if (oldest !== undefined) {
        inputResultCache.delete(oldest)
      }
    }

    inputResultCache.set(input, result ?? UNDEFINED)

    return result
  }
}

/** @internal Test helper — static-build caches are global for the process lifetime. */
export const resetStringInputCacheForTests = () => {
  inputResultCache = new Map()
}
