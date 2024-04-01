import { SortDirection, SortKey } from "~/common/CollectionSort"

export interface CollectionSortProps {
  sortBy: SortKey
  sortDirection: SortDirection
  setSortBy: (sortBy: SortKey) => void
  setSortDirection: (direction: SortDirection) => void
}

export default CollectionSortProps
