import type { LayoutProps, TableProps } from "@chakra-ui/react"
import type {
  ReactTable,
  Row,
  RowData,
  StockFeatures,
} from "@tanstack/react-table"
import {
  Box,
  Flex,
  LinkBox,
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

interface DatatableProps<D extends RowData> extends TableProps {
  instance: ReactTable<StockFeatures, D>
  /**
   * If provided, this number will be used for pagination instead of retrieving
   * from react-table's filtered row count.
   */
  totalRowCount?: number
  pagination?: boolean
  isFetching?: boolean
  emptyPlaceholder?: React.ReactElement
  overflow?: LayoutProps["overflow"]
  onRowClick?: (row: Row<StockFeatures, D>) => void
  /** Render each row as a LinkBox for a descendant LinkOverlay. */
  isRowLink?: boolean
}

export const Datatable = <T extends RowData>({
  instance,
  isFetching,
  pagination,
  totalRowCount,
  emptyPlaceholder,
  overflow = "auto",
  onRowClick,
  isRowLink,
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
              const RowComponent = isRowLink ? LinkBox : Tr

              return (
                <RowComponent
                  as={isRowLink ? "tr" : undefined}
                  key={row.id}
                  borderBottomWidth="1px"
                  // LinkBox rows don't pick up the Table theme's `tr` styles,
                  // so restate the ones we rely on here.
                  _last={{ borderBottomWidth: 0 }}
                  textStyle="body-2"
                  _hover={{ bgColor: "interaction.muted.main.hover" }}
                  cursor={onRowClick || isRowLink ? "pointer" : undefined}
                  onClick={() => onRowClick?.(row)}
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
                </RowComponent>
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
