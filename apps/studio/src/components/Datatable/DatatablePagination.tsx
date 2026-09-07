import type { ReactTable, RowData, StockFeatures } from "@tanstack/react-table"
import { Pagination } from "@opengovsg/design-system-react"

interface DataTablePaginationProps<D extends RowData> {
  instance: ReactTable<StockFeatures, D>
  totalRowCount?: number
}

export const DatatablePagination = <T extends RowData>({
  instance,
  totalRowCount: totalRowCountProp,
}: DataTablePaginationProps<T>): JSX.Element => {
  const paginationState = instance.state.pagination
  const totalRowCount =
    totalRowCountProp ?? instance.getFilteredRowModel().rows.length

  return (
    <Pagination
      currentPage={paginationState.pageIndex + 1}
      onPageChange={(newPage) => {
        instance.setPageIndex(newPage - 1)
      }}
      pageSize={paginationState.pageSize}
      totalCount={totalRowCount}
    />
  )
}
