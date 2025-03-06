import { useContext, useMemo } from "react"
import { Text, VStack } from "@chakra-ui/react"
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import type { UserTableData } from "./types"
import type { AdminType } from "~/schemas/user"
import { TableHeader } from "~/components/Datatable"
import { Datatable } from "~/components/Datatable/Datatable"
import { UserManagementContext } from "~/features/users"
import { useTablePagination } from "~/hooks/useTablePagination"
import { trpc } from "~/utils/trpc"
import { LastLoginCell } from "./LastLoginCell"
import { UserTableEmptyState } from "./UserTableEmptyState"
import { UserTableMenu } from "./UserTableMenu"

export interface UserTableProps {
  siteId: number
  adminType: AdminType
}

const columnsHelper = createColumnHelper<UserTableData>()

const getColumns = ({
  siteId,
  shouldShowActions,
}: Pick<UserTableProps, "siteId"> & { shouldShowActions: boolean }) => {
  const baseColumns = [
    columnsHelper.display({
      id: "user_info",
      header: () => <TableHeader>Collaborator</TableHeader>,
      cell: ({ row }) => (
        <VStack gap="0.25rem" align="start">
          <Text textStyle="subhead-2">{row.original.name}</Text>
          <Text textStyle="caption-2" textColor="base.content.medium">
            {row.original.email}
          </Text>
        </VStack>
      ),
    }),
    columnsHelper.display({
      id: "user_role",
      header: () => <TableHeader>Role</TableHeader>,
      cell: ({ row }) => <Text textStyle="caption-2">{row.original.role}</Text>,
      size: 80,
    }),
    columnsHelper.display({
      id: "user_last_login",
      header: () => <TableHeader>Last login</TableHeader>,
      cell: ({ row }) => (
        <LastLoginCell lastLoginAt={row.original.lastLoginAt} />
      ),
      size: 80,
    }),
  ]

  if (!shouldShowActions) {
    return baseColumns
  }

  return [
    ...baseColumns,
    columnsHelper.display({
      id: "user_menu",
      header: () => <TableHeader>Actions</TableHeader>,
      cell: ({ row }) => (
        <UserTableMenu
          siteId={siteId}
          userId={row.original.id}
          userName={row.original.name}
          email={row.original.email}
          role={row.original.role}
        />
      ),
      size: 24,
    }),
  ]
}

export const UserTable = ({ siteId, adminType }: UserTableProps) => {
  const ability = useContext(UserManagementContext)

  const columns = useMemo(
    () =>
      getColumns({
        siteId,
        // Only show actions if not "Isomer Admins" tab
        // because we should not let agencies manage isomer admins
        shouldShowActions:
          ability.can("manage", "UserManagement") && adminType === "agency",
      }),
    [siteId, ability, adminType],
  )

  const { data: totalRowCount = 0, isLoading: isCountLoading } =
    trpc.user.count.useQuery({
      siteId,
      adminType,
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
      adminType,
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
    <Datatable
      pagination
      isFetching={isFetching || isCountLoading}
      instance={tableInstance}
      sx={{
        tableLayout: "auto",
        overflowX: "auto",
      }}
      totalRowCount={totalRowCount}
      emptyPlaceholder={
        <UserTableEmptyState
          siteId={siteId}
          promptAddUser={adminType === "agency"}
        />
      }
    />
  )
}
