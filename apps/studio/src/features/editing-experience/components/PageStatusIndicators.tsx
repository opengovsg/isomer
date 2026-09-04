import { HStack, Skeleton } from "@chakra-ui/react"
import { DraftIndicator } from "~/components/DraftIndicator"
import { LiveStatusBadges } from "~/components/LiveStatusBadges"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

interface PageStatusIndicatorsProps {
  pageId: number
  siteId: number
}

const SuspendablePageStatusIndicators = ({
  pageId,
  siteId,
}: PageStatusIndicatorsProps): JSX.Element => {
  const [currPage] = trpc.page.readPage.useSuspenseQuery({ pageId, siteId })

  return (
    <HStack spacing="1rem">
      <LiveStatusBadges
        liveStatus={currPage.publishedVersionId !== null ? "live" : "notLive"}
        scheduledAt={currPage.scheduledAt}
        scheduledAction={currPage.scheduledAction}
        lastPublishedAt={currPage.lastPublishedAt}
      />
      <DraftIndicator draftBlobId={currPage.draftBlobId} />
    </HStack>
  )
}

export const PageStatusIndicators = withSuspense(
  SuspendablePageStatusIndicators,
  <Skeleton width="6rem" height="1.25rem" />,
)
