import type { NavbarSchemaType } from "@opengovsg/isomer-components"
import { useState } from "react"
import { useToast } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import {
  SettingsEditorGridItem,
  SettingsGrid,
  SettingsPreviewGridItem,
} from "~/components/Settings"
import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { UnsavedSettingModal } from "~/features/editing-experience/components/UnsavedSettingModal"
import { siteSchema } from "~/features/editing-experience/schema"
import { EditNavbarPreview } from "~/features/settings/EditNavbarPreview"
import { NavbarEditor } from "~/features/settings/NavbarEditor"
import { useNavigationEffect } from "~/hooks/useNavigationEffect"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { trpc } from "~/utils/trpc"

const NavbarSettingsPage: NextPageWithLayout = () => {
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
  const isDirty = JSON.stringify(previewNavbarState) !== JSON.stringify(content)

  const handleSaveNavbar = (data: NavbarSchemaType | undefined) => {
    if (!data) return
    saveNavbar({ siteId: Number(siteId), navbar: JSON.stringify(data) })
  }

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  return (
    <>
      <UnsavedSettingModal
        isOpen={isOpen}
        onClose={() => setNextUrl("")}
        nextUrl={nextUrl}
      />

      <SettingsGrid>
        <SettingsEditorGridItem h="full">
          <NavbarEditor
            savedNavbarState={content}
            previewNavbarState={previewNavbarState}
            setPreviewNavbarState={setPreviewNavbarState}
            onSave={handleSaveNavbar}
            isSaving={isSavingNavbar}
          />
        </SettingsEditorGridItem>
        <SettingsPreviewGridItem>
          <EditNavbarPreview
            siteId={Number(siteId)}
            previewNavbarState={previewNavbarState}
          />
        </SettingsPreviewGridItem>
      </SettingsGrid>
    </>
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
