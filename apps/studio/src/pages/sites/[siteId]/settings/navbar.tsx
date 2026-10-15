import type { NavbarSchemaType } from "@opengovsg/isomer-components"
import type { NextPageWithLayout } from "~/lib/types"
import { useToast } from "@opengovsg/design-system-react"
import { isEqual } from "lodash-es"
import { useState } from "react"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import {
  SettingsEditorGridItem,
  SettingsGrid,
  SettingsPreviewGridItem,
} from "~/components/Settings"
import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
import {
  BRIEF_TOAST_SETTINGS,
  SETTINGS_TOAST_MESSAGES,
} from "~/constants/toast"
import { UnsavedSettingsGuard } from "~/features/editing-experience/components/UnsavedSettingsGuard"
import { siteSchema } from "~/features/editing-experience/schema"
import { EditNavbarPreview } from "~/features/settings/EditNavbarPreview"
import { NavbarEditor } from "~/features/settings/NavbarEditor"
import { useQueryParse } from "~/hooks/useQueryParse"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

const NavbarSettingsPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(siteSchema)

  const utils = trpc.useUtils()
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const [{ content }] = trpc.site.getNavbar.useSuspenseQuery({
    id: Number(siteId),
  })
  const { mutate: saveNavbar, isPending: isSavingNavbar } =
    trpc.site.setNavbar.useMutation({
      onSuccess: async () => {
        await utils.site.getNavbar.invalidate({ id: Number(siteId) })
        toast({
          ...SETTINGS_TOAST_MESSAGES.success,
          status: "success",
        })
      },
      onError: () => {
        toast({
          status: "error",
          title: "Error saving navigation bar.",
          description: `If this persists, please report this issue at ${ISOMER_SUPPORT_EMAIL}`,
        })
      },
    })

  const [previewNavbarState, setPreviewNavbarState] = useState<
    NavbarSchemaType | undefined
  >(content)
  const isDirty = !isEqual(previewNavbarState, content)

  const handleSaveNavbar = (data: NavbarSchemaType | undefined) => {
    if (!data) return
    saveNavbar({ siteId: Number(siteId), navbar: JSON.stringify(data) })
  }

  return (
    <>
      <UnsavedSettingsGuard isDirty={isDirty} />

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
