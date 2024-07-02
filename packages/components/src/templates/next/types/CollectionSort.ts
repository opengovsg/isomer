import { SortDirection, SortKey } from "~/interfaces/internal/CollectionSort";

export interface CollectionSortProps {
  sortBy: SortKey;
  sortDirection: SortDirection;
  setSortBy: (sortBy: SortKey) => void;
  setSortDirection: (direction: SortDirection) => void;
}

export default CollectionSortProps;
