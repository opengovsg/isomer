import { Text, VStack } from "@chakra-ui/react"
import { Infobox } from "@opengovsg/design-system-react"

export const InactiveUsersBanner = () => {
  return (
    <Infobox
      textStyle="body-2"
      size="sm"
      borderWidth="1px"
      borderRadius="md"
      borderColor="utility.feedback.warning"
      variant="warning"
      marginBottom="0.75rem"
    >
      <VStack w="full" gap="0rem" align="start">
        <Text textStyle="subhead-2">Your user list needs attention.</Text>
        <Text textStyle="body-2">
          You have users that haven’t logged in to Isomer Studio for more than
          90 days. To keep your website secure, remove people that no longer
          need access to your site.
        </Text>
      </VStack>
    </Infobox>
  )
}
