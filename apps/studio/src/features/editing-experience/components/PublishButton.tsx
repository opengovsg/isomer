import type { ButtonProps } from "@opengovsg/design-system-react"
import { Skeleton, useDisclosure } from "@chakra-ui/react"
import { useFeatureIsOn } from "@growthbook/growthbook-react"
import {
  Button,
  TouchableTooltip,
  useToast,
} from "@opengovsg/design-system-react"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { Can } from "~/features/permissions"
import { withSuspense } from "~/hocs/withSuspense"
import { ENABLE_SCHEDULED_PUBLISHING_FEATURE_KEY } from "~/lib/growthbook"
import { trpc } from "~/utils/trpc"
import { CancelSchedulePublishIndicator } from "./CancelSchedulePublishIndicator"
import { ScheduledPublishingModal } from "./ScheduledPublishingModal"

interface PublishButtonProps extends ButtonProps {
  pageId: number
  siteId: number
}

const SuspendablePublishButton = ({
  pageId,
  siteId,
  isDisabled,
  onClick,
  ...rest
}: PublishButtonProps): JSX.Element => {
  const toast = useToast()
  const utils = trpc.useUtils()
  const scheduledPublishingDisclosure = useDisclosure()
  const enableScheduledPublishing = useFeatureIsOn(
    ENABLE_SCHEDULED_PUBLISHING_FEATURE_KEY,
  )
  const [currPage] = trpc.page.readPage.useSuspenseQuery({ pageId, siteId })

  const { mutate, isPending } = trpc.page.publishPage.useMutation({
    onSettled: async () => {
      await utils.page.readPage.refetch({ pageId, siteId })
      if (scheduledPublishingDisclosure.isOpen) {
        scheduledPublishingDisclosure.onClose()
      }
    },
    onSuccess: async () => {
      toast({
        status: "success",
        title: "Page published successfully",
        ...BRIEF_TOAST_SETTINGS,
      })
      await utils.page.getCategories.invalidate({ pageId, siteId })
      await utils.site.getLocalisedSitemap.invalidate({
        resourceId: pageId,
        siteId,
      })
    },
    onError: (error) => {
      console.error(`Error occurred when publishing page: ${error.message}`)
      toast({
        status: "error",
        title: "Failed to publish page. Please contact Isomer support.",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const isChangesPendingPublish = !!currPage.draftBlobId

  return (
    <Can do="publish" on="Resource" passThrough>
      {(allowed) => (
        <TouchableTooltip
          hidden={isChangesPendingPublish}
          label="All changes have been published"
        >
          {allowed && (
            <>
              {/* Render the modal conditionally to ensure the schema resets when the modal is opened/closed */}
              {scheduledPublishingDisclosure.isOpen && (
                <ScheduledPublishingModal
                  {...scheduledPublishingDisclosure}
                  siteId={siteId}
                  pageId={pageId}
                  onPublishNow={(pageId, siteId) => mutate({ pageId, siteId })}
                  isPublishingNow={isPending}
                />
              )}
              {!currPage.scheduledAt ? (
                <Button
                  isDisabled={!isChangesPendingPublish || isDisabled}
                  variant="solid"
                  size="sm"
                  onClick={(e) => {
                    if (enableScheduledPublishing) {
                      scheduledPublishingDisclosure.onOpen()
                    } else {
                      mutate({ pageId, siteId })
                      onClick?.(e)
                    }
                  }}
                  isLoading={isPending}
                  {...rest}
                >
                  Publish
                </Button>
              ) : (
                <CancelSchedulePublishIndicator
                  siteId={siteId}
                  pageId={pageId}
                  scheduledAt={currPage.scheduledAt}
                />
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
