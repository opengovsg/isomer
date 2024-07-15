import type { LayoutProps, TableCellProps, TableProps } from "@chakra-ui/react"
import type { Table as ReactTable } from "@tanstack/react-table"
import {
  Box,
  Flex,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useMultiStyleConfig,
} from "@chakra-ui/react"
import { flexRender } from "@tanstack/react-table"

import { DatatablePagination } from "./DatatablePagination"

export interface DatatableProps<D> extends TableProps {
  instance: ReactTable<D>
  /**
   * If provided, this number will be used for pagination instead of retrieving
   * from react-table's filtered row count.
   */
  totalRowCount?: number
  pagination?: boolean
  /**
   * If provided, this string will be used to display the total row count.
   */
  totalRowCountString?: string
  isFetching?: boolean
  tablePropOverrides?: Record<string, { td: TableCellProps }>
  emptyPlaceholder?: React.ReactElement
  overflow?: LayoutProps["overflow"]
}

export function createAccessor<T>(props: (keyof T)[]) {
  return (row: T): string => {
    return props.map((prop) => String(row[prop])).join(" ")
  }
}

export const Datatable = <T extends object>({
  instance,
  isFetching,
  pagination,
  totalRowCount,
  totalRowCountString,
  tablePropOverrides,
  emptyPlaceholder,
  overflow = "auto",
  ...tableProps
}: DatatableProps<T>): JSX.Element => {
  const { rows } = instance.getRowModel()
  const styles = useMultiStyleConfig("Table", tableProps)

  return (
    <Flex flexDirection="column" layerStyle="shadow" pos="relative">
      {isFetching && (
        <>
          <Flex
            // white alpha to denote loading
            bg="whiteAlpha.800"
            bottom={0}
            left={0}
            p="1rem"
            pos="absolute"
            right={0}
            top={0}
            zIndex="1"
          />
          <Flex
            bottom={0}
            flex={1}
            left={0}
            pos="fixed"
            right={0}
            top={0}
            w="100vw"
            zIndex={2}
          >
            <Box m="auto">
              <Spinner />
            </Box>
          </Flex>
        </>
      )}
      <Box overflow={overflow} sx={styles.container}>
        <Table sx={{ tableLayout: "fixed" }} {...tableProps} pos="relative">
          <Thead>
            {instance.getHeaderGroups().map((headerGroup) => (
              <Tr
                key={headerGroup.id}
                // To toggle _groupHover styles to show divider when header is hovered.
                data-group
                borderBottomWidth="1px"
              >
                {headerGroup.headers.map((header) => (
                  <Th
                    key={header.id}
                    pos="relative"
                    px={0}
                    style={{
                      width:
                        header.getSize() === Number.MAX_SAFE_INTEGER
                          ? "auto"
                          : header.getSize() === Number.MIN_SAFE_INTEGER
                            ? "fit-content"
                            : header.getSize(),
                    }}
                  >
                    <Flex align="center">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </Flex>
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {rows.length === 0 && emptyPlaceholder}
            {rows.map((row) => {
              return (
                <Tr key={row.id} borderBottomWidth="1px">
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <Td
                        key={cell.id}
                        verticalAlign="center"
                        {...tablePropOverrides?.[cell.column.id]?.td}
                        {...tablePropOverrides?.[cell.id]?.td}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </Td>
                    )
                  })}
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </Box>
      <Flex py="1rem" gap="1rem">
        {totalRowCountString && (
          <Text textStyle="caption-2" color="base.content.medium">
            {totalRowCountString}
          </Text>
        )}
        {pagination && (
          <Flex ml="auto">
            <DatatablePagination
              instance={instance}
              totalRowCount={totalRowCount}
            />
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
