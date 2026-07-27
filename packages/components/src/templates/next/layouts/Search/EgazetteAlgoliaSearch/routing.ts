interface IndexUiState {
  query?: string
  refinementList?: Record<string, string[]>
  range?: Record<string, string>
}

interface EgazetteRouteState {
  q?: string
  category?: string | string[]
  subCategory?: string | string[]
  minYear?: string
  maxYear?: string
  minMonth?: string
  maxMonth?: string
}

// The history router serializes a single-element array as a bare `category=X`
// param, which parses back as a string — coerce so single-value deep links work.
const toArray = (value: string | string[] | undefined) =>
  value === undefined || Array.isArray(value) ? value : [value]

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
      const category = toArray(routeState.category)
      if (category) refinementList.category = category
      const subCategory = toArray(routeState.subCategory)
      if (subCategory) refinementList.subCategory = subCategory

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
