import { useMemo } from "react"
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { CollectionTableData } from "./types"
import { TableHeader } from "~/components/Datatable"
import { Datatable } from "~/components/Datatable/Datatable"
import { EmptyTablePlaceholder } from "~/components/Datatable/EmptyTablePlaceholder"
import { useTablePagination } from "~/hooks/useTablePagination"
import { trpc } from "~/utils/trpc"
import { TitleCell } from "../ResourceTable/TitleCell"
import { CollectionTableMenu } from "./CollectionTableMenu"

const columnsHelper = createColumnHelper<CollectionTableData>()

const getColumns = ({ siteId }: CollectionTableProps) => [
  columnsHelper.accessor("title", {
    minSize: 300,
    header: () => <TableHeader>Title</TableHeader>,
    cell: ({ row }) => (
      <TitleCell
        siteId={siteId}
        id={row.original.id}
        title={row.original.title}
        permalink={
          row.original.type === ResourceType.CollectionLink
            ? ""
            : `/${row.original.permalink}`
        }
        type={row.original.type}
      />
    ),
  }),
  columnsHelper.display({
    id: "resource_menu",
    header: () => <TableHeader>Actions</TableHeader>,
    cell: ({ row }) => (
      <CollectionTableMenu
        permalink={row.original.permalink}
        parentId={row.original.parentId}
        resourceType={row.original.type}
        title={row.original.title}
        resourceId={row.original.id}
      />
    ),
    size: 24,
  }),
]

interface CollectionTableProps {
  siteId: number
  resourceId: number
}

export const CollectionTable = ({
  siteId,
  resourceId,
}: CollectionTableProps): JSX.Element => {
  const columns = useMemo(
    () => getColumns({ siteId, resourceId }),
    [siteId, resourceId],
  )

  const { data: totalRowCount = 0, isLoading: isCountLoading } =
    trpc.resource.countWithoutRoot.useQuery({
      siteId,
      resourceId,
    })

  const { limit, onPaginationChange, skip, pagination, pageCount } =
    useTablePagination({
      pageIndex: 0,
      pageSize: 25,
      totalCount: totalRowCount,
    })

  const { data: resources, isFetching } = trpc.collection.list.useQuery({
    siteId,
    resourceId,
    limit,
    offset: skip,
  })

  const tableInstance = useReactTable<CollectionTableData>({
    columns,
    data: resources ?? [],
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
    <Datatable
      pagination
      isFetching={isFetching || isCountLoading}
      emptyPlaceholder={
        <EmptyTablePlaceholder
          groupLabel="collection"
          entityName="collection page"
          hasSearchTerm={false}
        />
      }
      instance={tableInstance}
      sx={{
        tableLayout: "auto",
        overflowX: "auto",
      }}
      totalRowCount={totalRowCount}
    />
  )
}
