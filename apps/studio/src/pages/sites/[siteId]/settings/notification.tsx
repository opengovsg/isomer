import type { NextPageWithLayout } from "~/lib/types"
import type { Notification } from "~/schemas/site"
import { Box, FormControl, HStack, Text, VStack } from "@chakra-ui/react"
import { Switch, useToast } from "@opengovsg/design-system-react"
import {
  isSiteNotificationActive,
  NotificationSchema,
  useIsNotificationDismissed,
} from "@opengovsg/isomer-components"
import { isEqual } from "lodash-es"
import { useState } from "react"
import { BiWrench } from "react-icons/bi"
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
import { ErrorProvider } from "~/features/editing-experience/components/form-builder/ErrorProvider"
import FormBuilder from "~/features/editing-experience/components/form-builder/FormBuilder"
import { EditSettingsPreview } from "~/features/editing-experience/components/preview/EditSettingsPreview"
import { UnsavedSettingModal } from "~/features/editing-experience/components/UnsavedSettingModal"
import { siteSchema } from "~/features/editing-experience/schema"
import { SettingsEditingLayout } from "~/features/settings/SettingsEditingLayout"
import { SettingsHeader } from "~/features/settings/SettingsHeader"
import { useNavigationEffect } from "~/hooks/useNavigationEffect"
import { useQueryParse } from "~/hooks/useQueryParse"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { ajv } from "~/utils/ajv"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

type SiteNotification = NonNullable<Notification["notification"]>

const notificationBodyValidator =
  ajv.compile<SiteNotification>(NotificationSchema)

const NotificationSettingsPage: NextPageWithLayout = () => {
  const { siteId: rawSiteId } = useQueryParse(siteSchema)
  const siteId = Number(rawSiteId)
  const trpcUtils = trpc.useUtils()
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const [{ name }] = trpc.site.getSiteName.useSuspenseQuery({
    siteId,
  })

  const [, setIsDismissed] = useIsNotificationDismissed()

  const notificationMutation = trpc.site.setNotification.useMutation({
    onSuccess: () => {
      void trpcUtils.site.getNotification.invalidate({ siteId })
      toast({
        ...SETTINGS_TOAST_MESSAGES.success,
        status: "success",
      })
    },
    onError: () => {
      toast({
        title: "Error saving site notification!",
        description: `If this persists, please report this issue at ${ISOMER_SUPPORT_EMAIL}`,
        status: "error",
      })
    },
  })

  const [previousNotification] = trpc.site.getNotification.useSuspenseQuery({
    siteId,
  })

  const [state, setState] = useState<Notification>(
    isSiteNotificationActive(previousNotification.notification)
      ? previousNotification
      : {},
  )
  const [snapshot, setSnapshot] = useState(state.notification)

  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl

  const isDirty = !isEqual(state, previousNotification)

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  const bannerOn = state.notification !== undefined

  const toggleBanner = () => {
    if (bannerOn) {
      setSnapshot(state.notification)
      setState({})
      // Show the banner again the next time it is turned on.
      setIsDismissed(false)
      return
    }

    setState({ notification: snapshot ?? { title: "" } })
  }

  const onSubmit = () =>
    notificationMutation.mutate({
      siteId,
      notification: state,
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
            onClick={onSubmit}
            title="Notification banner"
            icon={BiWrench}
            isLoading={notificationMutation.isPending}
            isDisabled={!isDirty}
          />
          <Box w="100%">
            <HStack
              alignItems="space-between"
              w="full"
              spacing="1rem"
              pt="0.5rem"
            >
              <FormControl display="flex" alignItems="center">
                <VStack gap="0.25rem" alignItems="start">
                  <Text textStyle="subhead-1" textColor="base.content.strong">
                    Display a banner
                  </Text>
                  <Text textStyle="body-2" textColor="base.content.medium">
                    The site notification will always be visible on the site
                    until it is dismissed by the user.
                  </Text>
                </VStack>
              </FormControl>
              <Switch size="md" isChecked={bannerOn} onChange={toggleBanner} />
            </HStack>
            {bannerOn && (
              <Box mt="1.25rem">
                <FormBuilder<SiteNotification>
                  schema={NotificationSchema}
                  validateFn={notificationBodyValidator}
                  data={state.notification}
                  handleChange={(notification) => {
                    setState({ notification })
                  }}
                />
              </Box>
            )}
          </Box>
        </SettingsEditorGridItem>
        <SettingsPreviewGridItem>
          <EditSettingsPreview
            siteName={name}
            notification={state.notification}
          />
        </SettingsPreviewGridItem>
      </SettingsGrid>
    </ErrorProvider>
  )
}

NotificationSettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteSettingsLayout(page)}
    />
  )
}

export default NotificationSettingsPage
