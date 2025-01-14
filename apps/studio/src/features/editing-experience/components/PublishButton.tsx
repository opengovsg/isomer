import { Skeleton } from "@chakra-ui/react"
import {
  Button,
  TouchableTooltip,
  useToast,
} from "@opengovsg/design-system-react"

import { Can } from "~/features/permissions"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

interface PublishButtonProps {
  pageId: number
  siteId: number
}

const SuspendablePublishButton = ({
  pageId,
  siteId,
}: PublishButtonProps): JSX.Element => {
  const toast = useToast()
  const utils = trpc.useUtils()

  const [currPage] = trpc.page.readPage.useSuspenseQuery({ pageId, siteId })

  const publishFailureMsg =
    "Failed to publish page. Please contact Isomer support."
  const publishSuccessMsg = "Page published successfully"

  const { mutate, isLoading } = trpc.page.publishPage.useMutation({
    onSuccess: async () => {
      toast({
        status: "success",
        title: publishSuccessMsg,
        isClosable: true,
      })
      await utils.page.readPage.invalidate({ pageId, siteId })
    },
    onError: async (error) => {
      console.error(`Error occurred when publishing page: ${error.message}`)
      toast({
        status: "error",
        title: publishFailureMsg,
        isClosable: true,
      })
      await utils.page.readPage.invalidate({ pageId, siteId })
    },
  })

  const handlePublish = () => {
    const coercedSiteId = Number(siteId)
    const coercedPageId = Number(pageId)
    if (coercedSiteId && coercedPageId)
      mutate({ pageId: coercedPageId, siteId: coercedSiteId })
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
              isDisabled={!isChangesPendingPublish}
              variant="solid"
              size="sm"
              onClick={handlePublish}
              isLoading={isLoading}
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
