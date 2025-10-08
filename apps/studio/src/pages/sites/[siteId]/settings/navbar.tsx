import type { NavbarSchemaType } from "@opengovsg/isomer-components"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Grid, GridItem } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import isEqual from "lodash/isEqual"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { siteSchema } from "~/features/editing-experience/schema"
import { EditNavbarPreview } from "~/features/settings/EditNavbarPreview"
import { NavbarEditor } from "~/features/settings/NavbarEditor"
import { useNavigationEffect } from "~/hooks/useNavigationEffect"
import { useNewSettingsPage } from "~/hooks/useNewSettingsPage"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { trpc } from "~/utils/trpc"

const NavbarSettingsPage: NextPageWithLayout = () => {
  const isNewSettingsPageEnabled = useNewSettingsPage()
  const router = useRouter()
  const { siteId } = useQueryParse(siteSchema)
  const utils = trpc.useUtils()
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const [nextUrl, setNextUrl] = useState("")

  const [{ content }] = trpc.site.getNavbar.useSuspenseQuery({
    id: Number(siteId),
  })
  const { mutate: saveNavbar, isPending: isSavingNavbar } =
    trpc.site.setNavbar.useMutation({
      onSuccess: async () => {
        await utils.site.getNavbar.invalidate({ id: Number(siteId) })
        toast({
          status: "success",
          title: "Navigation menu saved successfully",
          description: "Check your site in 5-10 minutes to view it live.",
        })
      },
      onError: () => {
        toast({
          status: "error",
          title: "Error saving navigation menu!",
          description: `If this persists, please report this issue at ${ISOMER_SUPPORT_EMAIL}`,
        })
      },
    })

  const [previewNavbarState, setPreviewNavbarState] = useState<
    NavbarSchemaType | undefined
  >(content)
  const isOpen = !!nextUrl
  const isDirty = !isEqual(content, previewNavbarState)

  const handleSaveNavbar = (data: NavbarSchemaType | undefined) => {
    if (!data) return
    saveNavbar({ siteId: Number(siteId), navbar: JSON.stringify(data) })
  }

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  useEffect(() => {
    if (!isNewSettingsPageEnabled) {
      void router.push(`/sites/${siteId}/settings`)
    }
  }, [isNewSettingsPageEnabled, router, siteId])

  return (
    <Grid h="full" w="100%" templateColumns="minmax(37.25rem, 1fr) 1fr" gap={0}>
      <GridItem colSpan={1} overflow="auto" minW="30rem" h="full">
        <NavbarEditor
          savedNavbarState={content}
          previewNavbarState={previewNavbarState}
          setPreviewNavbarState={setPreviewNavbarState}
          onSave={handleSaveNavbar}
          isSaving={isSavingNavbar}
        />
      </GridItem>
      <GridItem colSpan={1}>
        <EditNavbarPreview
          siteId={Number(siteId)}
          previewNavbarState={previewNavbarState}
        />
      </GridItem>
    </Grid>
  )
}

NavbarSettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteSettingsLayout(page)}
    />
  )
}

export default NavbarSettingsPage
