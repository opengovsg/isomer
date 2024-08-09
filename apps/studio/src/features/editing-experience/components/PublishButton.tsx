import { Skeleton, useToast } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

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
    onSuccess: async (data) => {
      if (data.versionId) {
        toast({
          status: "success",
          title: publishSuccessMsg,
        })
      } else {
        console.error(data.error)
        toast({
          status: "error",
          title: publishFailureMsg,
        })
      }
      await utils.page.readPage.invalidate({ pageId, siteId })
    },
    onError: async (error) => {
      console.error(`Error occurred when publishing page: ${error.message}`)
      toast({
        status: "error",
        title: publishFailureMsg,
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
  return (
    <Button
      variant="solid"
      size="sm"
      onClick={handlePublish}
      isLoading={isLoading}
      isDisabled={!currPage.draftBlobId}
    >
      Publish
    </Button>
  )
}

const PublishButton = withSuspense(
  SuspendablePublishButton,
  <Skeleton width={"100%"} height={"100%"} />,
)
export default PublishButton
