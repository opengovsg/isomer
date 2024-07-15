import type { PaginationState } from "@tanstack/react-table"
import { useState } from "react"
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import type { RouterOutput } from "~/utils/trpc"
import { TableHeader } from "~/components/Datatable"
import { createAccessor, Datatable } from "~/components/Datatable/Datatable"
import { EmptyTablePlaceholder } from "~/components/Datatable/EmptyTablePlaceholder"
import { trpc } from "~/utils/trpc"
import { LastEditCell } from "./LastEditCell"
import { ResourceTableMenu } from "./ResourceTableMenu"
import { StatusCell } from "./StatusCell"
import { TitleCell } from "./TitleCell"

type ResourceTableData = RouterOutput["page"]["list"][number]

const columnsHelper = createColumnHelper<ResourceTableData>()

const columns = [
  columnsHelper.accessor("name", {
    minSize: 300,
    header: () => <TableHeader>Title</TableHeader>,
    cell: ({ row }) => (
      <TitleCell
        title={row.original.name}
        permalink={row.original.permalink}
        type={row.original.type}
      />
    ),
  }),
  columnsHelper.accessor("status", {
    size: 100,
    header: () => <TableHeader>Status</TableHeader>,
    cell: ({ row }) => <StatusCell status={row.original.status} />,
  }),
  columnsHelper.accessor(createAccessor(["lastEditDate", "lastEditUser"]), {
    id: "edit_details",
    size: 120,
    header: () => <TableHeader>Last edited</TableHeader>,
    cell: ({ row }) => (
      <LastEditCell
        date={row.original.lastEditDate}
        email={row.original.lastEditUser}
      />
    ),
  }),
  columnsHelper.display({
    id: "resource_menu",
    header: () => <TableHeader>Actions</TableHeader>,
    cell: ({ row }) => <ResourceTableMenu resourceId={row.original.id} />,
    size: 24,
  }),
]

export const ResourceTable = (): JSX.Element => {
  const { data: resources } = trpc.page.list.useQuery(undefined, {
    keepPreviousData: true, // Required for table to show previous data while fetching next page
  })

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
        <EmptyTablePlaceholder entityName="x" hasSearchTerm={false} />
      }
      instance={tableInstance}
      sx={{
        tableLayout: "auto",
        minWidth: "1000px",
        overflowX: "auto",
      }}
      totalRowCount={resources?.length ?? 0}
    />
  )
}
