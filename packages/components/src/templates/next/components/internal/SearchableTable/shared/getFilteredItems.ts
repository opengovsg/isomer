import type { SearchableTableClientProps } from "./SearchableTableClient"

interface GetFilteredItemsParams {
  items: SearchableTableClientProps["items"]
  searchValue: string
}

export const getFilteredItems = ({
  items,
  searchValue,
}: GetFilteredItemsParams) =>
  items
    .filter((item) => item.key.includes(searchValue.toLowerCase()))
    .map((item) => item.row)
