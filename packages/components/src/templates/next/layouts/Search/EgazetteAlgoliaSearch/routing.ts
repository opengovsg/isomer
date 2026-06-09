interface IndexUiState {
  query?: string
  refinementList?: Record<string, string[]>
  range?: Record<string, string>
}

interface EgazetteRouteState {
  q?: string
  category?: string[]
  subCategory?: string[]
  minYear?: string
  maxYear?: string
  minMonth?: string
  maxMonth?: string
}

const splitRange = (range: string | undefined) => {
  if (!range) return [undefined, undefined] as const
  const [min, max] = range.split(":")
  return [min || undefined, max || undefined] as const
}

const joinRange = (min: string | undefined, max: string | undefined) =>
  min || max ? `${min ?? ""}:${max ?? ""}` : ""

// Round-trips the egazette search UI state through URL params so searches are shareable —
// matches the param shape (q, category, subCategory, minYear/maxYear, minMonth/maxMonth)
// used by the legacy Jekyll template.
export const createEgazetteRouting = (indexName: string) => ({
  stateMapping: {
    stateToRoute(uiState: Record<string, IndexUiState>): EgazetteRouteState {
      const indexUiState = uiState[indexName] ?? {}
      const [minYear, maxYear] = splitRange(indexUiState.range?.publishYear)
      const [minMonth, maxMonth] = splitRange(indexUiState.range?.publishMonth)
      return {
        q: indexUiState.query,
        category: indexUiState.refinementList?.category,
        subCategory: indexUiState.refinementList?.subCategory,
        minYear,
        maxYear,
        minMonth,
        maxMonth,
      }
    },
    routeToState(routeState: EgazetteRouteState): Record<string, IndexUiState> {
      const refinementList: Record<string, string[]> = {}
      if (routeState.category) refinementList.category = routeState.category
      if (routeState.subCategory)
        refinementList.subCategory = routeState.subCategory

      const range: Record<string, string> = {}
      const yearRange = joinRange(routeState.minYear, routeState.maxYear)
      if (yearRange) range.publishYear = yearRange
      const monthRange = joinRange(routeState.minMonth, routeState.maxMonth)
      if (monthRange) range.publishMonth = monthRange

      return {
        [indexName]: {
          query: routeState.q,
          refinementList,
          range,
        },
      }
    },
  },
})
