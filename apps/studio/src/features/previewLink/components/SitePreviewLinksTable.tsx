import type { PreviewLinkStatusFilter } from "~/schemas/previewLink"
import {
  HStack,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useClipboard,
} from "@chakra-ui/react"
import { Button, useToast } from "@opengovsg/design-system-react"
import { useState } from "react"
import { PREVIEW_LINK_STATUS_FILTERS } from "~/schemas/previewLink"
import { trpc } from "~/utils/trpc"

interface SitePreviewLinksTableProps {
  siteId: number
}

const SGT_TIMEZONE = "Asia/Singapore"
const formatSgt = (value: Date | string | null): string => {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("en-SG", {
    timeZone: SGT_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

const STATUS_LABEL: Record<PreviewLinkStatusFilter, string> = {
  active: "Active",
  expired: "Expired",
  revoked: "Revoked",
  all: "All",
}

const computeStatus = (row: {
  revokedAt: Date | string | null
  expiresAt: Date | string
}): "Active" | "Expired" | "Revoked" => {
  if (row.revokedAt !== null) return "Revoked"
  const expiry =
    typeof row.expiresAt === "string" ? new Date(row.expiresAt) : row.expiresAt
  if (expiry <= new Date()) return "Expired"
  return "Active"
}

export const SitePreviewLinksTable = ({
  siteId,
}: SitePreviewLinksTableProps): JSX.Element => {
  const [status, setStatus] = useState<PreviewLinkStatusFilter>("active")
  const toast = useToast()
  const utils = trpc.useUtils()

  const { data, isLoading } = trpc.previewLink.listForSite.useQuery({
    siteId,
    status,
  })

  const revoke = trpc.previewLink.revoke.useMutation({
    onSuccess: async () => {
      await utils.previewLink.listForSite.invalidate({ siteId, status })
    },
    onError: (err) => {
      toast({
        title: "Couldn't revoke",
        description: err.message,
        status: "error",
        isClosable: true,
      })
    },
  })

  return (
    <Stack spacing="1rem" w="100%">
      <HStack spacing="0.5rem" wrap="wrap">
        {PREVIEW_LINK_STATUS_FILTERS.map((option) => (
          <Button
            key={option}
            size="xs"
            variant={status === option ? "solid" : "clear"}
            onClick={() => {
              setStatus(option)
            }}
          >
            {STATUS_LABEL[option]}
          </Button>
        ))}
      </HStack>

      {isLoading ? (
        <Skeleton h="6rem" />
      ) : !data || data.links.length === 0 ? (
        <Text color="base.content.medium" fontSize="sm">
          No preview links match this filter.
        </Text>
      ) : (
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Page</Th>
              <Th>Label</Th>
              {data.viewerIsAdmin ? <Th>Sharer</Th> : null}
              <Th>Created</Th>
              <Th>Expires</Th>
              <Th>Last viewed</Th>
              <Th isNumeric>Views</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.links.map((row) => {
              const rowStatus = computeStatus(row)
              const canRevoke =
                rowStatus === "Active" && (row.isOwnLink || data.viewerIsAdmin)
              return (
                <SitePreviewLinksRow
                  key={row.id}
                  row={row}
                  status={rowStatus}
                  showSharer={data.viewerIsAdmin}
                  canRevoke={canRevoke}
                  onRevoke={() => revoke.mutate({ linkId: row.id })}
                  isRevoking={
                    revoke.isPending && revoke.variables?.linkId === row.id
                  }
                />
              )
            })}
          </Tbody>
        </Table>
      )}
    </Stack>
  )
}

interface SitePreviewLinksRowProps {
  row: {
    id: string
    url: string
    pageTitle: string | null
    resourceId: string | null
    label: string | null
    sharerName: string | null
    sharerEmail: string | null
    createdAt: Date | string
    expiresAt: Date | string
    lastViewedAt: Date | string | null
    viewCount: number
  }
  status: "Active" | "Expired" | "Revoked"
  showSharer: boolean
  canRevoke: boolean
  onRevoke: () => void
  isRevoking: boolean
}

const SitePreviewLinksRow = ({
  row,
  status,
  showSharer,
  canRevoke,
  onRevoke,
  isRevoking,
}: SitePreviewLinksRowProps): JSX.Element => {
  const { onCopy, hasCopied } = useClipboard(row.url)
  return (
    <Tr>
      <Td>{row.pageTitle ?? "—"}</Td>
      <Td>{row.label ?? "—"}</Td>
      {showSharer ? <Td>{row.sharerName ?? row.sharerEmail ?? "—"}</Td> : null}
      <Td>{formatSgt(row.createdAt)}</Td>
      <Td>{formatSgt(row.expiresAt)}</Td>
      <Td>{formatSgt(row.lastViewedAt)}</Td>
      <Td isNumeric>{row.viewCount}</Td>
      <Td>{status}</Td>
      <Td>
        <HStack spacing="0.25rem">
          <Button size="xs" variant="clear" onClick={onCopy}>
            {hasCopied ? "Copied" : "Copy"}
          </Button>
          {canRevoke ? (
            <Button
              size="xs"
              variant="clear"
              colorScheme="critical"
              onClick={onRevoke}
              isLoading={isRevoking}
            >
              Revoke
            </Button>
          ) : null}
        </HStack>
      </Td>
    </Tr>
  )
}
