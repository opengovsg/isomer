import { useMemo } from "react"
import { Text, VStack } from "@chakra-ui/react"
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import type { UserTableData } from "./types"
import { TableHeader } from "~/components/Datatable"
import { Datatable } from "~/components/Datatable/Datatable"
import { useTablePagination } from "~/hooks/useTablePagination"
import { trpc } from "~/utils/trpc"
import { LastLoginCell } from "./LastLoginCell"
import { UserTableMenu } from "./UserTableMenu"

export interface UserTableProps {
  siteId: number
  getIsomerAdmins: boolean
}

const columnsHelper = createColumnHelper<UserTableData>()

const getColumns = ({ siteId }: Pick<UserTableProps, "siteId">) => [
  columnsHelper.display({
    id: "user_info",
    header: () => <TableHeader>User</TableHeader>,
    cell: ({ row }) => (
      <VStack gap="0.25rem" align="start">
        <Text textStyle="subhead-2">{row.original.name}</Text>
        <Text textStyle="caption-2">{row.original.email}</Text>
      </VStack>
    ),
  }),
  columnsHelper.display({
    id: "user_role",
    header: () => <TableHeader>Role</TableHeader>,
    cell: ({ row }) => <Text textStyle="caption-2">{row.original.role}</Text>,
  }),
  columnsHelper.display({
    id: "user_last_login",
    header: () => <TableHeader>Last login</TableHeader>,
    cell: ({ row }) => <LastLoginCell lastLoginAt={row.original.lastLoginAt} />,
  }),
  columnsHelper.display({
    id: "user_menu",
    header: () => <TableHeader>Actions</TableHeader>,
    cell: ({ row }) => (
      <UserTableMenu siteId={siteId} userId={row.original.id} />
    ),
    size: 24,
  }),
]

export const UserTable = ({ siteId, getIsomerAdmins }: UserTableProps) => {
  const columns = useMemo(() => getColumns({ siteId }), [siteId])

  const { data: totalRowCount = 0, isLoading: isCountLoading } =
    trpc.user.count.useQuery({
      siteId,
      getIsomerAdmins,
    })

  const { limit, onPaginationChange, skip, pagination, pageCount } =
    useTablePagination({
      pageIndex: 0,
      pageSize: 10,
      totalCount: totalRowCount,
    })

  const { data: users, isFetching } = trpc.user.list.useQuery(
    {
      siteId,
      getIsomerAdmins,
      limit,
      offset: skip,
    },
    {
      keepPreviousData: true, // Required for table to show previous data while fetching next page
    },
  )

  const tableInstance = useReactTable<UserTableData>({
    columns,
    data: users ?? [],
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
    // Note: did not add emptyPlaceholder since there will always be at least one user
    <Datatable
      pagination
      isFetching={isFetching || isCountLoading}
      instance={tableInstance}
      sx={{
        tableLayout: "auto",
        overflowX: "auto",
      }}
      totalRowCount={totalRowCount}
    />
  )
}
