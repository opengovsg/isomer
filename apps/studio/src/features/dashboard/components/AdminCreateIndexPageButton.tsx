import { useEffect } from "react"
import { Tooltip } from "@chakra-ui/react"
import { Button, useToast } from "@opengovsg/design-system-react"
import { BiLogoDevTo } from "react-icons/bi"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { ADMIN_ROLE } from "~/lib/growthbook"
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
  const isUserIsomerAdmin = useIsUserIsomerAdmin({
    roles: [ADMIN_ROLE.CORE, ADMIN_ROLE.MIGRATORS],
  })

  const { data: indexPage } = trpc.resource.getIndexPage.useQuery({
    siteId,
    parentId: String(parentId),
  })

  const hasIndexPage = !!indexPage

  const createIndexPageMutation = trpc.page.createIndexPage.useMutation()

  useEffect(() => {
    if (createIndexPageMutation.isSuccess) {
      void utils.resource.getChildrenOf.invalidate({
        siteId: String(siteId),
        resourceId: String(parentId),
      })
      void utils.resource.listWithoutRoot.invalidate({ siteId: Number(siteId) })
      void utils.collection.list.invalidate({ siteId: Number(siteId) })
      void utils.resource.getIndexPage.invalidate({
        siteId,
        parentId: String(parentId),
      })
      toast({
        status: "success",
        title: "Index page created successfully",
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }, [createIndexPageMutation.isSuccess, siteId, parentId])

  useEffect(() => {
    if (createIndexPageMutation.isError) {
      toast({
        status: "error",
        title: "Failed to create index page",
        description: createIndexPageMutation.error.message,
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }, [createIndexPageMutation.isError, createIndexPageMutation.error])

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
        isDisabled={createIndexPageMutation.isPending || hasIndexPage}
        isLoading={createIndexPageMutation.isPending}
        onClick={() =>
          createIndexPageMutation.mutate({
            siteId,
            parentId: String(parentId),
          })
        }
        leftIcon={<BiLogoDevTo fontSize="1rem" />}
        aria-label="Create index page"
      >
        Add index page
      </Button>
    </Tooltip>
  )
}
