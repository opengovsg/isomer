import { HStack, Text } from "@chakra-ui/react"
import { Menu } from "@opengovsg/design-system-react"
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
import { useTablePagination } from "~/hooks/useTablePagination"
import { trpc } from "~/utils/trpc"

import type { ResourceSortOption, ResourceTableData } from "./types"
import { RESOURCE_TABLE_SORT_OPTIONS } from "./constants"
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
    useState<ResourceSortOption>("updated-desc")

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

  const tableInstance = useReactTable<ResourceTableData>({
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

        <HStack>
          <Text textStyle="caption-1" color="base.content.default">
            Sort by:
          </Text>
          <Menu size="sm" variant="clear">
            {({ isOpen }) => (
              <>
                <Menu.Button
                  variant="clear"
                  size="sm"
                  p="0"
                  minH="auto"
                  colorScheme="sub"
                  fontSize="0.75rem"
                  isOpen={isOpen}
                >
                  {RESOURCE_TABLE_SORT_OPTIONS[sortOption]}
                </Menu.Button>
                <Menu.List pt="0.75rem" pb="0.5rem">
                  {Object.entries(RESOURCE_TABLE_SORT_OPTIONS).map(
                    ([option, label]) => (
                      <Menu.Item
                        key={option}
                        onClick={() => {
                          setSortOption(option as ResourceSortOption)
                          onPaginationChange((old) => ({
                            ...old,
                            pageIndex: 0,
                          }))
                        }}
                      >
                        {label}
                      </Menu.Item>
                    ),
                  )}
                </Menu.List>
              </>
            )}
          </Menu>
        </HStack>
      </HStack>

      <Datatable
        pagination
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
