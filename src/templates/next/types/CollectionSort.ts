const SortKeys = ["date"] as const
export type SortKey = (typeof SortKeys)[number]
const SortDirections = ["asc", "desc"] as const
export type SortDirection = (typeof SortDirections)[number]

export interface CollectionSortProps {
  sortBy: SortKey
  sortDirection: SortDirection
  setSortBy: (sortBy: SortKey) => void
  setSortDirection: (direction: SortDirection) => void
}

export default CollectionSortProps
