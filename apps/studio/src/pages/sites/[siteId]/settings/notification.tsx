import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import {
  Box,
  Button,
  chakra,
  FormControl,
  HStack,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import {
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Infobox,
  Input,
  Toggle,
  useToast,
} from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { errors } from "openid-client"
import { BiWrench } from "react-icons/bi"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { EditSettingsPreview } from "~/features/editing-experience/components/EditSettingsPreview"
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
import { trpc } from "~/utils/trpc"

const AgencySettingsPage: NextPageWithLayout = () => {
  const isEnabled = useNewSettingsPage()
  const router = useRouter()
  const { siteId: rawSiteId } = useQueryParse(siteSchema)
  const siteId = Number(rawSiteId)
  const trpcUtils = trpc.useUtils()
  const toast = useToast()
  // TODO: Hook this to our backend
  const description = "default"

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

  const onSubmit = handleSubmit(
    ({ notificationEnabled, notification, description }) => {
      notificationMutation.mutate({
        siteId,
        notification: notificationEnabled ? notification : "",
        notificationEnabled: notificationEnabled,
      })
    },
  )

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
              canPublish={isDirty}
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

            <FormControl>
              <FormLabel isRequired>Banner title</FormLabel>

              <Input
                placeholder="Notification should be succinct and clear"
                maxLength={200}
                value={notification}
                {...register("notification", {})}
                mb="0.5rem"
              />

              {errors.notification?.message ? (
                <FormErrorMessage>
                  {errors.notification.message}
                </FormErrorMessage>
              ) : (
                <FormHelperText color="base.content.medium">
                  {/* TODO: add this as a const when designer confirms */}
                  {200 - notification.length} characters left
                </FormHelperText>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Banner description</FormLabel>

              <Textarea
                placeholder="Placeholder text"
                value={description}
                {...register("description", {})}
                mb="0.5rem"
              />

              {errors.description?.message ? (
                <FormErrorMessage>
                  {errors.description.message}
                </FormErrorMessage>
              ) : (
                <FormHelperText color="base.content.medium">
                  {/* TODO: add this as a const when designer confirms */}
                  {200 - description.length} characters left
                </FormHelperText>
              )}
            </FormControl>
          </SettingsEditingLayout>
          <Box gridColumn="6 / 10">
            <EditSettingsPreview />
          </Box>
        </SimpleGrid>
      </chakra.form>
    </>
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
