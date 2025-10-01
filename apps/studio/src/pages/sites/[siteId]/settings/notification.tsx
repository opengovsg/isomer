import { useState } from "react"
import { Grid, GridItem } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import { NotificationSettingsSchema } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { isEmpty, isEqual } from "lodash"
import { BiWrench } from "react-icons/bi"
import { useSessionStorage } from "usehooks-ts"

import type { NextPageWithLayout } from "~/lib/types"
import type { Notification } from "~/schemas/site"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { EditSettingsPreview } from "~/features/editing-experience/components/EditSettingsPreview"
import { ErrorProvider } from "~/features/editing-experience/components/form-builder/ErrorProvider"
import FormBuilder from "~/features/editing-experience/components/form-builder/FormBuilder"
import { UnsavedSettingModal } from "~/features/editing-experience/components/UnsavedSettingModal"
import { siteSchema } from "~/features/editing-experience/schema"
import { SettingsEditingLayout } from "~/features/settings/SettingsEditingLayout"
import { SettingsHeader } from "~/features/settings/SettingsHeader"
import { useNavigationEffect } from "~/hooks/useNavigationEffect"
import { useQueryParse } from "~/hooks/useQueryParse"
import { notificationValidator } from "~/schemas/site"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { trpc } from "~/utils/trpc"

const validateFn = notificationValidator

const NotificationSettingsPage: NextPageWithLayout = () => {
  const { siteId: rawSiteId } = useQueryParse(siteSchema)
  const siteId = Number(rawSiteId)
  const trpcUtils = trpc.useUtils()
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const [{ name }] = trpc.site.getSiteName.useSuspenseQuery({
    siteId,
  })

  const [, setIsDismissed] = useSessionStorage("notification-dismissed", false)

  const notificationMutation = trpc.site.setNotification.useMutation({
    onSuccess: () => {
      void trpcUtils.site.getNotification.invalidate({ siteId })
      toast({
        title: "Saved site notification!",
        description: "Check your site in 5-10 minutes to view it live.",
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
    previousNotification.notification?.title ? previousNotification : {},
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
      <Grid
        h="full"
        w="100%"
        templateColumns="minmax(37.25rem, 1fr) 1fr"
        gap={0}
      >
        <GridItem as={SettingsEditingLayout} colSpan={1} overflow="auto">
          <SettingsHeader
            onClick={onSubmit}
            title="Notification banner"
            icon={BiWrench}
            isLoading={notificationMutation.isPending}
          />
          <FormBuilder<Notification>
            schema={NotificationSettingsSchema}
            validateFn={validateFn}
            data={state}
            handleChange={(data) => {
              setState(data)
              if (isEmpty(data)) setIsDismissed(false)
            }}
          />
        </GridItem>
        <GridItem colSpan={1}>
          <EditSettingsPreview
            siteName={name}
            notification={state.notification}
          />
        </GridItem>
      </Grid>
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
