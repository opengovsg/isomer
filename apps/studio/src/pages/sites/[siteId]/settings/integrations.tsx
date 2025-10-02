import type { Static } from "@sinclair/typebox"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Box, SimpleGrid, Text } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import {
  ComplexIntegrationsSettings,
  ComplexIntegrationsSettingsSchema,
  IntegrationsSettings,
  IntegrationsSettingsSchema,
  SimpleIntegrationsSettings,
  SimpleIntegrationsSettingsSchema,
} from "@opengovsg/isomer-components"
import { Type } from "@sinclair/typebox"
import { Value } from "@sinclair/typebox/value"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { isEqual } from "lodash"
import { BiWrench } from "react-icons/bi"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
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
import { type NextPageWithLayout } from "~/lib/types"
import { Notification } from "~/schemas/site"
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

const IntegrationsSettingsPage: NextPageWithLayout = () => {
  const isEnabled = useNewSettingsPage()
  const router = useRouter()
  const { siteId: rawSiteId } = useQueryParse(siteSchema)
  const siteId = Number(rawSiteId)
  const trpcUtils = trpc.useUtils()
  const toast = useToast()
  const [{ name }] = trpc.site.getSiteName.useSuspenseQuery({
    siteId: Number(siteId),
  })
  const validateFn = ajv.compile<IntegrationsSettings>(
    IntegrationsSettingsSchema,
  )

  useEffect(() => {
    if (!isEnabled) {
      router.push(`/sites/${siteId}/settings`)
    }
  }, [])

  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl
  const [simpleIntegrationSettings, setSimpleIntegrationSettings] =
    useState<SimpleIntegrationsSettings>(DEFAULT_SIMPLE_INTEGRATION_SETTINGS)

  const [complexIntegrationSettings, setComplexIntegrationSettings] =
    useState<ComplexIntegrationsSettings>(DEFAULT_COMPLEX_INTEGRATION_SETTINGS)

  // const isDirty = !isEqual(state, previousNotification)
  const isDirty = true

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  // const onSubmit = () =>
  //   notificationMutation.mutate({
  //     siteId,
  //     ...state,
  //   })

  const onSubmit = console.log

  return (
    <>
      <UnsavedSettingModal
        isOpen={isOpen}
        onClose={() => setNextUrl("")}
        nextUrl={nextUrl}
      />
      <Box overflow="auto" height={0} minH="100%" onSubmit={onSubmit}>
        <SimpleGrid columns={9} h="100%">
          <SettingsEditingLayout>
            <SettingsHeader
              onClick={onSubmit}
              title="Integrations"
              icon={BiWrench}
              // isLoading={notificationMutation.isPending}
              isLoading={false}
            />
            <Box>
              <ErrorProvider>
                <FormBuilder<SimpleIntegrationsSettings>
                  schema={SimpleIntegrationsSettingsSchema}
                  validateFn={validateFn}
                  data={simpleIntegrationSettings}
                  handleChange={(data) => {
                    setSimpleIntegrationSettings(data)
                  }}
                />
              </ErrorProvider>
            </Box>

            <Box>
              <Text textStyle="subhead-2" mb="0.25rem">
                User support
              </Text>
              <Text textStyle="body-2">
                You can choose from AskGov and VICA. Make sure you’re onboarded
                to the platform before linking it to your site.
              </Text>
            </Box>
            <ErrorProvider>
              <WidgetProvider>
                <FormBuilder<ComplexIntegrationsSettings>
                  schema={ComplexIntegrationsSettingsSchema}
                  validateFn={validateFn}
                  data={complexIntegrationSettings}
                  handleChange={(data) => {
                    setComplexIntegrationSettings(data)
                  }}
                />
              </WidgetProvider>
            </ErrorProvider>
          </SettingsEditingLayout>
          <Box gridColumn="6 / 10">
            <EditSettingsPreview siteName={name} />
          </Box>
        </SimpleGrid>
      </Box>
    </>
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
