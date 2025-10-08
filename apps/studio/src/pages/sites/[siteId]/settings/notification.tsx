import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Box, Grid, GridItem, SimpleGrid } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import { NotificationSchema } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { isEqual } from "lodash"
import { BiWrench } from "react-icons/bi"

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
import { useNewSettingsPage } from "~/hooks/useNewSettingsPage"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { Notification } from "~/schemas/site"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { ajv } from "~/utils/ajv"
import { trpc } from "~/utils/trpc"

const validateFn = ajv.compile<Notification>(NotificationSchema)

const NotificationSettingsPage: NextPageWithLayout = () => {
  const isEnabled = useNewSettingsPage()
  const router = useRouter()
  const { siteId: rawSiteId } = useQueryParse(siteSchema)
  const siteId = Number(rawSiteId)
  const trpcUtils = trpc.useUtils()
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const [{ name }] = trpc.site.getSiteName.useSuspenseQuery({
    siteId,
  })

  const notificationMutation = trpc.site.setNotification.useMutation({
    onSuccess: async () => {
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

  const [{ notification: previousNotification }] =
    trpc.site.getNotification.useSuspenseQuery({
      siteId,
    })
  const [state, setState] = useState<Notification>(
    previousNotification ?? {
      enabled: false,
      title: "",
      content: { type: "prose", content: [] },
    },
  )

  useEffect(() => {
    if (!isEnabled) {
      router.push(`/sites/${siteId}/settings`)
    }
  }, [])

  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl

  const isDirty = !isEqual(state, previousNotification)

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  const onSubmit = () =>
    notificationMutation.mutate({
      siteId,
      ...state,
    })

  return (
    <>
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
          <ErrorProvider>
            <FormBuilder<Notification>
              schema={NotificationSchema}
              validateFn={validateFn}
              data={state}
              handleChange={(data) => {
                setState(data)
              }}
            />
          </ErrorProvider>
        </GridItem>
        <GridItem colSpan={1}>
          <EditSettingsPreview siteName={name} notification={state} />
        </GridItem>
      </Grid>
    </>
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
