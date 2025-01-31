import { useMemo } from "react"
import { useParams } from "next/navigation"
import { Button, useToast } from "@opengovsg/design-system-react"
import { ISOMER_ADMINS, ISOMER_MIGRATORS } from "~prisma/constants"
import { BiLogoDevTo } from "react-icons/bi"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useMe } from "~/features/me/api"
import { trpc } from "~/utils/trpc"

const useIsIsomerAdmin = () => {
  const {
    me: { email },
  } = useMe()
  const [username = "", domain = ""] = email.split("@")
  return useMemo(() => {
    return (
      domain === "open.gov.sg" &&
      (ISOMER_ADMINS.includes(username) || ISOMER_MIGRATORS.includes(username))
    )
  }, [domain, username])
}

export const AdminCreateIndexPageButton = () => {
  const params = useParams()
  // if folder, uses resourceId. Else use resourceId if collection
  const parentId = params.folderId ?? params.resourceId
  const siteId = params.siteId

  const toast = useToast()
  const utils = trpc.useUtils()

  const isIsomerAdmin = useIsIsomerAdmin()

  const { data: indexPageId } = trpc.resource.getIndexPage.useQuery({
    siteId: Number(siteId),
    parentId: String(parentId),
  })
  const hasIndexPage = useMemo(() => !!indexPageId, [indexPageId])

  const { mutate: createIndexPage, isLoading } =
    trpc.page.createIndexPage.useMutation({
      onSuccess: async () => {
        // Invalidate queries to refresh the data
        await utils.resource.getChildrenOf.invalidate()
        await utils.resource.listWithoutRoot.invalidate()
        await utils.collection.list.invalidate()

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

  if (!isIsomerAdmin) return null

  return (
    <Button
      variant="outline"
      size="md"
      isDisabled={isLoading || hasIndexPage}
      isLoading={isLoading}
      onClick={() =>
        createIndexPage({
          siteId: Number(params.siteId),
          parentId: parentId as string,
        })
      }
      leftIcon={<BiLogoDevTo fontSize="1rem" />}
    >
      Add index page
    </Button>
  )
}
