import type { SortingState } from "@tanstack/react-table"
import {
  Box,
  HStack,
  Icon,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverTrigger,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import { useMemo, useState } from "react"
import {
  BiDownArrowAlt,
  BiSortAlt2,
  BiTrash,
  BiUpArrowAlt,
} from "react-icons/bi"
import { TableHeader } from "~/components/Datatable"
import { Datatable } from "~/components/Datatable/Datatable"
import { EmptyTablePlaceholder } from "~/components/Datatable/EmptyTablePlaceholder"

import type { RedirectRow } from "../types"
import { useDeleteRedirect, useListRedirects } from "../api"
import { RedirectStatusBadge } from "./RedirectStatusBadge"

const columnsHelper = createColumnHelper<RedirectRow>()

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

const getColumns = (onDelete: (id: string) => void) => [
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
      <Tooltip label={getValue()} openDelay={500} placement="top">
        <Text
          textStyle="body-2"
          color="base.content.strong"
          noOfLines={1}
          wordBreak="break-all"
        >
          {getValue()}
        </Text>
      </Tooltip>
    ),
  }),
  columnsHelper.accessor("publishedAt", {
    size: 160,
    enableSorting: true,
    sortUndefined: "last",
    header: ({ column }) => (
      <SortableHeader
        label="Published"
        isSorted={column.getIsSorted()}
        onClick={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ getValue }) => {
      const val = getValue()
      return (
        <Text textStyle="body-2" color="base.content.medium">
          {val
            ? formatDistanceToNow(val, { addSuffix: true })
            : "not published yet"}
        </Text>
      )
    },
  }),
  columnsHelper.accessor("status", {
    size: 120,
    enableSorting: false,
    header: () => (
      <TableHeader textStyle="subhead-2" color="base.content.medium">
        Status
      </TableHeader>
    ),
    cell: ({ getValue }) => <RedirectStatusBadge status={getValue()} />,
  }),
  columnsHelper.display({
    id: "delete",
    size: 80,
    enableSorting: false,
    header: () => (
      <TableHeader textStyle="subhead-2" color="base.content.medium">
        Delete
      </TableHeader>
    ),
    cell: ({ row }) => <DeleteCell id={row.original.id} onDelete={onDelete} />,
  }),
]

function DeleteCell({
  id,
  onDelete,
}: {
  id: string
  onDelete: (id: string) => void
}): JSX.Element {
  return (
    <Popover isLazy placement="left">
      {({ onClose }) => (
        <>
          <PopoverTrigger>
            <IconButton
              aria-label="Delete redirect"
              icon={<BiTrash />}
              variant="clear"
              colorScheme="critical"
              size="sm"
            />
          </PopoverTrigger>
          <PopoverContent>
            <PopoverArrow />
            <PopoverBody>
              <Text textStyle="body-2">Delete this redirect?</Text>
            </PopoverBody>
            <PopoverFooter>
              <HStack justifyContent="flex-end" spacing="0.5rem">
                <Button variant="clear" size="xs" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="critical"
                  size="xs"
                  onClick={() => {
                    onDelete(id)
                    onClose()
                  }}
                >
                  Delete
                </Button>
              </HStack>
            </PopoverFooter>
          </PopoverContent>
        </>
      )}
    </Popover>
  )
}

interface RedirectsTableProps {
  siteId: number
}

export const RedirectsTable = ({
  siteId,
}: RedirectsTableProps): JSX.Element => {
  const { data: redirects, isLoading } = useListRedirects(siteId)
  const { mutate: deleteRedirect } = useDeleteRedirect()
  const [sorting, setSorting] = useState<SortingState>([])

  const handleDelete = (id: string) => deleteRedirect({ siteId, id })

  const columns = useMemo(() => getColumns(handleDelete), [handleDelete])

  const tableInstance = useReactTable<RedirectRow>({
    columns,
    data: redirects,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <Stack spacing="0.5rem">
      <Datatable
        isFetching={isLoading}
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
    </Stack>
  )
}
