import type { ButtonProps } from "@opengovsg/design-system-react"
import { Skeleton, useDisclosure } from "@chakra-ui/react"
import { Button, TouchableTooltip } from "@opengovsg/design-system-react"
import posthog from "posthog-js"
import { Can } from "~/features/permissions"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"
import { ScheduledAction } from "~prisma/generated/generatedEnums"

import { CancelSchedulePublishIndicator } from "./PublishingModal/CancelSchedulePublishIndicator"
import { PublishOrUnpublishModal } from "./PublishOrUnpublishModal"

interface PublishButtonProps extends ButtonProps {
  pageId: number
  siteId: number
}

const SuspendablePublishButton = ({
  pageId,
  siteId,
  ...rest
}: PublishButtonProps): JSX.Element => {
  const publishDisclosure = useDisclosure()

  const [currPage] = trpc.page.readPage.useSuspenseQuery({ pageId, siteId })
  const isChangesPendingPublish = !!currPage.draftBlobId
  // A null scheduledAction on a legacy row defaults to Publish.
  const isScheduledToPublish =
    !!currPage.scheduledAt &&
    currPage.scheduledAction !== ScheduledAction.Unpublish
  const isScheduledToUnpublish =
    !!currPage.scheduledAt &&
    currPage.scheduledAction === ScheduledAction.Unpublish

  // The server blocks publishing while a scheduled unpublish is pending;
  // surface that upfront instead of after the user submits.
  const disabledReason = isScheduledToUnpublish
    ? "This page has a scheduled unpublish. Cancel it before publishing."
    : !isChangesPendingPublish
      ? "All changes have been published"
      : undefined

  return (
    <Can do="publish" on="Resource" passThrough>
      {({ isAllowed }) => (
        <TouchableTooltip hidden={!disabledReason} label={disabledReason}>
          {isAllowed && (
            <>
              {/* Render the modal conditionally to ensure the schema resets when the modal is opened/closed */}
              {publishDisclosure.isOpen && (
                <PublishOrUnpublishModal
                  action="publish"
                  pageId={pageId}
                  siteId={siteId}
                  {...publishDisclosure}
                />
              )}
              {isScheduledToPublish ? (
                <CancelSchedulePublishIndicator
                  siteId={siteId}
                  pageId={pageId}
                />
              ) : (
                <Button
                  variant="solid"
                  size="sm"
                  isDisabled={!!disabledReason}
                  onClick={() => {
                    posthog.capture("publish_modal_opened", {
                      site_id: siteId,
                    })
                    publishDisclosure.onOpen()
                  }}
                  {...rest}
                >
                  Publish
                </Button>
              )}
            </>
          )}
        </TouchableTooltip>
      )}
    </Can>
  )
}

const PublishButton = withSuspense(
  SuspendablePublishButton,
  <Skeleton width="100%" height="100%" />,
)
export default PublishButton
