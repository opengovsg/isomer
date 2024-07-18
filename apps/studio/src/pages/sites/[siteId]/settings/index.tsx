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
import { trpc } from "~/utils/trpc"

function SiteSettingsLayout() {
  const toast = useToast()
  const params = useParams<{ siteId: string }>()

  const notificationMutation = trpc.site.setNotification.useMutation({
    onSuccess: () => {
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
  const remainingCharacters = 100 - notificationText.length

  const onClickUpdate = () => {
    // Update the site settings
    notificationMutation.mutate({
      id: Number(params.siteId),
      notificationStr: notificationEnabled ? notificationText : "",
    })
  }


  const {data} = trpc.site.getConfig.useQuery({id:Number(params.siteId)})
  }
  
  const { data } = trpc.site.getConfig.useQuery({ id: Number(params.siteId) })

  useEffect(() => {
    if (data.) {
      setNotificationEnabled(data.notificationEnabled)
      setNotificationText(data.notificationText)
    }
  }, [data])

  return (
    <>
      <AppNavbar />
      <Center pt="5.5rem">
        <VStack w="48rem" alignItems="flex-start">
          <Text w="full" textStyle="h3-semibold">
            Manage site settings
          </Text>
          <Infobox textStyle="body-2" textColor="base.content.strong">
            Isomer Next is currently in Beta. To manage site settings that are
            not displayed here, contact Isomer Support.
          </Infobox>
          <VStack w="full" alignItems="flex-start">
            <Text textStyle="h4">General</Text>
            <HStack w="full" justifyContent="space-between">
              <Text textColor="base.content.strong" textStyle="subhead-1">
                Display Site Notifications
              </Text>
              <Toggle
                w="full"
                label=""
                isChecked={notificationEnabled}
                onChange={(event) =>
                  setNotificationEnabled(event.target.checked)
                }
              />
            </HStack>
            <Text textColor="base.content.medium" textStyle="body-2">
              The site notification will always be visible on the site until it
              is dismissed by the user. <br />
              Use a notification to inform users of key alerts. Do not use a
              notification to advertise an event or a promotion.
            </Text>
            <Text textColor="base.content.strong" textStyle="subhead-1">
              Notification Text
            </Text>
            <Input
              isDisabled={!notificationEnabled}
              placeholder="Notification should be succinct and clear"
              onChange={(event) => setNotificationText(event.target.value)}
            />
            <Text textColor="base.content.medium" textStyle="body-2">
              {remainingCharacters} characters left
            </Text>
            <Button alignSelf="flex-end" onClick={onClickUpdate}>
              Save settings
            </Button>
          </VStack>
        </VStack>
      </Center>
    </>
  )
}
export default SiteSettingsLayout
