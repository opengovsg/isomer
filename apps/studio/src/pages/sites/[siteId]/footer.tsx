import type { FooterSchemaType } from "@opengovsg/isomer-components"
import { useState } from "react"
import { Grid, GridItem } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { siteSchema } from "~/features/editing-experience/schema"
import { EditFooterPreview } from "~/features/settings/EditFooterPreview"
import { FooterEditor } from "~/features/settings/FooterEditor"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { trpc } from "~/utils/trpc"

const FooterSettingsPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(siteSchema)
  const utils = trpc.useUtils()
  const toast = useToast()

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

  const handleSaveFooter = (data?: FooterSchemaType) => {
    if (!data) return
    saveFooter({ siteId: Number(siteId), footer: JSON.stringify(data) })
  }

  return (
    <Grid h="full" w="100%" templateColumns="minmax(37.25rem, 1fr) 1fr" gap={0}>
      <GridItem colSpan={1} overflow="auto" minW="30rem">
        <FooterEditor
          previewFooterState={previewFooterState}
          setPreviewFooterState={setPreviewFooterState}
          onSave={handleSaveFooter}
          isSaving={isSavingFooter}
        />
      </GridItem>
      <GridItem colSpan={1}>
        <EditFooterPreview
          siteId={Number(siteId)}
          previewFooterState={previewFooterState}
        />
      </GridItem>
    </Grid>
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
