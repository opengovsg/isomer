import type { SearchableTableClientProps } from "~/interfaces"

interface GetFilteredItemsParams {
  items: SearchableTableClientProps["items"]
  searchValue: string
}

export const getFilteredItems = ({
  items,
  searchValue,
}: GetFilteredItemsParams) => {
  const loweredSearch = searchValue.toLowerCase()
  const rows: SearchableTableClientProps["items"][number]["row"][] = []

  for (const item of items) {
    if (item.key.includes(loweredSearch)) {
      rows.push(item.row)
    }
  }

  return rows
}
