import type { NextPageWithLayout } from "~/lib/types"
import type { Notification } from "~/schemas/site"
import { Box } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import {
  isSiteNotificationActive,
  NotificationSettingsSchema,
  useIsNotificationDismissed,
} from "@opengovsg/isomer-components"
import { isEmpty, isEqual } from "lodash"
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
import { notificationValidator } from "~/schemas/site"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

const validateFn = notificationValidator

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
    previousNotification.notification &&
      isSiteNotificationActive(previousNotification.notification)
      ? previousNotification
      : {},
  )

  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl

  const isDirty = !isEqual(state, previousNotification)

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

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
            <Box mb="-0.5rem" />
            <FormBuilder<Notification>
              schema={NotificationSettingsSchema}
              validateFn={validateFn}
              data={state}
              handleChange={(data) => {
                setState(data)
                // NOTE: We have to set `isDismissed` here because
                // we need to show the notification banner again when
                // the user toggles it on
                if (isEmpty(data)) setIsDismissed(false)
              }}
            />
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
