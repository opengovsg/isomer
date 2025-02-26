import { Text, VStack } from "@chakra-ui/react"
import { Infobox } from "@opengovsg/design-system-react"

export const IsomerAdminAccessBanner = () => {
  return (
    <Infobox
      textStyle="body-2"
      size="sm"
      borderWidth="1px"
      borderRadius="md"
      borderColor="base.divider.brand"
      marginBottom="0.75rem"
    >
      <VStack w="full" gap="0rem" align="start">
        <Text textStyle="subhead-2">
          All Isomer Admins have access to your site and may make changes on
          your behalf.
        </Text>
        <Text textStyle="body-2">
          All activity is logged. If you have questions about Isomer Admins,
          reach out to Isomer Support.
        </Text>
      </VStack>
    </Infobox>
  )
}
