import { HStack, Skeleton } from "@chakra-ui/react"
import { DraftIndicator } from "~/components/DraftIndicator"
import { LiveStatusBadges } from "~/components/LiveStatusBadges"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

interface PageStatusIndicatorsProps {
  pageId: number
  siteId: number
}

const SuspendablePageStatusIndicators = ({
  pageId,
  siteId,
}: PageStatusIndicatorsProps): JSX.Element => {
  const [currPage] = trpc.page.readPage.useSuspenseQuery({ pageId, siteId })
  const isIndexPage = currPage.type === ResourceType.IndexPage

  // Shares the query key the dashboard uses for LiveStatusBadges (see
  // PageMoreActionsButton.tsx), so this reuses a warm cache when navigating
  // in from the dashboard, or fetches fresh on a direct link.
  const { data: parentIndexPageInfo } = trpc.folder.getIndexpage.useQuery(
    { siteId, resourceId: currPage.parentId ?? "" },
    { enabled: isIndexPage },
  )

  const ownLiveStatus =
    currPage.publishedVersionId !== null ? "live" : "notLive"
  const liveStatus = isIndexPage
    ? (parentIndexPageInfo?.liveStatus ?? ownLiveStatus)
    : ownLiveStatus

  return (
    <HStack spacing="1rem">
      <LiveStatusBadges
        liveStatus={liveStatus}
        scheduledAt={currPage.scheduledAt}
        scheduledAction={currPage.scheduledAction}
      />
      <DraftIndicator draftBlobId={currPage.draftBlobId} />
    </HStack>
  )
}

export const PageStatusIndicators = withSuspense(
  SuspendablePageStatusIndicators,
  <Skeleton width="6rem" height="1.25rem" />,
)
