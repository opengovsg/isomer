import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import {
  Button,
  Center,
  FormControl,
  HStack,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import {
  FormErrorMessage,
  Infobox,
  Input,
  Toggle,
  useToast,
} from "@opengovsg/design-system-react"
import { z } from "zod"

import { UnsavedSettingModal } from "~/features/editing-experience/components/UnsavedSettingModal"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import { type NextPageWithLayout } from "~/lib/types"
import { setNotificationSchema } from "~/schemas/site"
import { AdminCmsSidebarLayout } from "~/templates/layouts/AdminCmsSidebarLayout"
import { trpc } from "~/utils/trpc"

const siteSettingsSchema = z.object({
  siteId: z.coerce.number(),
})

interface SettingFormValues {
  notificationEnabled: boolean
  notificationText: string
}

const SiteSettingsPage: NextPageWithLayout = () => {
  const toast = useToast()
  const router = useRouter()
  const trpcUtils = trpc.useUtils()
  const { siteId } = useQueryParse(siteSettingsSchema)

  const notificationMutation = trpc.site.setNotification.useMutation({
    onSuccess: () => {
      reset({
        notificationEnabled: notificationEnabled,
        notification: notification,
      })
      void trpcUtils.site.getNotification.invalidate({ siteId })
      toast({
        title: "Saved site settings!",
        description: "Check your site in 5-10 minutes to view it live.",
        status: "success",
      })
    },
    onError: (error) => {
      // TODO: Remove the console when done
      console.log(error)
      toast({
        title: "Error saving site settings!",
        description:
          "If this persists, please report this issue at support@isomer.gov.sg",
        status: "error",
      })
    },
  })

  const [previousNotification] = trpc.site.getNotification.useSuspenseQuery({
    siteId,
  })

  console.log("previous notificion", previousNotification)

  const { register, handleSubmit, watch, formState, reset } = useZodForm({
    schema: setNotificationSchema
      .extend({ notificationEnabled: z.boolean() })
      .omit({ siteId: true })
      .refine((data) => !data.notificationEnabled || data.notification, {
        message: "Notification must not be empty",
        path: ["notification"],
      }), // <- from the shared schema that the trpc procedure uses
    defaultValues: {
      notificationEnabled: previousNotification !== "",
      notification: previousNotification ? previousNotification : "",
    },
  })

  const [notificationEnabled, notification] = watch([
    "notificationEnabled",
    "notification",
  ])

  const { isDirty, errors } = formState

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [nextURL, setNextURL] = useState("")

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (isDirty) {
        router.events.off("routeChangeStart", handleRouteChange)
        setNextURL(url)
        onOpen()
        router.events.emit("routeChangeError")
        throw "Error to abort router route change. Ignore this!"
      }
    }

    if (!isOpen) {
      router.events.on("routeChangeStart", handleRouteChange)
    }
    return () => {
      router.events.off("routeChangeStart", handleRouteChange)
    }
  }, [isOpen, onOpen, router.events, isDirty])

  const onClickUpdate = handleSubmit(
    ({ notificationEnabled, notification }) => {
      notificationMutation.mutate({
        siteId,
        notification: notificationEnabled ? notification : "",
      })
    },
  )

  console.log("errors", errors)
  return (
    <>
      <UnsavedSettingModal
        isOpen={isOpen}
        onClose={onClose}
        nextURL={nextURL}
      />
      <form onSubmit={onClickUpdate}>
        <Center pt="5.5rem">
          <VStack w="48rem" alignItems="flex-start" spacing="1.5rem">
            <FormControl isInvalid={!!errors.notification}>
              <Text w="full" textStyle="h3-semibold">
                Manage site settings
              </Text>
              <Infobox
                textStyle="body-2"
                textColor="base.content.strong"
                size="sm"
              >
                Isomer Next is currently in Beta. To manage site settings that
                are not displayed here, contact Isomer Support.
              </Infobox>
              <VStack
                w="full"
                alignItems="flex-start"
                mt="3rem"
                spacing="0.75rem"
              >
                <Text textStyle="h4">General</Text>
                <HStack w="full" justifyContent="space-between" pt="0.5rem">
                  <Text textColor="base.content.strong" textStyle="subhead-1">
                    Display Site Notifications
                  </Text>

                  <Toggle
                    w="full"
                    label=""
                    {...register("notificationEnabled")}
                  />
                </HStack>
                <Text textColor="base.content.medium" textStyle="body-2">
                  The site notification will always be visible on the site until
                  it is dismissed by the user. <br />
                  Use a notification to inform users of key alerts. Do not use a
                  notification to advertise an event or a promotion.
                </Text>
                {notificationEnabled && (
                  <>
                    <Text
                      textColor="base.content.strong"
                      textStyle="subhead-1"
                      pt="0.5rem"
                    >
                      Notification Text
                    </Text>

                    <Input
                      isDisabled={!notificationEnabled}
                      placeholder="Notification should be succinct and clear"
                      maxLength={100}
                      value={notification}
                      {...register("notification", {
                        required: true,
                        minLength: {
                          value: 1,
                          message: "Notification must not be empty",
                        },
                        maxLength: {
                          value: 100,
                          message:
                            "Notification must be 100 characters or less",
                        },
                      })}
                    />
                    <Text textColor="base.content.medium" textStyle="body-2">
                      {100 - notification.length} characters left
                    </Text>
                    <FormErrorMessage>
                      {errors.notification?.message}
                    </FormErrorMessage>
                  </>
                )}
              </VStack>
              <HStack justifyContent="flex-end" w="full" gap="1.5rem" pt="4rem">
                <Text textColor="base.content.medium" textStyle="caption-2">
                  Changes will be reflected on your site immediately.
                </Text>

                <Button
                  type="submit"
                  isLoading={notificationMutation.isLoading}
                >
                  Save settings
                </Button>
              </HStack>
            </FormControl>
          </VStack>
        </Center>
      </form>
    </>
  )
}

SiteSettingsPage.getLayout = AdminCmsSidebarLayout
export default SiteSettingsPage
