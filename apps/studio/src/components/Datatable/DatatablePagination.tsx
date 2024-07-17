import { Pagination } from "@opengovsg/design-system-react"
import { type Table } from "@tanstack/react-table"

export interface DataTablePaginationProps<D> {
  instance: Table<D>
  totalRowCount?: number
}

export const DatatablePagination = <T extends object>({
  instance,
  totalRowCount: totalRowCountProp,
}: DataTablePaginationProps<T>): JSX.Element => {
  const paginationState = instance.getState().pagination
  const totalRowCount =
    totalRowCountProp ?? instance.getFilteredRowModel().rows.length

  return (
    <Pagination
      currentPage={paginationState.pageIndex + 1}
      onPageChange={(newPage) => {
        instance.setPageIndex(newPage - 1)
      }}
      pageSize={10}
      totalCount={totalRowCount}
    />
  )
}
