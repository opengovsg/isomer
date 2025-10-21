import type { FooterSchemaType } from "@opengovsg/isomer-components"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useToast } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import {
  SettingsEditorGridItem,
  SettingsGrid,
  SettingsPreviewGridItem,
} from "~/components/Settings"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { UnsavedSettingModal } from "~/features/editing-experience/components/UnsavedSettingModal"
import { siteSchema } from "~/features/editing-experience/schema"
import { EditFooterPreview } from "~/features/settings/EditFooterPreview"
import { FooterEditor } from "~/features/settings/FooterEditor"
import { useNavigationEffect } from "~/hooks/useNavigationEffect"
import { useNewSettingsPage } from "~/hooks/useNewSettingsPage"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { trpc } from "~/utils/trpc"

const FooterSettingsPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(siteSchema)
  const router = useRouter()
  const isEnabled = useNewSettingsPage()
  const utils = trpc.useUtils()
  const toast = useToast()
  const [nextUrl, setNextUrl] = useState("")

  const [{ content }] = trpc.site.getFooter.useSuspenseQuery({
    id: Number(siteId),
  })
  const { mutate: saveFooter, isPending: isSavingFooter } =
    trpc.site.setFooter.useMutation({
      onSuccess: async () => {
        await utils.site.getFooter.invalidate({ id: Number(siteId) })
        toast({
          status: "success",
          title: "Footer saved successfully",
          description: "Check your site in 5-10 minutes to view it live.",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

  const [previewFooterState, setPreviewFooterState] = useState<
    FooterSchemaType | undefined
  >(content)
  const isOpen = !!nextUrl
  const isDirty = JSON.stringify(previewFooterState) !== JSON.stringify(content)

  const handleSaveFooter = (data?: FooterSchemaType) => {
    if (!data) return
    saveFooter({ siteId: Number(siteId), footer: JSON.stringify(data) })
  }

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  useEffect(() => {
    if (!isEnabled) {
      void router.push(`/sites/${siteId}/settings`)
    }
  }, [isEnabled, router, siteId])

  return (
    <>
      <UnsavedSettingModal
        isOpen={isOpen}
        onClose={() => setNextUrl("")}
        nextUrl={nextUrl}
      />

      <SettingsGrid>
        <SettingsEditorGridItem>
          <FooterEditor
            previewFooterState={previewFooterState}
            setPreviewFooterState={setPreviewFooterState}
            onSave={handleSaveFooter}
            isSaving={isSavingFooter}
          />
        </SettingsEditorGridItem>
        <SettingsPreviewGridItem>
          <EditFooterPreview
            siteId={Number(siteId)}
            previewFooterState={previewFooterState}
          />
        </SettingsPreviewGridItem>
      </SettingsGrid>
    </>
  )
}

FooterSettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteSettingsLayout(page)}
    />
  )
}

export default FooterSettingsPage
