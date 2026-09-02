import type {
  ResourceOrderByOption,
  ResourceStatusFilterOption,
} from "~/schemas/resource"
import { HStack, Text } from "@chakra-ui/react"
import { keepPreviousData } from "@tanstack/react-query"
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { TableHeader } from "~/components/Datatable"
import { Datatable } from "~/components/Datatable/Datatable"
import { EmptyTablePlaceholder } from "~/components/Datatable/EmptyTablePlaceholder"
import { LiveStatusBadges } from "~/components/LiveStatusBadges"
import { useTablePagination } from "~/hooks/useTablePagination"
import { trpc } from "~/utils/trpc"

import type { ResourceTableData } from "./types"
import { RESOURCE_TABLE_STATUS_FILTER_OPTIONS } from "./constants"
import { ResourceFilterMenu } from "./ResourceFilterMenu"
import { ResourceSortMenu } from "./ResourceSortMenu"
import { ResourceTableMenu } from "./ResourceTableMenu"
import { TitleCell } from "./TitleCell"

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
        draftBlobId={row.original.draftBlobId}
      />
    ),
  }),
  columnsHelper.display({
    id: "status",
    header: () => <TableHeader>Status</TableHeader>,
    cell: ({ row }) => (
      <LiveStatusBadges
        liveStatus={row.original.liveStatus}
        scheduledAt={row.original.scheduledAt}
        scheduledAction={row.original.scheduledAction}
        lastPublishedAt={row.original.lastPublishedAt}
      />
    ),
  }),
  columnsHelper.display({
    id: "resource_menu",
    header: () => <TableHeader>Actions</TableHeader>,
    cell: ({ row }) => (
      <ResourceTableMenu
        parentId={row.original.parentId}
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
  const [sortOption, setSortOption] =
    useState<ResourceOrderByOption>("updated-desc")
  const [statusFilter, setStatusFilter] = useState<
    ResourceStatusFilterOption[]
  >([])

  const columns = useMemo(
    () => getColumns({ siteId, resourceId }),
    [siteId, resourceId],
  )

  // `limit`/`skip` only depend on local pagination state (pageIndex/pageSize),
  // not on `totalCount` — so it's safe for `totalCount` to come from the same
  // query this feeds into, with no circular dependency. `pageCount` from this
  // call is discarded (it'd be stuck at 0) and recomputed below once the
  // query's own `totalCount` is available.
  const { limit, onPaginationChange, skip, pagination } = useTablePagination({
    pageIndex: 0,
    pageSize: 25,
    totalCount: 0,
  })

  const { data, isFetching } = trpc.resource.listWithoutRoot.useQuery(
    {
      siteId,
      resourceId,
      orderBy: sortOption,
      statusFilter,
      limit,
      offset: skip,
    },
    {
      placeholderData: keepPreviousData, // Required for table to show previous data while fetching next page
    },
  )
  const totalCount = data?.totalCount ?? 0
  const pageCount = Math.ceil(totalCount / limit)

  const tableInstance = useReactTable<ResourceTableData>({
    columns,
    data: data?.items ?? [],
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
      <HStack
        px="0.75rem"
        mb="-0.25rem"
        w="full"
        justifyContent="space-between"
      >
        <Text textStyle="caption-1" color="base.content.default">
          {totalCount} {totalCount === 1 ? "item" : "items"}
        </Text>

        <HStack spacing="1.5rem">
          <ResourceFilterMenu
            value={statusFilter}
            onChange={(next) => {
              setStatusFilter(next)
              onPaginationChange((old) => ({ ...old, pageIndex: 0 }))
            }}
          />
          <ResourceSortMenu
            value={sortOption}
            onChange={(option) => {
              setSortOption(option)
              onPaginationChange((old) => ({ ...old, pageIndex: 0 }))
            }}
          />
        </HStack>
      </HStack>

      <Datatable
        pagination
        emptyPlaceholder={
          <EmptyTablePlaceholder
            entityName="page"
            groupLabel="folder"
            hasSearchTerm={false}
            activeFilterLabels={statusFilter.map(
              (option) => RESOURCE_TABLE_STATUS_FILTER_OPTIONS[option],
            )}
            onClearFilter={() => {
              setStatusFilter([])
              onPaginationChange((old) => ({ ...old, pageIndex: 0 }))
            }}
          />
        }
        isFetching={isFetching}
        instance={tableInstance}
        sx={{
          tableLayout: "auto",
          overflowX: "auto",
        }}
        totalRowCount={totalCount}
      />
    </>
  )
}
