import type { ButtonProps } from "@opengovsg/design-system-react"
import { Skeleton, useDisclosure } from "@chakra-ui/react"
import { Button, TouchableTooltip } from "@opengovsg/design-system-react"
import posthog from "posthog-js"
import { Can } from "~/features/permissions"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

import { PublishModal } from "./PublishingModal"
import { CancelSchedulePublishIndicator } from "./PublishingModal/CancelSchedulePublishIndicator"

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

  return (
    <Can do="publish" on="Resource" passThrough>
      {({ isAllowed }) => (
        <TouchableTooltip
          hidden={isChangesPendingPublish}
          label="All changes have been published"
        >
          {isAllowed && (
            <>
              {/* Render the modal conditionally to ensure the schema resets when the modal is opened/closed */}
              {publishDisclosure.isOpen && (
                <PublishModal
                  pageId={pageId}
                  siteId={siteId}
                  {...publishDisclosure}
                />
              )}
              {currPage.scheduledAt ? (
                <CancelSchedulePublishIndicator
                  siteId={siteId}
                  pageId={pageId}
                />
              ) : (
                <Button
                  variant="solid"
                  size="sm"
                  isDisabled={!isChangesPendingPublish}
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
