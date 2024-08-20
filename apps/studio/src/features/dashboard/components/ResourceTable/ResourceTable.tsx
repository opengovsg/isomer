import type { PaginationState } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import type { RouterOutput } from "~/utils/trpc"
import { TableHeader } from "~/components/Datatable"
import { Datatable } from "~/components/Datatable/Datatable"
import { EmptyTablePlaceholder } from "~/components/Datatable/EmptyTablePlaceholder"
import { trpc } from "~/utils/trpc"
import { ResourceTableMenu } from "./ResourceTableMenu"
import { TitleCell } from "./TitleCell"

type ResourceTableData = RouterOutput["resource"]["listWithoutRoot"][number]

const columnsHelper = createColumnHelper<ResourceTableData>()

const getColumns = ({ siteId }: ResourceTableProps) => [
  columnsHelper.accessor("title", {
    minSize: 300,
    header: () => <TableHeader>Title</TableHeader>,
    cell: ({ row }) => (
      <TitleCell
        siteId={siteId}
        id={row.original.id}
        title={row.original.title}
        permalink={`/${row.original.permalink}`}
        type={row.original.type}
      />
    ),
  }),
  columnsHelper.display({
    id: "resource_menu",
    header: () => <TableHeader>Actions</TableHeader>,
    cell: ({ row }) => (
      <ResourceTableMenu
        title={row.original.title}
        resourceId={row.original.id}
        type={row.original.type}
        permalink={row.original.permalink}
        resourceType={row.original.type}
      />
    ),
    size: 24,
  }),
]

interface ResourceTableProps {
  siteId: number
  resourceId?: number
}

export const ResourceTable = ({
  siteId,
  resourceId,
}: ResourceTableProps): JSX.Element => {
  const columns = useMemo(
    () => getColumns({ siteId, resourceId }),
    [siteId, resourceId],
  )
  const { data: resources } = trpc.resource.listWithoutRoot.useQuery(
    {
      siteId,
      resourceId,
    },
    {
      keepPreviousData: true, // Required for table to show previous data while fetching next page
    },
  )

  const totalRowCount = resources?.length ?? 0

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })

  const tableInstance = useReactTable<ResourceTableData>({
    columns,
    data: resources ?? [],
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true,
    autoResetPageIndex: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  })

  return (
    <Datatable
      pagination
      emptyPlaceholder={
        <EmptyTablePlaceholder
          entityName="page"
          groupLabel="folder"
          hasSearchTerm={false}
        />
      }
      instance={tableInstance}
      sx={{
        tableLayout: "auto",
        minWidth: "1000px",
        overflowX: "auto",
      }}
      totalRowCount={totalRowCount}
      totalRowCountString={`${totalRowCount} item${totalRowCount === 1 ? "" : "s"} in collection`}
    />
  )
}
