import { Tooltip } from "@chakra-ui/react"
import { Button, useToast } from "@opengovsg/design-system-react"
import { BiLogoDevTo } from "react-icons/bi"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { trpc } from "~/utils/trpc"

interface AdminCreateIndexPageButtonProps {
  siteId: number
  parentId: number
}
export const AdminCreateIndexPageButton = ({
  siteId,
  parentId,
}: AdminCreateIndexPageButtonProps) => {
  const toast = useToast()
  const utils = trpc.useUtils()
  const isUserIsomerAdmin = useIsUserIsomerAdmin()

  const { data: indexPage } = trpc.resource.getIndexPage.useQuery({
    siteId,
    parentId: String(parentId),
  })

  const hasIndexPage = !!indexPage

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
          utils.resource.getIndexPage.invalidate({
            siteId,
            parentId: String(parentId),
          }),
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

  if (!isUserIsomerAdmin) return null
  return (
    <Tooltip
      label={
        hasIndexPage ? "Index page already exists" : "For Isomer Admins only"
      }
      placement="top"
    >
      <Button
        variant="outline"
        size="md"
        isDisabled={isLoading || hasIndexPage}
        isLoading={isLoading}
        onClick={() => createIndexPage({ siteId, parentId: String(parentId) })}
        leftIcon={<BiLogoDevTo fontSize="1rem" />}
        aria-label="Create index page"
      >
        Add index page
      </Button>
    </Tooltip>
  )
}
