import { useState } from "react"
import { type PaginationState } from "@tanstack/react-table"

type UseTablePaginationArgs = PaginationState & {
  totalCount: number
}

export const useTablePagination = ({
  totalCount,
  ...state
}: UseTablePaginationArgs) => {
  const [pagination, setPagination] = useState<PaginationState>(state)

  const { pageSize, pageIndex } = pagination
  const pageCount = Math.ceil(totalCount / pageSize)

  return {
    limit: pageSize,
    pageCount,
    onPaginationChange: setPagination,
    pagination,
    skip: pageSize * pageIndex,
  }
}
