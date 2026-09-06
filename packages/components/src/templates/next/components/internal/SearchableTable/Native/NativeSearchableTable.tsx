import type { NativeSearchableTableProps } from "~/interfaces"

import { SearchableTableClient } from "../shared/SearchableTableClient"

export const NativeSearchableTable = ({
  items,
  ...rest
}: NativeSearchableTableProps) => {
  const cacheItems = items.map((item) => ({
    row: item,
    key: item.join(" ").toLowerCase(),
  }))

  return <SearchableTableClient items={cacheItems} {...rest} />
}
