import type { ButtonProps } from "@opengovsg/design-system-react"
import { useEffect } from "react"
import { Skeleton } from "@chakra-ui/react"
import {
  Button,
  TouchableTooltip,
  useToast,
} from "@opengovsg/design-system-react"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { Can } from "~/features/permissions"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

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

  const [currPage] = trpc.page.readPage.useSuspenseQuery({ pageId, siteId })

  const publishFailureMsg =
    "Failed to publish page. Please contact Isomer support."
  const publishSuccessMsg = "Page published successfully"

  const publishPageMutation = trpc.page.publishPage.useMutation()

  useEffect(() => {
    if (publishPageMutation.isSuccess) {
      toast({
        status: "success",
        title: publishSuccessMsg,
        ...BRIEF_TOAST_SETTINGS,
      })
      void utils.page.readPage.invalidate({ pageId, siteId })
      void utils.page.getCategories.invalidate({ pageId, siteId })
      void utils.site.getLocalisedSitemap.invalidate({
        resourceId: pageId,
        siteId,
      })
    }
  }, [publishPageMutation.isSuccess])

  useEffect(() => {
    if (publishPageMutation.isError) {
      console.error(
        `Error occurred when publishing page: ${publishPageMutation.error.message}`,
      )
      toast({
        status: "error",
        title: publishFailureMsg,
        ...BRIEF_TOAST_SETTINGS,
      })
      void utils.page.readPage.invalidate({ pageId, siteId })
    }
  }, [publishPageMutation.isError, publishPageMutation.error])

  const handlePublish = () => {
    const coercedSiteId = Number(siteId)
    const coercedPageId = Number(pageId)
    if (coercedSiteId && coercedPageId)
      publishPageMutation.mutate({
        pageId: coercedPageId,
        siteId: coercedSiteId,
      })
  }

  const isChangesPendingPublish = !!currPage.draftBlobId

  return (
    <Can do="publish" on="Resource" passThrough>
      {(allowed) => (
        <TouchableTooltip
          hidden={isChangesPendingPublish}
          label="All changes have been published"
        >
          {allowed && (
            <Button
              isDisabled={!isChangesPendingPublish || isDisabled}
              variant="solid"
              size="sm"
              onClick={(e) => {
                handlePublish()
                onClick?.(e)
              }}
              isLoading={publishPageMutation.isLoading}
              {...rest}
            >
              Publish
            </Button>
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
