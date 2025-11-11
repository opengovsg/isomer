import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Button, Center, HStack, Text, VStack } from "@chakra-ui/react"
import { Infobox, useToast } from "@opengovsg/design-system-react"
import { NotificationSettingsSchema } from "@opengovsg/isomer-components"
import { ResourceType } from "@prisma/client"
import { isEqual } from "lodash"
import { z } from "zod"

import type { NextPageWithLayout } from "~/lib/types"
import type { Notification } from "~/schemas/site"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { FullscreenSpinner } from "~/components/FullscreenSpinner"
import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { ErrorProvider } from "~/features/editing-experience/components/form-builder/ErrorProvider"
import FormBuilder from "~/features/editing-experience/components/form-builder/FormBuilder"
import { UnsavedSettingModal } from "~/features/editing-experience/components/UnsavedSettingModal"
import { useNavigationEffect } from "~/hooks/useNavigationEffect"
import { useNewSettingsPage } from "~/hooks/useNewSettingsPage"
import { useQueryParse } from "~/hooks/useQueryParse"
import { notificationValidator } from "~/schemas/site"
import { SiteBasicLayout } from "~/templates/layouts/SiteBasicLayout"
import { trpc } from "~/utils/trpc"

const siteSettingsSchema = z.object({
  siteId: z.coerce.number(),
})

const validateFn = notificationValidator

const SiteSettingsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const { siteId } = useQueryParse(siteSettingsSchema)
  const isEnabled = useNewSettingsPage()
  const trpcUtils = trpc.useUtils()
  const [nextUrl, setNextUrl] = useState("")

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

  useEffect(() => {
    if (isEnabled) void router.replace(`/sites/${siteId}/settings/agency`)
  }, [isEnabled, router, siteId])

  const onSubmit = () =>
    notificationMutation.mutate({
      siteId,
      notification: state,
    })

  const isDirty = !isEqual(state, previousNotification)
  const isOpen = !!nextUrl

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  return isEnabled ? (
    <FullscreenSpinner />
  ) : (
    <>
      <UnsavedSettingModal
        isOpen={isOpen}
        onClose={() => setNextUrl("")}
        nextUrl={nextUrl}
      />
      <Center px="2rem" py="3rem">
        <VStack w="48rem" alignItems="flex-start" spacing="1.5rem">
          <Text w="full" textStyle="h3-semibold">
            Manage site settings
          </Text>
          <Infobox variant="warning" textStyle="body-2" size="sm">
            Isomer Next is currently in Beta. To manage site settings that are
            not displayed here, contact Isomer Support.
          </Infobox>
          <VStack w="full" alignItems="flex-start" spacing="0.75rem">
            <Text textStyle="h4">General</Text>
            <Text textColor="base.content.medium" textStyle="body-2">
              The site notification will always be visible on the site until it
              is dismissed by the user. <br />
              Use a notification to inform users of key alerts. Do not use a
              notification to advertise an event or a promotion.
            </Text>
            <ErrorProvider>
              <FormBuilder<Notification>
                schema={NotificationSettingsSchema}
                validateFn={validateFn}
                data={state}
                handleChange={(data) => {
                  setState(data)
                }}
              />
            </ErrorProvider>
          </VStack>
          <HStack justifyContent="flex-end" w="full" gap="1.5rem">
            <Text textColor="base.content.medium" textStyle="caption-2">
              Changes will be reflected on your site immediately.
            </Text>

            <Button
              onClick={onSubmit}
              isLoading={notificationMutation.isPending}
              // NOTE: we only validate that it is non empty
              // because zod form prevents us from going over 100 characters.
              isDisabled={!state.notification?.title || !isDirty}
            >
              Save settings
            </Button>
          </HStack>
        </VStack>
      </Center>
    </>
  )
}

SiteSettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteBasicLayout(page)}
    />
  )
}

export default SiteSettingsPage
