import { HStack, Text } from "@chakra-ui/react"
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"
import { TableHeader } from "~/components/Datatable"
import { Datatable } from "~/components/Datatable/Datatable"
import { EmptyTablePlaceholder } from "~/components/Datatable/EmptyTablePlaceholder"
import { useTablePagination } from "~/hooks/useTablePagination"

import type { GazetteTableData } from "./types"
import { CategoryCell } from "./CategoryCell"
import { FileIdCell } from "./FileIdCell"
import { StatusCell } from "./StatusCell"

const columnsHelper = createColumnHelper<GazetteTableData>()

const getColumns = () => [
  columnsHelper.accessor("notificationNo", {
    size: 100,
    header: () => <TableHeader>Notification No.</TableHeader>,
    cell: ({ getValue }) => (
      <Text textStyle="body-2" color="base.content.strong">
        {getValue() ?? "-"}
      </Text>
    ),
  }),
  columnsHelper.accessor("title", {
    minSize: 250,
    header: () => <TableHeader>Gazette title</TableHeader>,
    cell: ({ getValue }) => (
      <Text textStyle="subhead-2" color="base.content.default" noOfLines={2}>
        {getValue()}
      </Text>
    ),
  }),
  columnsHelper.display({
    id: "category",
    size: 200,
    header: () => <TableHeader>Category</TableHeader>,
    cell: ({ row }) => (
      <CategoryCell
        category={row.original.category}
        subcategory={row.original.subcategory}
      />
    ),
  }),
  columnsHelper.accessor("status", {
    size: 140,
    header: () => <TableHeader>Status</TableHeader>,
    cell: ({ getValue }) => <StatusCell status={getValue()} />,
  }),
  columnsHelper.display({
    id: "fileId",
    size: 130,
    header: () => <TableHeader>File ID</TableHeader>,
    cell: ({ row }) => (
      <FileIdCell fileId={row.original.fileId} fileUrl={row.original.fileUrl} />
    ),
  }),
  columnsHelper.accessor("publishTime", {
    size: 130,
    header: () => <TableHeader>Publish time</TableHeader>,
    cell: ({ getValue }) => (
      <Text textStyle="body-2" color="base.content.strong">
        {format(getValue(), "dd/MM/yyyy, hh:mma")}
      </Text>
    ),
  }),
]

interface GazetteTableProps {
  data: GazetteTableData[]
  totalCount: number
  isLoading?: boolean
}

export const GazetteTable = ({
  data,
  totalCount,
  isLoading,
}: GazetteTableProps): JSX.Element => {
  const columns = useMemo(() => getColumns(), [])

  const { onPaginationChange, pagination, pageCount } = useTablePagination({
    pageIndex: 0,
    pageSize: 25,
    totalCount,
  })

  const tableInstance = useReactTable<GazetteTableData>({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true,
    manualPagination: true,
    autoResetPageIndex: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange,
    state: {
      pagination,
    },
    pageCount,
  })

  return (
    <>
      <HStack px="0.75rem" w="full" justifyContent="space-between">
        <Text textStyle="caption-1" color="base.content.medium">
          {totalCount.toLocaleString()} Gazettes
        </Text>
      </HStack>

      <Datatable
        pagination
        isFetching={isLoading}
        emptyPlaceholder={
          <EmptyTablePlaceholder
            groupLabel="gazettes"
            entityName="gazette"
            hasSearchTerm={false}
          />
        }
        instance={tableInstance}
        sx={{
          tableLayout: "fixed",
        }}
        totalRowCount={totalCount}
      />
    </>
  )
}
