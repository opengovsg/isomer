import { useParams } from "next/navigation"
import { Button, useToast } from "@opengovsg/design-system-react"
import { BiLogoDevTo } from "react-icons/bi"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useIsIsomerAdmin } from "~/features/permissions/hooks/useIsIsomerAdmin"
import { trpc } from "~/utils/trpc"

export const AdminCreateIndexPageButton = () => {
  const params = useParams()
  const toast = useToast()
  const utils = trpc.useUtils()
  const isIsomerAdmin = useIsIsomerAdmin()

  // Validate required parameters
  const siteId = params.siteId
  const parentId = params.folderId ?? params.resourceId

  const { data: indexPageId } = trpc.resource.getIndexPage.useQuery({
    siteId: Number(siteId),
    parentId: String(parentId),
  })

  const hasIndexPage = !!indexPageId

  const { mutate: createIndexPage, isLoading } =
    trpc.page.createIndexPage.useMutation({
      onSuccess: async () => {
        // Invalidate only the necessary queries
        await Promise.all([
          utils.resource.getChildrenOf.invalidate({
            siteId: String(siteId),
            resourceId: String(parentId),
          }),
          utils.resource.listWithoutRoot.invalidate({ siteId: Number(siteId) }),
          utils.collection.list.invalidate({ siteId: Number(siteId) }),
        ])
        toast({
          status: "success",
          title: "Index page created successfully",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
      onError: (error) => {
        toast({
          status: "error",
          title: "Failed to create index page",
          description: error.message,
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

  const handleCreateIndexPage = () => {
    if (!siteId || !parentId) {
      toast({
        status: "error",
        title: "Missing required parameters",
        description: "Site ID and parent ID are required",
        ...BRIEF_TOAST_SETTINGS,
      })
      return
    }

    createIndexPage({
      siteId: Number(siteId),
      parentId: String(parentId),
    })
  }

  if (!siteId || !parentId || !isIsomerAdmin) return null
  return (
    <Button
      variant="outline"
      size="md"
      isDisabled={isLoading || hasIndexPage}
      isLoading={isLoading}
      onClick={handleCreateIndexPage}
      leftIcon={<BiLogoDevTo fontSize="1rem" />}
      aria-label="Create index page"
    >
      Add index page
    </Button>
  )
}
