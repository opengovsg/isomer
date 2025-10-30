import type { AgencySettings } from "@opengovsg/isomer-components"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useToast } from "@opengovsg/design-system-react"
import { AgencySettingsSchema } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { BiWrench } from "react-icons/bi"

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
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { ajv } from "~/utils/ajv"
import { trpc } from "~/utils/trpc"

const validateFn = ajv.compile<AgencySettings>(AgencySettingsSchema)

const AgencySettingsPage: NextPageWithLayout = () => {
  const { siteId: rawSiteId } = useQueryParse(siteSchema)
  const isEnabled = useNewSettingsPage()
  const siteId = Number(rawSiteId)
  const [{ siteName, agencyName, ...rest }] =
    trpc.site.getConfig.useSuspenseQuery({
      id: siteId,
    })
  const trpcUtils = trpc.useUtils()
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const router = useRouter()

  useEffect(() => {
    if (!isEnabled) void router.replace(`/sites/${siteId}/settings`)
  }, [isEnabled, router, siteId])

  const updateSiteConfigMutation = trpc.site.updateSiteConfig.useMutation({
    onSuccess: () => {
      toast({
        ...SETTINGS_TOAST_MESSAGES.success,
        status: "success",
      })
      void trpcUtils.site.getConfig.invalidate({ id: siteId })
      void trpcUtils.site.getSiteName.invalidate({ siteId })
    },
    onError: (error) => {
      toast({
        title: "Failed to update site",
        description: error.message,
        status: "error",
      })
    },
  })

  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl
  const [state, setState] = useState<AgencySettings>({
    siteName,
    agencyName,
  })
  const isDirty = state.siteName !== siteName

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  const onSubmit = () =>
    updateSiteConfigMutation.mutate({
      siteName: state.siteName,
      siteId,
      ...rest,
    })

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
            title="Name and agency"
            icon={BiWrench}
            isLoading={updateSiteConfigMutation.isPending}
            onClick={onSubmit}
            isDisabled={!isDirty}
          />

          <ErrorProvider>
            <FormBuilder<AgencySettings>
              schema={AgencySettingsSchema}
              validateFn={validateFn}
              data={state}
              handleChange={(data) => {
                setState(data)
              }}
            />
          </ErrorProvider>
        </SettingsEditorGridItem>
        <SettingsPreviewGridItem>
          <EditSettingsPreview siteName={state.siteName} jumpToFooter />
        </SettingsPreviewGridItem>
      </SettingsGrid>
    </ErrorProvider>
  )
}

AgencySettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteSettingsLayout(page)}
    />
  )
}

export default AgencySettingsPage
