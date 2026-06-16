import {
  Box,
  HStack,
  Spinner,
  Stack,
  Text,
  useClipboard,
} from "@chakra-ui/react"
import { Button, useToast } from "@opengovsg/design-system-react"
import { trpc } from "~/utils/trpc"

interface ExistingPreviewLinksListProps {
  siteId: number
  resourceId: number
}

const SGT_TIMEZONE = "Asia/Singapore"

const formatSgt = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat("en-SG", {
    timeZone: SGT_TIMEZONE,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  return formatter.format(date)
}

export const ExistingPreviewLinksList = ({
  siteId,
  resourceId,
}: ExistingPreviewLinksListProps): JSX.Element | null => {
  const utils = trpc.useUtils()
  const toast = useToast()

  const { data, isLoading } = trpc.previewLink.listForPage.useQuery({
    siteId,
    resourceId,
  })

  const revoke = trpc.previewLink.revoke.useMutation({
    onSuccess: async () => {
      await utils.previewLink.listForPage.invalidate({ siteId, resourceId })
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

  if (isLoading) return <Spinner size="sm" />
  if (!data || data.length === 0) return null

  return (
    <Stack spacing="0.5rem">
      <Text fontSize="sm" fontWeight="600">
        Active preview links for this page
      </Text>
      <Stack spacing="0.5rem">
        {data.map((row) => (
          <ExistingPreviewLinkRow
            key={row.id}
            row={row}
            onRevoke={() => revoke.mutate({ linkId: row.id })}
            isRevoking={revoke.isPending && revoke.variables?.linkId === row.id}
          />
        ))}
      </Stack>
    </Stack>
  )
}

interface ExistingPreviewLinkRowProps {
  row: {
    id: string
    url: string
    label: string | null
    expiresAt: Date | string
    createdAt: Date | string
    viewCount: number
    lastViewedAt: Date | string | null
  }
  onRevoke: () => void
  isRevoking: boolean
}

const ExistingPreviewLinkRow = ({
  row,
  onRevoke,
  isRevoking,
}: ExistingPreviewLinkRowProps): JSX.Element => {
  const { onCopy, hasCopied } = useClipboard(row.url)

  return (
    <Box
      borderWidth="1px"
      borderColor="base.divider.medium"
      borderRadius="md"
      p="0.75rem"
    >
      <Stack spacing="0.25rem">
        <HStack justify="space-between" align="flex-start">
          <Stack spacing="0.125rem" minW={0}>
            <Text fontSize="sm" fontWeight="500" noOfLines={1}>
              {row.label ?? "Untitled preview"}
            </Text>
            <Text fontSize="xs" color="base.content.medium">
              Expires {formatSgt(new Date(row.expiresAt))} · {row.viewCount}{" "}
              view{row.viewCount === 1 ? "" : "s"}
              {row.lastViewedAt
                ? ` · last viewed ${formatSgt(new Date(row.lastViewedAt))}`
                : ""}
            </Text>
          </Stack>
          <HStack spacing="0.25rem">
            <Button size="xs" variant="clear" onClick={onCopy}>
              {hasCopied ? "Copied" : "Copy"}
            </Button>
            <Button
              size="xs"
              variant="clear"
              colorScheme="critical"
              onClick={onRevoke}
              isLoading={isRevoking}
            >
              Revoke
            </Button>
          </HStack>
        </HStack>
      </Stack>
    </Box>
  )
}
