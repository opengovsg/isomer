import { HStack, Text, useDisclosure } from "@chakra-ui/react"
import { keepPreviousData } from "@tanstack/react-query"
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo, useState } from "react"
import { TableHeader } from "~/components/Datatable"
import { Datatable } from "~/components/Datatable/Datatable"
import { EmptyTablePlaceholder } from "~/components/Datatable/EmptyTablePlaceholder"
import { useTablePagination } from "~/hooks/useTablePagination"
import { trpc } from "~/utils/trpc"

import type { GazetteTableData } from "./types"
import { ModifyGazetteModal } from "../ModifyGazetteModal/ModifyGazetteModal"
import { ViewGazetteModal } from "../ViewGazetteModal"
import { CategoryCell } from "./CategoryCell"
import { FileIdCell } from "./FileIdCell"
import { StatusCell } from "./StatusCell"

const columnsHelper = createColumnHelper<GazetteTableData>()

const getColumns = (siteId: number) => [
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
      <Text textStyle="subhead-2" color="base.content.default">
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
      <FileIdCell
        fileId={row.original.fileId}
        fileKey={row.original.fileKey}
        siteId={siteId}
      />
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

export const GazetteTable = ({
  siteId,
  collectionId,
}: {
  siteId: number
  collectionId: number
}): JSX.Element => {
  const columns = useMemo(() => getColumns(siteId), [siteId])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure()
  const [selectedGazette, setSelectedGazette] =
    useState<GazetteTableData | null>(null)
  const { data: totalCount = 0, isLoading: isCountLoading } =
    trpc.resource.countWithoutRoot.useQuery({
      siteId,
      resourceId: collectionId,
    })

  const { limit, onPaginationChange, skip, pagination, pageCount } =
    useTablePagination({
      pageIndex: 0,
      pageSize: 25,
      totalCount,
    })

  const { data: resources, isFetching } = trpc.gazette.list.useQuery(
    {
      siteId,
      collectionId,
      limit,
      offset: skip,
    },
    {
      placeholderData: keepPreviousData, // Required for table to show previous data while fetching next page
    },
  )

  const tableInstance = useReactTable<GazetteTableData>({
    columns,
    data:
      resources?.map((resource) => {
        const page = resource.content?.page as {
          category?: string
          description?: string
          ref?: string
          tagged?: string[]
        }

        return {
          id: resource.id,
          title: resource.title,
          notificationNo: page?.description ?? null,
          category: page?.category ?? "",
          subcategory: page?.tagged?.[0] ?? "",
          status: resource.state === "Published" ? "published" : "scheduled",
          fileId: page?.ref?.split("/").pop() ?? "",
          fileKey: page?.ref ?? null,
          fileSize: resource.fileSize ?? null,
          publishTime: resource.scheduledAt ?? new Date(),
          publishedAt: resource.publishedAt ?? null,
        } satisfies GazetteTableData
      }) ?? [],
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
        isFetching={isFetching || isCountLoading}
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
        onRowClick={(row) => {
          setSelectedGazette(row.original)
          if (row.original.status === "published") {
            onViewOpen()
          } else {
            onOpen()
          }
        }}
      />

      {selectedGazette && (
        <ModifyGazetteModal
          isOpen={isOpen}
          onClose={onClose}
          gazetteId={selectedGazette.id}
          siteId={siteId}
          collectionId={collectionId}
          initialData={{
            title: selectedGazette.title,
            category: selectedGazette.category,
            subcategory: selectedGazette.subcategory,
            notificationNumber: selectedGazette.notificationNo ?? undefined,
            publishDate: selectedGazette.publishTime,
            publishTime: format(selectedGazette.publishTime, "HH:mm"),
            fileId: selectedGazette.fileId,
            fileKey: selectedGazette.fileKey ?? undefined,
            fileSize: selectedGazette.fileSize ?? undefined,
          }}
        />
      )}

      {selectedGazette && selectedGazette.status === "published" && (
        <ViewGazetteModal
          isOpen={isViewOpen}
          onClose={onViewClose}
          siteId={siteId}
          gazetteId={selectedGazette.id}
          data={{
            title: selectedGazette.title,
            category: selectedGazette.category,
            subcategory: selectedGazette.subcategory,
            notificationNumber: selectedGazette.notificationNo ?? undefined,
            fileId: selectedGazette.fileId,
            publishedAt: selectedGazette.publishedAt,
          }}
        />
      )}
    </>
  )
}
