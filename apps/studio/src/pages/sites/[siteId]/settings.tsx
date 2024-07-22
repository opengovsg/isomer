import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button, Center, HStack, Text, VStack } from "@chakra-ui/react"
import {
  Infobox,
  Input,
  Toggle,
  useToast,
} from "@opengovsg/design-system-react"

import { AppNavbar } from "~/components/AppNavbar"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminCmsSidebarLayout } from "~/templates/layouts/AdminCmsSidebarLayout"
import { trpc } from "~/utils/trpc"

const SiteSettingsPage: NextPageWithLayout = () => {
  const toast = useToast()
  const params = useParams<{ siteId: string }>()

  const notificationMutation = trpc.site.setNotification.useMutation({
    onSuccess: () => {
      setNotificationFieldChanged(false)
      toast({
        title: "Saved site settings!",
        description: "Check your site in 5-10 minutes to view it live.",
        status: "success",
      })
    },
    onError: (error) => {
      console.log(error)
      toast({
        title: "Error saving site settings!",
        description:
          "If this persists, please report this issue at support@isomer.gov.sg",
        status: "error",
      })
    },
  })

  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const [notificationText, setNotificationText] = useState("")
  const [notificationFieldChanged, setNotificationFieldChanged] =
    useState(false)

  const remainingCharacters = 100 - notificationText.length
  const saveEnabled =
    notificationFieldChanged &&
    (!notificationEnabled || notificationText.length !== 0)

  const onClickUpdate = () => {
    // Update the site settings
    notificationMutation.mutate({
      siteId: Number(params.siteId),
      notification: notificationEnabled ? notificationText : "",
    })
  }
  const [previousNotification] = trpc.site.getNotification.useSuspenseQuery({
    siteId: Number(params.siteId),
  })
  useEffect(() => {
    setNotificationEnabled(previousNotification !== "")
    setNotificationText(previousNotification)
  }, [previousNotification])

  return (
    <>
      <Center pt="5.5rem">
        <VStack w="48rem" alignItems="flex-start" spacing="1.5rem">
          <Text w="full" textStyle="h3-semibold">
            Manage site settings
          </Text>
          <Infobox textStyle="body-2" textColor="base.content.strong" size="sm">
            Isomer Next is currently in Beta. To manage site settings that are
            not displayed here, contact Isomer Support.
          </Infobox>
          <VStack w="full" alignItems="flex-start" mt="3rem" spacing="0.75rem">
            <Text textStyle="h4">General</Text>
            <HStack w="full" justifyContent="space-between" pt="0.5rem">
              <Text textColor="base.content.strong" textStyle="subhead-1">
                Display Site Notifications
              </Text>
              <Toggle
                w="full"
                label=""
                isChecked={notificationEnabled}
                onChange={(event) => {
                  setNotificationFieldChanged(true)
                  setNotificationEnabled(event.target.checked)
                }}
              />
            </HStack>
            <Text textColor="base.content.medium" textStyle="body-2">
              The site notification will always be visible on the site until it
              is dismissed by the user. <br />
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
                  onChange={(event) => {
                    setNotificationFieldChanged(true)
                    setNotificationText(event.target.value)
                  }}
                  maxLength={100}
                  value={notificationText}
                />
                <Text textColor="base.content.medium" textStyle="body-2">
                  {remainingCharacters} characters left
                </Text>
              </>
            )}
          </VStack>
          <HStack justifyContent="flex-end" w="full" gap="1.5rem">
            {saveEnabled && (
              <Text textColor="base.content.medium" textStyle="caption-2">
                Changes will be reflected on your site immediately.
              </Text>
            )}
            <Button onClick={onClickUpdate} isDisabled={!saveEnabled}>
              Save settings
            </Button>
          </HStack>
        </VStack>
      </Center>
    </>
  )
}

SiteSettingsPage.getLayout = AdminCmsSidebarLayout
export default SiteSettingsPage
