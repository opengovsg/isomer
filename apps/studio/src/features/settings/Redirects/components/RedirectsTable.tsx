import type { OnChangeFn, SortingState } from "@tanstack/react-table"
import {
  Box,
  HStack,
  Icon,
  IconButton,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import {
  BiDownArrowAlt,
  BiSortAlt2,
  BiTrash,
  BiUpArrowAlt,
} from "react-icons/bi"
import { TableHeader } from "~/components/Datatable"
import { Datatable } from "~/components/Datatable/Datatable"
import { EmptyTablePlaceholder } from "~/components/Datatable/EmptyTablePlaceholder"
import {
  BRIEF_TOAST_SETTINGS,
  SETTINGS_TOAST_MESSAGES,
} from "~/constants/toast"
import { useTablePagination } from "~/hooks/useTablePagination"

import type { RedirectRow, RedirectSortField } from "../types"
import type { DestinationDisplay } from "../utils"
import {
  REDIRECTS_PAGE_SIZE,
  useCountRedirects,
  useDeleteRedirect,
  useListRedirects,
  useResolveRedirectReferences,
} from "../api"
import {
  formatAddedAt,
  getDestinationDisplay,
  isReferenceDestination,
} from "../utils"
import { DeleteRedirectModal } from "./DeleteRedirectModal"

const columnsHelper = createColumnHelper<RedirectRow>()

// Copy shown when a reference destination's page has since been deleted. Kept
// here (the render site) so it can change without touching the resolution logic.
const MISSING_PAGE_LABEL = "Page no longer exists"

// Renders a pre-resolved redirect destination. Reference destinations arrive as
// the page's current permalink; while that resolution is in flight we show a
// skeleton, and a reference whose page no longer exists is flagged rather than
// leaking the raw "[resource:...]" string.
function DestinationCell({
  display,
}: {
  display: DestinationDisplay
}): JSX.Element {
  if (display.status === "resolving") {
    return <Skeleton height="1.25rem" width="60%" />
  }

  const isMissing = display.status === "missing"
  const label = isMissing ? MISSING_PAGE_LABEL : display.label
  return (
    <Tooltip label={label} openDelay={500} placement="top">
      <Text
        textStyle="body-2"
        color={isMissing ? "utility.feedback.critical" : "base.content.strong"}
        noOfLines={1}
        wordBreak="break-all"
      >
        {label}
      </Text>
    </Tooltip>
  )
}

// Plain-text destination label for contexts without a skeleton (e.g. the delete
// modal): resolved → permalink/path, missing → the missing-page copy, and still
// resolving → "" so the raw "[resource:...]" token never shows.
const destinationLabelFor = (display: DestinationDisplay): string => {
  switch (display.status) {
    case "resolving":
      return ""
    case "missing":
      return MISSING_PAGE_LABEL
    case "resolved":
      return display.label
  }
}

function SortableHeader({
  label,
  isSorted,
  onClick,
}: {
  label: string
  isSorted: false | "asc" | "desc"
  onClick?: (event: unknown) => void
}): JSX.Element {
  const icon = useMemo(() => {
    switch (isSorted) {
      case "asc":
        return BiUpArrowAlt
      case "desc":
        return BiDownArrowAlt
      default:
        return BiSortAlt2
    }
  }, [isSorted])

  return (
    <TableHeader
      onClick={onClick}
      cursor="pointer"
      userSelect="none"
      color="base.content.medium"
      _hover={{ color: "base.content.strong" }}
    >
      <HStack spacing="0.5rem">
        <Text as="span" textStyle="subhead-2">
          {label}
        </Text>
        <Icon as={icon} boxSize="1rem" />
      </HStack>
    </TableHeader>
  )
}

const getColumns = (
  onDeleteClick: (row: RedirectRow) => void,
  permalinkByReference: Map<string, string | null>,
) => [
  columnsHelper.accessor("source", {
    minSize: 250,
    enableSorting: true,
    header: ({ column }) => (
      <SortableHeader
        label="When someone visits"
        isSorted={column.getIsSorted()}
        onClick={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ getValue }) => {
      const source = getValue()
      const isWildcard = source.endsWith("*")
      const base = isWildcard ? source.slice(0, -1) : source
      return (
        <Tooltip label={source} openDelay={500} placement="top">
          <HStack spacing="0" align="baseline" overflow="hidden">
            <Text
              textStyle="body-2"
              color="base.content.strong"
              noOfLines={1}
              wordBreak="break-all"
            >
              {base}
            </Text>
            {isWildcard && (
              <Box
                as="span"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                borderWidth="1px"
                borderColor="base.divider.medium"
                bg="utility.feedback.critical-subtle"
                borderRadius="2px"
                px="0.2rem"
                ml="0.125rem"
                flexShrink={0}
                lineHeight="1"
              >
                <Text
                  as="span"
                  fontFamily="mono"
                  textStyle="subhead-2"
                  color="utility.feedback.critical"
                >
                  *
                </Text>
              </Box>
            )}
          </HStack>
        </Tooltip>
      )
    },
  }),
  columnsHelper.accessor("destination", {
    minSize: 250,
    enableSorting: true,
    header: ({ column }) => (
      <SortableHeader
        label="Redirect them to"
        isSorted={column.getIsSorted()}
        onClick={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ getValue }) => (
      <DestinationCell
        display={getDestinationDisplay(getValue(), permalinkByReference)}
      />
    ),
  }),
  columnsHelper.accessor("publishedAt", {
    size: 160,
    enableSorting: true,
    header: ({ column }) => (
      <SortableHeader
        label="Added"
        isSorted={column.getIsSorted()}
        onClick={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ getValue }) => (
      <Text textStyle="body-2" color="base.content.medium">
        {formatAddedAt(getValue())}
      </Text>
    ),
  }),
  columnsHelper.display({
    id: "delete",
    size: 80,
    enableSorting: false,
    header: () => (
      <TableHeader
        textStyle="subhead-2"
        color="base.content.medium"
      ></TableHeader>
    ),
    cell: ({ row }) => (
      <IconButton
        aria-label={`Delete redirect for ${row.original.source}`}
        icon={<BiTrash />}
        variant="clear"
        colorScheme="critical"
        size="sm"
        onClick={() => onDeleteClick(row.original)}
      />
    ),
  }),
]

interface RedirectsTableProps {
  siteId: number
}

export const RedirectsTable = ({
  siteId,
}: RedirectsTableProps): JSX.Element => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const { mutate: deleteRedirect, isPending } = useDeleteRedirect()
  // Newest redirects first, matching the design's default sort on "Added"
  const [sorting, setSorting] = useState<SortingState>([
    { id: "publishedAt", desc: true },
  ])
  const [redirectToDelete, setRedirectToDelete] = useState<RedirectRow | null>(
    null,
  )

  const { data: totalRowCount, isLoading: isCountLoading } =
    useCountRedirects(siteId)

  const { limit, onPaginationChange, skip, pagination, pageCount } =
    useTablePagination({
      pageIndex: 0,
      pageSize: REDIRECTS_PAGE_SIZE,
      totalCount: totalRowCount,
    })

  // Rows are paginated server-side, so sorting must happen server-side too —
  // sorting only the visible page would be misleading
  const { data: redirects, isLoading } = useListRedirects(siteId, {
    limit,
    offset: skip,
    sortBy: (sorting[0]?.id ?? "publishedAt") as RedirectSortField,
    sortDirection: (sorting[0]?.desc ?? true) ? "desc" : "asc",
  })

  // Resolve the reference destinations on the visible page to permalinks for
  // display, in one batched request rather than per row
  const referenceDestinations = useMemo(
    () =>
      Array.from(
        new Set(
          redirects
            .map((redirect) => redirect.destination)
            .filter(isReferenceDestination),
        ),
      ),
    [redirects],
  )
  const { data: resolvedReferences } = useResolveRedirectReferences(
    siteId,
    referenceDestinations,
  )
  const permalinkByReference = useMemo(() => {
    const map = new Map<string, string | null>()
    resolvedReferences.forEach(({ reference, permalink }) =>
      map.set(reference, permalink),
    )
    return map
  }, [resolvedReferences])

  const columns = useMemo(
    () => getColumns(setRedirectToDelete, permalinkByReference),
    [permalinkByReference],
  )

  // Changing the sort order reshuffles rows across pages, so jump back to
  // the first page to avoid showing a stale slice
  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting(updater)
    onPaginationChange((prev) => ({ ...prev, pageIndex: 0 }))
  }

  // Deleting the last row of the last page leaves the page index past the
  // end — step back to the new last page
  useEffect(() => {
    if (pagination.pageIndex > 0 && pagination.pageIndex >= pageCount) {
      onPaginationChange((prev) => ({
        ...prev,
        pageIndex: Math.max(0, pageCount - 1),
      }))
    }
  }, [pagination.pageIndex, pageCount, onPaginationChange])

  const handleDelete = (redirect: RedirectRow) =>
    deleteRedirect(
      { siteId, id: redirect.id },
      {
        onSuccess: () => {
          setRedirectToDelete(null)
          toast({ ...SETTINGS_TOAST_MESSAGES.success, status: "success" })
        },
      },
    )

  const tableInstance = useReactTable<RedirectRow>({
    columns,
    data: redirects,
    state: { sorting, pagination },
    onSortingChange: handleSortingChange,
    manualPagination: true,
    manualSorting: true,
    // Only the first sort entry is sent to the API, so multi-sort (Shift+
    // click) would show headers as sorted without actually applying them
    enableMultiSort: false,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange,
    pageCount,
  })

  return (
    <Stack spacing="0.5rem">
      <Datatable
        pagination
        totalRowCount={totalRowCount}
        isFetching={isLoading || isCountLoading}
        emptyPlaceholder={
          <EmptyTablePlaceholder
            groupLabel="redirects"
            entityName="redirect"
            hasSearchTerm={false}
          />
        }
        instance={tableInstance}
        sx={{ tableLayout: "fixed" }}
      />
      <DeleteRedirectModal
        redirect={redirectToDelete}
        destinationLabel={
          redirectToDelete
            ? destinationLabelFor(
                getDestinationDisplay(
                  redirectToDelete.destination,
                  permalinkByReference,
                ),
              )
            : ""
        }
        isPending={isPending}
        onClose={() => setRedirectToDelete(null)}
        onDelete={handleDelete}
      />
    </Stack>
  )
}
