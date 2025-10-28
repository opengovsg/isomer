import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Box } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import {
  LogoSettingsSchema,
  SiteThemeSchema,
} from "@opengovsg/isomer-components"
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
import {
  LogoSettings,
  logoSettingsValidator,
  SiteTheme,
  siteThemeValidator,
} from "~/schemas/site"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { trpc } from "~/utils/trpc"

const LogoSettingsPage: NextPageWithLayout = () => {
  const { siteId: rawSiteId } = useQueryParse(siteSchema)
  const siteId = Number(rawSiteId)
  const router = useRouter()
  const isEnabled = useNewSettingsPage()
  const trpcUtils = trpc.useUtils()
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const [{ logoUrl, favicon }] = trpc.site.getConfig.useSuspenseQuery({
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
  const existingLogoSettings = { favicon, logoUrl }
  const [logoSettings, setLogoSettings] = useState<LogoSettings | undefined>(
    existingLogoSettings,
  )

  const isDirty = !isEqual(logoSettings, existingLogoSettings)

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  const onSubmit = console.log

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
            title="Logo and favicon"
            icon={BiPaint}
            isLoading={false}
            isDisabled={!isDirty}
          />
          <Box w="100%">
            <FormBuilder<LogoSettings>
              schema={LogoSettingsSchema}
              validateFn={logoSettingsValidator}
              data={logoSettings}
              handleChange={(data) => {
                setLogoSettings(data)
              }}
            />
          </Box>
        </SettingsEditorGridItem>
        <SettingsPreviewGridItem>
          <EditSettingsPreview siteName={siteName} />
        </SettingsPreviewGridItem>
      </SettingsGrid>
    </ErrorProvider>
  )
}

LogoSettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteSettingsLayout(page)}
    />
  )
}

export default LogoSettingsPage
