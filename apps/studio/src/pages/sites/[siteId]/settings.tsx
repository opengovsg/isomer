import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import {
  Button,
  Center,
  chakra,
  FormControl,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  FormErrorMessage,
  Infobox,
  Input,
  Toggle,
  useToast,
} from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { UnsavedSettingModal } from "~/features/editing-experience/components/UnsavedSettingModal"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import { type NextPageWithLayout } from "~/lib/types"
import { setNotificationSchema } from "~/schemas/site"
import { AdminSidebarOnlyLayout } from "~/templates/layouts/AdminSidebarOnlyLayout"
import { trpc } from "~/utils/trpc"

const siteSettingsSchema = z.object({
  siteId: z.coerce.number(),
})

const SiteSettingsPage: NextPageWithLayout = () => {
  const toast = useToast()
  const router = useRouter()
  const trpcUtils = trpc.useUtils()
  const { siteId } = useQueryParse(siteSettingsSchema)

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
  const { register, handleSubmit, watch, formState, reset } = useZodForm({
    schema: setNotificationSchema
      .omit({ siteId: true })
      .refine((data) => !data.notificationEnabled || data.notification, {
        message: "Notification must not be empty",
        path: ["notification"],
      }),
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

  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (isDirty) {
        router.events.off("routeChangeStart", handleRouteChange)
        setNextUrl(url)
        router.events.emit("routeChangeError")
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "Error to abort router route change. Ignore this!"
      }
    }

    if (!isOpen) {
      router.events.on("routeChangeStart", handleRouteChange)
    }
    return () => {
      router.events.off("routeChangeStart", handleRouteChange)
    }
  }, [isOpen, router.events, isDirty])

  const onClickUpdate = handleSubmit(
    ({ notificationEnabled, notification }) => {
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
      <chakra.form
        onSubmit={onClickUpdate}
        overflow="auto"
        height={0}
        minH="100%"
      >
        <Center py="5.5rem" px="2rem">
          <VStack w="48rem" alignItems="flex-start" spacing="1.5rem">
            <FormControl isInvalid={!!errors.notification}>
              <Text w="full" textStyle="h3-semibold">
                Manage site settings
              </Text>
              <Infobox
                variant="warning"
                textStyle="body-2"
                size="sm"
                mt="1.75rem"
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
                    Display site notification
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
                      Notification text
                    </Text>

                    <Input
                      isDisabled={!notificationEnabled}
                      placeholder="Notification should be succinct and clear"
                      maxLength={100}
                      value={notification}
                      {...register("notification", {})}
                    />
                    {!errors.notification?.message && (
                      <Text textColor="base.content.medium" textStyle="body-2">
                        {100 - notification.length} characters left
                      </Text>
                    )}
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
                  isLoading={notificationMutation.isPending}
                  // NOTE: we only validate that it is non empty
                  // because zod form prevents us from going over 100 characters.
                  isDisabled={
                    (notificationEnabled && !notification) || !isDirty
                  }
                >
                  Save settings
                </Button>
              </HStack>
            </FormControl>
          </VStack>
        </Center>
      </chakra.form>
    </>
  )
}

SiteSettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={AdminSidebarOnlyLayout(page)}
    />
  )
}

export default SiteSettingsPage
