import type {
  ComplexIntegrationsSettings,
  SimpleIntegrationsSettings,
} from "@opengovsg/isomer-components"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Box, Text } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import {
  ComplexIntegrationsSettingsSchema,
  SimpleIntegrationsSettingsSchema,
} from "@opengovsg/isomer-components"
import { Value } from "@sinclair/typebox/value"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { isEqual } from "lodash"
import { BiWrench } from "react-icons/bi"

import type { NextPageWithLayout } from "~/lib/types"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import {
  SettingsEditorGridItem,
  SettingsGrid,
  SettingsPreviewGridItem,
} from "~/components/Settings"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { EditSettingsPreview } from "~/features/editing-experience/components/EditSettingsPreview"
import { WidgetProvider } from "~/features/editing-experience/components/form-builder/contexts/WidgetContext"
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

export const DEFAULT_SIMPLE_INTEGRATION_SETTINGS = Value.Parse(
  SimpleIntegrationsSettingsSchema,
  Value.Default(SimpleIntegrationsSettingsSchema, {}),
)

export const DEFAULT_COMPLEX_INTEGRATION_SETTINGS = Value.Parse(
  ComplexIntegrationsSettingsSchema,
  Value.Default(ComplexIntegrationsSettingsSchema, {}),
)

const complexIntegrationSettingsValidateFn =
  ajv.compile<ComplexIntegrationsSettings>(ComplexIntegrationsSettingsSchema)
const simpleIntegrationSettingsValidateFn =
  ajv.compile<SimpleIntegrationsSettings>(SimpleIntegrationsSettingsSchema)

const IntegrationsSettingsPage: NextPageWithLayout = () => {
  const { siteId: rawSiteId } = useQueryParse(siteSchema)
  const siteId = Number(rawSiteId)
  const router = useRouter()
  const isEnabled = useNewSettingsPage()
  const trpcUtils = trpc.useUtils()
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const [
    { vica, askgov, siteGtmId, search, agencyName, url, siteName, ...rest },
  ] = trpc.site.getConfig.useSuspenseQuery({
    id: siteId,
  })

  useEffect(() => {
    if (!isEnabled) void router.replace(`/sites/${siteId}/settings`)
  }, [isEnabled, router, siteId])

  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl
  const [simpleIntegrationSettings, setSimpleIntegrationSettings] =
    useState<SimpleIntegrationsSettings>({ siteGtmId, search })

  const [complexIntegrationSettings, setComplexIntegrationSettings] =
    useState<ComplexIntegrationsSettings>({ askgov, vica })

  const isDirty = !isEqual(
    { siteGtmId, search, askgov, vica },
    { ...simpleIntegrationSettings, ...complexIntegrationSettings },
  )

  const updateSiteIntegrationsMutation =
    trpc.site.updateSiteIntegrations.useMutation({
      onSuccess: async ({ name: siteName }) => {
        toast({
          title: `Site ${siteName} updated successfully`,
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

  const onSubmit = () =>
    updateSiteIntegrationsMutation.mutate({
      siteId,
      data: {
        ...rest,
        ...simpleIntegrationSettings,
        ...complexIntegrationSettings,
        siteName,
        url: url || `https://sample.isomer.gov.sg`,
      },
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
            // TODO: disabled state using same validator
            onClick={onSubmit}
            title="Integrations"
            icon={BiWrench}
            isLoading={updateSiteIntegrationsMutation.isPending}
          />
          <Box w="100%">
            <FormBuilder<SimpleIntegrationsSettings>
              schema={SimpleIntegrationsSettingsSchema}
              validateFn={simpleIntegrationSettingsValidateFn}
              data={simpleIntegrationSettings}
              handleChange={(data) => {
                setSimpleIntegrationSettings(data)
              }}
            />
          </Box>

          {/* NOTE: Technically we can use a literal for this
              and keep it entirely in json forms, but it feels off
              to keep rendering data in json forms.
            */}
          <Box>
            <Text textStyle="subhead-2" mb="0.25rem">
              User support
            </Text>
            <Text textStyle="body-2">
              You can choose from AskGov and VICA. Make sure you’re onboarded to
              the platform before linking it to your site.
            </Text>
          </Box>
          <WidgetProvider
            activeWidget={(askgov && "askgov") ?? (vica && "vica") ?? null}
          >
            <FormBuilder<ComplexIntegrationsSettings>
              schema={ComplexIntegrationsSettingsSchema}
              validateFn={complexIntegrationSettingsValidateFn}
              data={complexIntegrationSettings}
              handleChange={(data) => {
                if (data.vica) {
                  setComplexIntegrationSettings({
                    ...data,
                    vica: {
                      ...data.vica,
                      "app-name": agencyName ?? siteName,
                    },
                  })
                } else {
                  setComplexIntegrationSettings(data)
                }
              }}
            />
          </WidgetProvider>
        </SettingsEditorGridItem>
        <SettingsPreviewGridItem>
          <EditSettingsPreview
            siteName={siteName}
            {...complexIntegrationSettings}
            {...simpleIntegrationSettings}
          />
        </SettingsPreviewGridItem>
      </SettingsGrid>
    </ErrorProvider>
  )
}

IntegrationsSettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteSettingsLayout(page)}
    />
  )
}

export default IntegrationsSettingsPage
