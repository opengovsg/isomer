import type { CollectionSearchProps } from "../../../types/CollectionSearch"
import { SearchField } from "../Search"

const CollectionSearch = ({
  placeholder,
  search,
  setSearch,
}: CollectionSearchProps) => {
  return (
    <SearchField
      aria-label={placeholder}
      placeholder={placeholder}
      value={search}
      onChange={(value) => setSearch(value)}
    />
  )
}

export default CollectionSearch
