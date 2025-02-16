import { useMemo } from "react"
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
import { useTablePagination } from "~/hooks/useTablePagination"
import { trpc } from "~/utils/trpc"
import { PublishedInfoCell } from "../ResourceTable/PublishedInfoCell"
import { StateCell } from "../ResourceTable/StateCell"
import { TitleCell } from "../ResourceTable/TitleCell"

export type BaseResourceTableData =
  RouterOutput["resource"]["listWithoutRoot"][number]

const columnsHelper = createColumnHelper<BaseResourceTableData>()

export interface BaseResourceTableProps {
  siteId: number
  resourceId?: number
  renderMenu: (row: BaseResourceTableData) => JSX.Element
  entityName: string
  groupLabel: string
}

export const BaseResourceTable = ({
  siteId,
  resourceId,
  renderMenu,
  entityName,
  groupLabel,
}: BaseResourceTableProps) => {
  const columns = useMemo(
    () => [
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
        id: "resource_state",
        cell: ({ row }) => (
          <StateCell
            type={row.original.type}
            draftBlobId={row.original.draftBlobId}
          />
        ),
      }),
      columnsHelper.display({
        id: "published_info",
        cell: ({ row }) => (
          <PublishedInfoCell
            publishedAt={row.original.publishedAt}
            publisherEmail={row.original.publisherEmail}
          />
        ),
      }),
      columnsHelper.display({
        id: "resource_menu",
        header: () => <TableHeader>Actions</TableHeader>,
        cell: ({ row }) => renderMenu(row.original),
        size: 24,
      }),
    ],
    [siteId, renderMenu],
  )

  const { data: totalCount = 0, isLoading: isCountLoading } =
    trpc.resource.countWithoutRoot.useQuery({
      siteId,
      resourceId,
    })

  const { limit, onPaginationChange, skip, pagination, pageCount } =
    useTablePagination({
      pageIndex: 0,
      pageSize: 25,
      totalCount,
    })

  const { data: resources, isFetching } =
    trpc.resource.listWithoutRoot.useQuery(
      {
        siteId,
        resourceId,
        limit,
        offset: skip,
      },
      {
        keepPreviousData: true,
      },
    )

  const tableInstance = useReactTable<BaseResourceTableData>({
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
      emptyPlaceholder={
        <EmptyTablePlaceholder
          entityName={entityName}
          groupLabel={groupLabel}
          hasSearchTerm={false}
        />
      }
      isFetching={isFetching || isCountLoading}
      instance={tableInstance}
      sx={{
        tableLayout: "auto",
        overflowX: "auto",
      }}
      totalRowCount={totalCount}
    />
  )
}
