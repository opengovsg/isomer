import type { Static } from "@sinclair/typebox"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Box, chakra, FormControl, HStack, SimpleGrid } from "@chakra-ui/react"
import { FormLabel, Toggle, useToast } from "@opengovsg/design-system-react"
import { NotificationSchema } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { BiWrench } from "react-icons/bi"
import { z } from "zod"

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
import { useZodForm } from "~/lib/form"
import { type NextPageWithLayout } from "~/lib/types"
import { setNotificationSchema } from "~/schemas/site"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { ajv } from "~/utils/ajv"
import { trpc } from "~/utils/trpc"

type Notification = Static<typeof NotificationSchema>

const NotificationSettingsPage: NextPageWithLayout = () => {
  const isEnabled = useNewSettingsPage()
  const router = useRouter()
  const { siteId: rawSiteId } = useQueryParse(siteSchema)
  const siteId = Number(rawSiteId)
  const trpcUtils = trpc.useUtils()
  const toast = useToast()
  const [{ name }] = trpc.site.getSiteName.useSuspenseQuery({
    siteId: Number(siteId),
  })
  const validateFn = ajv.compile<Notification>(NotificationSchema)
  const [state, setState] = useState<Notification>({
    title: "",
    content: { type: "prose", content: [] },
  })

  const notificationMutation = trpc.site.setNotification.useMutation({
    onSuccess: async () => {
      reset({ notificationEnabled, notification })
      await trpcUtils.site.getNotification.invalidate({ siteId })
      toast({
        title: "Saved site settings!",
        description: "Check your site in 5-10 minutes to view it live.",
        status: "success",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
    onError: () => {
      toast({
        title: "Error saving site settings!",
        description: `If this persists, please report this issue at ${ISOMER_SUPPORT_EMAIL}`,
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const [previousNotification] = trpc.site.getNotification.useSuspenseQuery({
    siteId,
  })

  // NOTE: Refining the setNotificationSchema here instead of in site.ts since omit does not work after refine
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useZodForm({
    schema: setNotificationSchema
      .extend({ description: z.string() })
      .omit({ siteId: true })
      .refine((data) => !data.notificationEnabled || data.notification, {
        message: "Notification must not be empty",
        path: ["notification"],
      }),
    defaultValues: {
      notificationEnabled: previousNotification !== "",
      notification: previousNotification ? previousNotification : "",
      description: "",
    },
  })

  const [notificationEnabled, notification] = watch([
    "notificationEnabled",
    "notification",
  ])

  useEffect(() => {
    if (!isEnabled) {
      router.push(`/sites/${siteId}/settings`)
    }
  }, [])

  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl

  // TODO: Need to update this to include everything
  const isDirty = previousNotification !== notification

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  const onSubmit = handleSubmit(({ notificationEnabled, notification }) => {
    notificationMutation.mutate({
      siteId,
      notification: notificationEnabled ? notification : "",
      notificationEnabled: notificationEnabled,
    })
  })

  return (
    <>
      <UnsavedSettingModal
        isOpen={isOpen}
        onClose={() => setNextUrl("")}
        nextUrl={nextUrl}
      />
      <chakra.form overflow="auto" height={0} minH="100%" onSubmit={onSubmit}>
        <SimpleGrid columns={9} h="100%">
          <SettingsEditingLayout>
            <SettingsHeader
              title="Notification banner"
              icon={BiWrench}
              isLoading={notificationMutation.isPending}
            />
            <HStack
              w="full"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <FormLabel
                description={
                  "The site notification will always be visible on the site until it is dismissed by the user."
                }
                isRequired
              >
                Display a banner
              </FormLabel>
              {/* NOTE: for reasons unknown, if we put the form control  */}
              {/* over the toggle and the label,  */}
              {/* clicking on the label will also adjust the toggle */}
              <FormControl isInvalid={!!errors.notification} w="fit-content">
                <Toggle label="" {...register("notificationEnabled")} />
              </FormControl>
            </HStack>

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
          </SettingsEditingLayout>
          <Box gridColumn="6 / 10">
            <EditSettingsPreview siteName={name} />
          </Box>
        </SimpleGrid>
      </chakra.form>
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
