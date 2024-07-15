import { useMemo } from "react"
import { ButtonGroup, HStack, Select, Text } from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"
import { type Table } from "@tanstack/react-table"
import {
  BiChevronLeft,
  BiChevronRight,
  BiFirstPage,
  BiLastPage,
} from "react-icons/bi"

export interface DataTablePaginationProps<D> {
  instance: Table<D>
  /**
   * Defaults to [10, 25, 50]
   */
  pageSizeOptions?: number[]
  totalRowCount?: number
}

export const DatatablePagination = <T extends object>({
  instance,
  totalRowCount: totalRowCountProp,
  pageSizeOptions = [10, 25, 50, 100],
}: DataTablePaginationProps<T>): JSX.Element => {
  const paginationState = instance.getState().pagination
  const pageRowCount = instance.getRowModel().rows.length
  const totalRowCount =
    totalRowCountProp ?? instance.getFilteredRowModel().rows.length

  // Get page row details depending on current page index and page size.
  const pageRowDetails = useMemo(() => {
    const { pageIndex, pageSize } = paginationState
    const startRow = pageIndex * pageSize
    const endRow = Math.min(startRow + pageSize, startRow + pageRowCount)
    return {
      startRow: totalRowCount === 0 ? 0 : startRow + 1,
      endRow,
    }
  }, [paginationState, pageRowCount, totalRowCount])

  return (
    <HStack
      color="base.content.medium"
      spacing="0.75rem"
      textStyle="body-2"
      whiteSpace="nowrap"
    >
      <Text>Rows per page</Text>
      <Select
        iconSize="1rem"
        size="sm"
        value={instance.getState().pagination.pageSize}
        width="4.5rem"
        onChange={(e) => {
          instance.setPageSize(Number(e.target.value))
        }}
      >
        {pageSizeOptions.map((pageSize) => (
          <option key={pageSize} value={pageSize}>
            {pageSize}
          </option>
        ))}
      </Select>
      <Text>
        {pageRowDetails.startRow}-{pageRowDetails.endRow} of {totalRowCount}
      </Text>
      <ButtonGroup spacing={0}>
        <IconButton
          aria-label="First page"
          colorScheme="sub"
          icon={<BiFirstPage />}
          isDisabled={!instance.getCanPreviousPage()}
          variant="clear"
          onClick={() => instance.setPageIndex(0)}
        />
        <IconButton
          aria-label="Previous page"
          colorScheme="sub"
          icon={<BiChevronLeft />}
          isDisabled={!instance.getCanPreviousPage()}
          variant="clear"
          onClick={() => instance.previousPage()}
        />
        <IconButton
          aria-label="Next page"
          colorScheme="sub"
          icon={<BiChevronRight />}
          isDisabled={!instance.getCanNextPage()}
          variant="clear"
          onClick={() => instance.nextPage()}
        />
        <IconButton
          aria-label="Last page"
          colorScheme="sub"
          icon={<BiLastPage />}
          isDisabled={!instance.getCanNextPage()}
          variant="clear"
          onClick={() => instance.setPageIndex(instance.getPageCount() - 1)}
        />
      </ButtonGroup>
    </HStack>
  )
}
