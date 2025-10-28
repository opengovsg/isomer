import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Box } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import { SiteThemeSchema } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { isEqual } from "lodash"
import { BiPaint } from "react-icons/bi"

import type { NextPageWithLayout } from "~/lib/types"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import {
  SettingsEditorGridItem,
  SettingsGrid,
  SettingsPreviewGridItem,
} from "~/components/Settings"
import {
  BRIEF_TOAST_SETTINGS,
  SETTINGS_TOAST_MESSAGES,
} from "~/constants/toast"
import { EditSettingsPreview } from "~/features/editing-experience/components/EditSettingsPreview"
import { ErrorProvider } from "~/features/editing-experience/components/form-builder/ErrorProvider"
import FormBuilder from "~/features/editing-experience/components/form-builder/FormBuilder"
import { UnsavedSettingModal } from "~/features/editing-experience/components/UnsavedSettingModal"
import { siteSchema } from "~/features/editing-experience/schema"
import { SettingsEditingLayout } from "~/features/settings/SettingsEditingLayout"
import { SettingsHeader } from "~/features/settings/SettingsHeader"
import { useNavigationEffect } from "~/hooks/useNavigationEffect"
import { useNewSettingsPage } from "~/hooks/useNewSettingsPage"
import { useQueryParse } from "~/hooks/useQueryParse"
import { SiteTheme, siteThemeValidator } from "~/schemas/site"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { trpc } from "~/utils/trpc"

const ColoursSettingsPage: NextPageWithLayout = () => {
  const { siteId: rawSiteId } = useQueryParse(siteSchema)
  const siteId = Number(rawSiteId)
  const router = useRouter()
  const isEnabled = useNewSettingsPage()
  const trpcUtils = trpc.useUtils()
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const [theme] = trpc.site.getTheme.useSuspenseQuery({
    id: siteId,
  })
  const [{ name: siteName }] = trpc.site.getSiteName.useSuspenseQuery({
    siteId,
  })

  useEffect(() => {
    if (!isEnabled) void router.replace(`/sites/${siteId}/settings`)
  }, [isEnabled, router, siteId])

  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl
  const [siteTheme, setSiteTheme] = useState<SiteTheme | undefined>(
    theme ?? undefined,
  )

  const isDirty = !isEqual(theme, siteTheme)

  const updateSiteIntegrationsMutation =
    trpc.site.updateSiteIntegrations.useMutation({
      onSuccess: async () => {
        toast({
          ...SETTINGS_TOAST_MESSAGES.success,
          status: "success",
        })
        await trpcUtils.site.getConfig.invalidate({ id: siteId })
      },
      onError: (error) => {
        toast({
          title: "Failed to update site",
          description: error.message,
          status: "error",
        })
      },
    })

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  const onSubmit = () => console.log(siteTheme)

  return (
    <ErrorProvider>
      <UnsavedSettingModal
        isOpen={isOpen}
        onClose={() => setNextUrl("")}
        nextUrl={nextUrl}
      />
      <SettingsGrid>
        <SettingsEditorGridItem as={SettingsEditingLayout}>
          <SettingsHeader
            onClick={onSubmit}
            title="Colours"
            icon={BiPaint}
            isLoading={updateSiteIntegrationsMutation.isPending}
            isDisabled={!isDirty}
          />
          <Box w="100%">
            <FormBuilder<SiteTheme>
              schema={SiteThemeSchema}
              validateFn={siteThemeValidator}
              data={siteTheme}
              handleChange={(data) => {
                setSiteTheme(data)
              }}
            />
          </Box>
        </SettingsEditorGridItem>
        <SettingsPreviewGridItem>
          <EditSettingsPreview siteName={siteName} theme={siteTheme} />
        </SettingsPreviewGridItem>
      </SettingsGrid>
    </ErrorProvider>
  )
}

ColoursSettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteSettingsLayout(page)}
    />
  )
}

export default ColoursSettingsPage
