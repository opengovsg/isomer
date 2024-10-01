import type { SearchableTableProps } from "~/interfaces"
import { SearchableTableClient } from "./SearchableTableClient"

const SearchableTable = ({ items, ...rest }: SearchableTableProps) => {
  const cacheItems = items.map((item) => ({
    row: item,
    key: item.join(" ").toLowerCase(),
  }))

  return <SearchableTableClient items={cacheItems} {...rest} />
}

export default SearchableTable
