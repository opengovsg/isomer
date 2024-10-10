import type { SearchableTableProps } from "~/interfaces"

interface GetPaginatedItemsParams {
  items: SearchableTableProps["items"]
  currPage: number
  itemsPerPage: number
}

export const getPaginatedItems = ({
  items,
  currPage,
  itemsPerPage,
}: GetPaginatedItemsParams) => {
  const normalizedCurrPage = Math.max(1, currPage)
  const leftIndex = (normalizedCurrPage - 1) * itemsPerPage
  const rightIndex = normalizedCurrPage * itemsPerPage

  return items.slice(leftIndex, rightIndex)
}
