import type { LayoutProps, TableProps } from "@chakra-ui/react"
import type { Table as ReactTable } from "@tanstack/react-table"
import {
  Box,
  Flex,
  Spinner,
  Table,
  Tbody,
  Td,
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
  isFetching?: boolean
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
  emptyPlaceholder,
  overflow = "auto",
  ...tableProps
}: DatatableProps<T>): JSX.Element => {
  const { rows } = instance.getRowModel()
  const styles = useMultiStyleConfig("Table", tableProps)

  return (
    <Flex
      width="100%"
      flexDirection="column"
      layerStyle="shadow"
      pos="relative"
    >
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
            pos="absolute"
            right={0}
            top={0}
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
          <Thead borderBottomWidth="1px">
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
                      width: header.getSize(),
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
                <Tr
                  key={row.id}
                  borderBottomWidth="1px"
                  _hover={{ bgColor: "interaction.muted.main.hover" }}
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <Td key={cell.id} verticalAlign="center">
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
        {pagination && !!totalRowCount && (
          <DatatablePagination
            instance={instance}
            totalRowCount={totalRowCount}
          />
        )}
      </Flex>
    </Flex>
  )
}
