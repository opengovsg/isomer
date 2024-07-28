import { useToast } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

import { trpc } from "~/utils/trpc"

interface PublishButtonProps {
  pageId?: string
  siteId?: string
}

const PublishButton = ({ pageId, siteId }: PublishButtonProps): JSX.Element => {
  const toast = useToast()
  const { mutate, isLoading } = trpc.page.publishPage.useMutation({
    onSuccess: (data) => {
      if (data.versionId) {
        toast({
          status: "success",
          title: "Page published successfully",
        })
      } else {
        toast({
          status: "error",
          title: data.error,
        })
      }
    },
    onError: () => {
      toast({
        status: "error",
        title: "Failed to publish page",
      })
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
    >
      Publish
    </Button>
  )
}

export default PublishButton
