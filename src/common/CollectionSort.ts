const SortKeys = ["date"] as const
export type SortKey = (typeof SortKeys)[number]
const SortDirections = ["asc", "desc"] as const
export type SortDirection = (typeof SortDirections)[number]

// TODO: Separate out components like CollectionSort that do not go through the RenderEngine, i.e only used by another component directly
export interface CollectionSortProps {
  sortBy: SortKey
  sortDirection: SortDirection
  setSortBy: (sortBy: SortKey) => void
  setSortDirection: (direction: SortDirection) => void
}

export default CollectionSortProps
