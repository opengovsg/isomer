import type { SearchableTableProps } from "~/interfaces"

interface GetFilteredItemsParams {
  items: SearchableTableProps["items"]
  searchValue: string
}

export const getFilteredItems = ({
  items,
  searchValue,
}: GetFilteredItemsParams) => {
  return items.filter((item) =>
    item.join(" ").toLowerCase().includes(searchValue.toLowerCase()),
  )
}
