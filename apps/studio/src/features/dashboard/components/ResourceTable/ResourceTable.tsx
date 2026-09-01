import type { StockFeatures } from "@tanstack/react-table"
import type { ResourceOrderByOption } from "~/schemas/resource"
import { HStack, Text } from "@chakra-ui/react"
import { keepPreviousData } from "@tanstack/react-query"
import {
  createColumnHelper,
  stockFeatures,
  useTable,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { TableHeader } from "~/components/Datatable"
import { Datatable } from "~/components/Datatable/Datatable"
import { EmptyTablePlaceholder } from "~/components/Datatable/EmptyTablePlaceholder"
import { useTablePagination } from "~/hooks/useTablePagination"
import { trpc } from "~/utils/trpc"

import type { ResourceTableData } from "./types"
import { ResourceSortMenu } from "./ResourceSortMenu"
import { ResourceTableMenu } from "./ResourceTableMenu"
import { TitleCell } from "./TitleCell"

const columnsHelper = createColumnHelper<StockFeatures, ResourceTableData>()

const getColumns = ({ siteId }: ResourceTableProps) =>
  columnsHelper.columns([
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
          scheduledAt={row.original.scheduledAt}
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
  ])

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

  const columns = useMemo(
    () => getColumns({ siteId, resourceId }),
    [siteId, resourceId],
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
        orderBy: sortOption,
        limit,
        offset: skip,
      },
      {
        placeholderData: keepPreviousData, // Required for table to show previous data while fetching next page
      },
    )

  const tableInstance = useTable({
    features: stockFeatures,
    columns,
    data: resources ?? [],
    manualFiltering: true,
    manualPagination: true,
    autoResetPageIndex: false,
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

        <ResourceSortMenu
          value={sortOption}
          onChange={(option) => {
            setSortOption(option)
            onPaginationChange((old) => ({ ...old, pageIndex: 0 }))
          }}
        />
      </HStack>

      <Datatable
        pagination
        isRowLink
        emptyPlaceholder={
          <EmptyTablePlaceholder
            entityName="page"
            groupLabel="folder"
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
    </>
  )
}
