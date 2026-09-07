import type { StockFeatures } from "@tanstack/react-table"
import { HStack, Text, useDisclosure } from "@chakra-ui/react"
import { keepPreviousData } from "@tanstack/react-query"
import {
  createColumnHelper,
  stockFeatures,
  useTable,
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

const columnsHelper = createColumnHelper<StockFeatures, GazetteTableData>()

const getColumns = (siteId: number) =>
  columnsHelper.columns([
    columnsHelper.accessor("notificationNo", {
      cell: ({ getValue }) => (
        <Text textStyle="body-2" color="base.content.strong">
          {getValue() || "-"}
        </Text>
      ),
      header: () => <TableHeader>Notification No.</TableHeader>,
      size: 100,
    }),
    columnsHelper.accessor("title", {
      cell: ({ getValue }) => (
        <Text textStyle="subhead-2" color="base.content.default">
          {getValue()}
        </Text>
      ),
      header: () => <TableHeader>Gazette title</TableHeader>,
      minSize: 250,
    }),
    columnsHelper.display({
      cell: ({ row }) => (
        <CategoryCell
          category={row.original.category}
          subcategory={row.original.subcategory}
        />
      ),
      header: () => <TableHeader>Category</TableHeader>,
      id: "category",
      size: 200,
    }),
    columnsHelper.accessor("status", {
      cell: ({ getValue }) => <StatusCell status={getValue()} />,
      header: () => <TableHeader>Status</TableHeader>,
      size: 140,
    }),
    columnsHelper.display({
      cell: ({ row }) => (
        <FileIdCell
          fileId={row.original.fileId}
          fileKey={row.original.fileKey}
          siteId={siteId}
        />
      ),
      header: () => <TableHeader>File ID</TableHeader>,
      id: "fileId",
      size: 130,
    }),
    columnsHelper.accessor("publishTime", {
      cell: ({ getValue }) => (
        <Text textStyle="body-2" color="base.content.strong">
          {format(getValue(), "dd/MM/yyyy, hh:mma")}
        </Text>
      ),
      header: () => <TableHeader>Publish time</TableHeader>,
      size: 130,
    }),
  ])

export const GazetteTable = ({
  siteId,
  collectionId,
}: {
  siteId: number
  collectionId: number
}): React.ReactNode => {
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
      resourceId: collectionId,
      siteId,
    })

  const { limit, onPaginationChange, skip, pagination, pageCount } =
    useTablePagination({
      pageIndex: 0,
      pageSize: 25,
      totalCount,
    })

  const { data: resources, isFetching } = trpc.gazette.list.useQuery(
    {
      collectionId,
      limit,
      offset: skip,
      siteId,
    },
    {
      placeholderData: keepPreviousData,
      // Required for table to show previous data while fetching next page
    },
  )

  const tableInstance = useTable({
    autoResetPageIndex: false,
    columns,
    data:
      resources?.map((resource) => {
        // SAFETY: caller invariant is checked immediately before this narrowing assertion
        const page = resource.content?.page as {
          category?: string
          description?: string
          ref?: string
          tagged?: string[]
        }

        return {
          category: page?.category ?? "",
          fileId: page?.ref?.split("/").pop() ?? "",
          fileKey: page?.ref ?? null,
          fileSize: resource.fileSize ?? null,
          id: resource.id,
          notificationNo: page?.description ?? null,
          publishTime: resource.scheduledAt ?? new Date(),
          publishedAt: resource.publishedAt ?? null,
          status: resource.state === "Published" ? "published" : "scheduled",
          subcategory: page?.tagged?.[0] ?? "",
          title: resource.title,
        } satisfies GazetteTableData
      }) ?? [],
    features: stockFeatures,
    manualFiltering: true,
    manualPagination: true,
    onPaginationChange,
    pageCount,
    state: {
      pagination,
    },
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
            category: selectedGazette.category,
            fileId: selectedGazette.fileId,
            fileKey: selectedGazette.fileKey ?? undefined,
            fileSize: selectedGazette.fileSize ?? undefined,
            notificationNumber: selectedGazette.notificationNo ?? undefined,
            publishDate: selectedGazette.publishTime,
            publishTime: format(selectedGazette.publishTime, "HH:mm"),
            subcategory: selectedGazette.subcategory,
            title: selectedGazette.title,
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
            category: selectedGazette.category,
            fileId: selectedGazette.fileId,
            notificationNumber: selectedGazette.notificationNo ?? undefined,
            publishedAt: selectedGazette.publishedAt,
            subcategory: selectedGazette.subcategory,
            title: selectedGazette.title,
          }}
        />
      )}
    </>
  )
}
