import type { NativeSearchableTableProps } from "~/interfaces"

interface GetPaginatedItemsParams {
  items: NativeSearchableTableProps["items"]
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
